from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'tables', views.TableViewSet, basename='table')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'menu-items', views.MenuItemViewSet, basename='menuitem')
router.register(r'orders', views.OrderViewSet, basename='order')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/profile/', views.profile_view, name='profile'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/change-password/', views.change_password_view, name='change_password'),
    path('auth/forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('auth/reset-password/', views.reset_password_view, name='reset_password'),
    
    # Restaurant management
    path('restaurant/', views.RestaurantDetailView.as_view(), name='restaurant_detail'),
    path('restaurant/<slug:slug>/branding/', views.restaurant_branding_view, name='restaurant_branding'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard_stats'),
    
    # Public endpoints
    path('menu/<slug:slug>/<int:table_id>/', views.public_menu_view, name='public_menu'),
    path('orders/create/', views.create_order_view, name='create_order'),
    
    # Include router URLs
    path('', include(router.urls)),
] 