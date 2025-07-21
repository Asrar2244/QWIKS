from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.db import models
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from .models import RestaurantUser, Restaurant, Table, Category, MenuItem, Order, OrderItem
from .serializers import (
    RestaurantUserRegistrationSerializer, RestaurantUserLoginSerializer, RestaurantUserProfileSerializer,
    RestaurantSerializer, RestaurantBrandingSerializer, TableSerializer, CategorySerializer,
    MenuItemSerializer, MenuItemPublicSerializer, OrderSerializer, OrderCreateSerializer,
    OrderStatusUpdateSerializer, OrderEditSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, DashboardStatsSerializer, PublicMenuSerializer
)


class RestaurantOwnerPermission(permissions.BasePermission):
    """Custom permission to ensure user can only access their restaurant's data"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'restaurant')
    
    def has_object_permission(self, request, view, obj):
        # Check if object belongs to user's restaurant
        if hasattr(obj, 'restaurant'):
            return obj.restaurant == request.user.restaurant
        elif hasattr(obj, 'order') and hasattr(obj.order, 'restaurant'):
            return obj.order.restaurant == request.user.restaurant
        return False


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new restaurant user"""
    serializer = RestaurantUserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': RestaurantUserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login a restaurant user"""
    serializer = RestaurantUserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': RestaurantUserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get user profile"""
    serializer = RestaurantUserProfileSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """Send password reset email (simplified for demo)"""
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        # In production, you would send an email with reset token
        return Response({'message': 'Password reset email sent'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """Reset password (simplified for demo)"""
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = RestaurantUser.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password reset successfully'})
        except RestaurantUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Restaurant Views
class RestaurantDetailView(generics.RetrieveUpdateAPIView):
    """Get and update restaurant details"""
    serializer_class = RestaurantSerializer
    permission_classes = [RestaurantOwnerPermission]
    
    def get_object(self):
        return self.request.user.restaurant


@cache_page(60 * 5, key_prefix='branding')
@api_view(['GET'])
@permission_classes([AllowAny])
def restaurant_branding_view(request, slug):
    """Get public restaurant branding information"""
    restaurant = get_object_or_404(Restaurant, slug=slug)
    serializer = RestaurantBrandingSerializer(restaurant, context={'request': request})
    return Response(serializer.data)


# Table Views
class TableViewSet(viewsets.ModelViewSet):
    """ViewSet for table management"""
    serializer_class = TableSerializer
    permission_classes = [RestaurantOwnerPermission]
    
    def get_queryset(self):
        return Table.objects.filter(restaurant=self.request.user.restaurant)

    @method_decorator(cache_page(60 * 2, key_prefix='tables'))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


# Category Views
class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for category management"""
    serializer_class = CategorySerializer
    permission_classes = [RestaurantOwnerPermission]
    
    def get_queryset(self):
        return Category.objects.filter(restaurant=self.request.user.restaurant)

    @method_decorator(cache_page(60 * 2, key_prefix='categories'))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


# Menu Item Views
class MenuItemViewSet(viewsets.ModelViewSet):
    """ViewSet for menu item management"""
    serializer_class = MenuItemSerializer
    permission_classes = [RestaurantOwnerPermission]
    
    def get_queryset(self):
        queryset = MenuItem.objects.filter(restaurant=self.request.user.restaurant)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    @method_decorator(cache_page(60 * 2, key_prefix='menu_items'))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


# Order Views
class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for order management"""
    serializer_class = OrderSerializer
    permission_classes = [RestaurantOwnerPermission]
    
    def get_queryset(self):
        queryset = Order.objects.filter(restaurant=self.request.user.restaurant)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'])
    def edit(self, request, pk=None):
        """Edit order details"""
        order = self.get_object()
        serializer = OrderEditSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderSerializer(order).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark order notification as read"""
        order = self.get_object()
        order.notification_read = True
        order.save()
        return Response({'message': 'Notification marked as read'})
    
    @action(detail=False, methods=['get'])
    def notifications(self, request):
        """Get unread order notifications"""
        unread_orders = Order.objects.filter(
            restaurant=request.user.restaurant,
            notification_read=False
        ).order_by('-created_at')
        serializer = OrderSerializer(unread_orders, many=True, context={'request': request})
        return Response(serializer.data)

    @method_decorator(cache_page(30, key_prefix='orders_list'))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


# Public Order Creation
@api_view(['POST'])
@permission_classes([AllowAny])
def create_order_view(request):
    """Create a new order (public endpoint)"""
    serializer = OrderCreateSerializer(data=request.data)
    if serializer.is_valid():
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Public Menu View
@cache_page(60 * 2, key_prefix='public_menu')
@api_view(['GET'])
@permission_classes([AllowAny])
def public_menu_view(request, slug, table_id):
    """Get public menu for a restaurant and table"""
    try:
        restaurant = Restaurant.objects.get(slug=slug)
        table = Table.objects.get(id=table_id, restaurant=restaurant, is_active=True)
        
        # Get categories with prefetched, filtered, and ordered menu items
        categories = Category.objects.filter(
            restaurant=restaurant, 
            is_active=True
        ).prefetch_related(
            models.Prefetch(
                'items',
                queryset=MenuItem.objects.order_by('order', 'name')
            )
        ).order_by('order', 'name')

        data = {
            'restaurant': RestaurantBrandingSerializer(restaurant, context={'request': request}).data,
            'table': TableSerializer(table, context={'request': request}).data,
            'categories': CategorySerializer(categories, many=True, context={'request': request}).data,
        }
        
        return Response(data)
    
    except Restaurant.DoesNotExist:
        return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
    except Table.DoesNotExist:
        return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)


# Dashboard Views
@cache_page(60, key_prefix='dashboard_stats')
@api_view(['GET'])
@permission_classes([RestaurantOwnerPermission])
def dashboard_stats_view(request):
    """Get comprehensive dashboard statistics"""
    restaurant = request.user.restaurant
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Basic counts
    total_orders = Order.objects.filter(restaurant=restaurant).count()
    pending_orders = Order.objects.filter(restaurant=restaurant, status='pending').count()
    todays_orders = Order.objects.filter(restaurant=restaurant, created_at__date=today).count()
    weeks_orders = Order.objects.filter(restaurant=restaurant, created_at__date__gte=week_ago).count()
    
    # Revenue calculations
    total_revenue = Order.objects.filter(
        restaurant=restaurant,
        status__in=['confirmed', 'preparing', 'ready', 'served']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    todays_revenue = Order.objects.filter(
        restaurant=restaurant, 
        created_at__date=today,
        status__in=['confirmed', 'preparing', 'ready', 'served']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    weeks_revenue = Order.objects.filter(
        restaurant=restaurant,
        created_at__date__gte=week_ago,
        status__in=['confirmed', 'preparing', 'ready', 'served']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Table statistics
    total_tables = Table.objects.filter(restaurant=restaurant).count()
    active_tables = Table.objects.filter(restaurant=restaurant, is_active=True).count()
    
    # Menu statistics
    total_menu_items = MenuItem.objects.filter(restaurant=restaurant).count()
    available_menu_items = MenuItem.objects.filter(restaurant=restaurant, is_available=True).count()
    
    # Average order value
    avg_order_value = 0
    if total_orders > 0:
        avg_order_value = total_revenue / total_orders
    
    # Recent orders for activity feed
    recent_orders = Order.objects.filter(restaurant=restaurant).order_by('-created_at')[:5]
    
    # Restaurant info
    restaurant_data = {
        'name': restaurant.name,
        'slug': restaurant.slug,
        'description': restaurant.description,
        'phone': restaurant.phone,
        'email': restaurant.email,
        'address': restaurant.address,
    }
    
    # Calculate trends (simplified - you can make this more sophisticated)
    yesterday = today - timedelta(days=1)
    yesterdays_orders = Order.objects.filter(restaurant=restaurant, created_at__date=yesterday).count()
    yesterdays_revenue = Order.objects.filter(
        restaurant=restaurant,
        created_at__date=yesterday,
        status__in=['confirmed', 'preparing', 'ready', 'served']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Simple trend calculation
    order_trend = 0
    revenue_trend = 0
    if yesterdays_orders > 0:
        order_trend = ((todays_orders - yesterdays_orders) / yesterdays_orders) * 100
    if yesterdays_revenue > 0:
        revenue_trend = ((todays_revenue - yesterdays_revenue) / yesterdays_revenue) * 100
    
    data = {
        'restaurant': restaurant_data,
        'orders': {
            'total': total_orders,
            'pending': pending_orders,
            'today': todays_orders,
            'week': weeks_orders,
            'trend': round(order_trend, 1)
        },
        'revenue': {
            'total': float(total_revenue),
            'today': float(todays_revenue),
            'week': float(weeks_revenue),
            'trend': round(revenue_trend, 1)
        },
        'tables': {
            'total': total_tables,
            'active': active_tables
        },
        'menu_items': {
            'total': total_menu_items,
            'available': available_menu_items
        },
        'avg_order_value': float(avg_order_value),
        'recent_orders': OrderSerializer(recent_orders, many=True, context={'request': request}).data
    }
    
    return Response(data) 