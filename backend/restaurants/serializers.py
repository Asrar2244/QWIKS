from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import RestaurantUser, Restaurant, Table, Category, MenuItem, Order, OrderItem


class RestaurantUserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    restaurant_name = serializers.CharField(write_only=True)

    class Meta:
        model = RestaurantUser
        fields = ('username', 'email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm', 'restaurant_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match"})
        return attrs

    def create(self, validated_data):
        # Extract restaurant name and password confirmation
        restaurant_name = validated_data.pop('restaurant_name')
        validated_data.pop('password_confirm')
        
        # Create restaurant first
        restaurant = Restaurant.objects.create(name=restaurant_name)
        
        # Create user
        user = RestaurantUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            password=validated_data['password'],
            restaurant=restaurant
        )
        
        return user


class RestaurantUserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')


class RestaurantUserProfileSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_slug = serializers.CharField(source='restaurant.slug', read_only=True)

    class Meta:
        model = RestaurantUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'restaurant_name', 'restaurant_slug')
        read_only_fields = ('id', 'username')


class RestaurantSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = '__all__'
        read_only_fields = ('slug', 'created_at', 'updated_at')

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class RestaurantBrandingSerializer(serializers.ModelSerializer):
    """Public branding info for customer-facing views"""
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = ('name', 'description', 'logo_url', 'primary_color', 'secondary_color', 'accent_color', 'theme')

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class TableSerializer(serializers.ModelSerializer):
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = '__all__'
        read_only_fields = ('restaurant', 'qr_code', 'created_at', 'updated_at')

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None

    def create(self, validated_data):
        # Get restaurant from request user
        request = self.context.get('request')
        validated_data['restaurant'] = request.user.restaurant
        return super().create(validated_data)


class MenuItemPublicSerializer(serializers.ModelSerializer):
    """Public serializer for customer menu view"""
    image_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = ('id', 'name', 'description', 'price', 'image_url', 'category', 'category_name', 
                 'is_vegetarian', 'is_vegan', 'is_spicy', 'preparation_time', 'is_available')

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemPublicSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'order', 'is_active', 'items_count', 'items', 'created_at', 'updated_at')
        read_only_fields = ('restaurant', 'created_at', 'updated_at')

    def get_items_count(self, obj):
        return obj.items.filter(is_available=True).count()

    def create(self, validated_data):
        # Get restaurant from request user
        request = self.context.get('request')
        validated_data['restaurant'] = request.user.restaurant
        return super().create(validated_data)


class MenuItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = '__all__'
        read_only_fields = ('restaurant', 'created_at', 'updated_at')

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def create(self, validated_data):
        # Get restaurant from request user
        request = self.context.get('request')
        validated_data['restaurant'] = request.user.restaurant
        return super().create(validated_data)

    def validate_category(self, value):
        # Ensure category belongs to the same restaurant
        request = self.context.get('request')
        if request and hasattr(request.user, 'restaurant'):
            if value.restaurant != request.user.restaurant:
                raise serializers.ValidationError("Category must belong to your restaurant")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('order', 'unit_price', 'subtotal', 'created_at')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('restaurant', 'order_number', 'created_at', 'updated_at')


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders from customer side"""
    items = serializers.ListField(write_only=True)
    table_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Order
        fields = ('customer_name', 'customer_phone', 'customer_email', 'notes', 'items', 'table_id')

    def validate_table_id(self, value):
        try:
            table = Table.objects.get(id=value, is_active=True)
            return table
        except Table.DoesNotExist:
            raise serializers.ValidationError("Invalid table")

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must contain at least one item")
        
        for item in value:
            if not all(k in item for k in ['menu_item', 'quantity']):
                raise serializers.ValidationError("Each item must have menu_item and quantity")
            
            try:
                menu_item = MenuItem.objects.get(id=item['menu_item'], is_available=True)
                item['menu_item_obj'] = menu_item
            except MenuItem.DoesNotExist:
                raise serializers.ValidationError(f"Invalid menu item: {item['menu_item']}")
            
            if item['quantity'] <= 0:
                raise serializers.ValidationError("Quantity must be greater than 0")
        
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        table = validated_data.pop('table_id')
        
        # Calculate total
        total_amount = 0
        for item in items_data:
            menu_item = item['menu_item_obj']
            total_amount += menu_item.price * item['quantity']
        
        # Create order
        order = Order.objects.create(
            restaurant=table.restaurant,
            table=table,
            total_amount=total_amount,
            **validated_data
        )
        
        # Create order items
        for item in items_data:
            menu_item = item['menu_item_obj']
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=item['quantity'],
                unit_price=menu_item.price,
                special_instructions=item.get('special_instructions', '')
            )
        
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('status',)

    def validate_status(self, value):
        if value not in dict(Order.STATUS_CHOICES):
            raise serializers.ValidationError("Invalid status")
        return value


class OrderEditSerializer(serializers.ModelSerializer):
    """Serializer for editing orders from admin side"""
    items = serializers.ListField(write_only=True, required=False)

    class Meta:
        model = Order
        fields = ('customer_name', 'customer_phone', 'notes', 'items')

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must contain at least one item")
        
        for item in value:
            if not all(k in item for k in ['menu_item', 'quantity']):
                raise serializers.ValidationError("Each item must have menu_item and quantity")
            
            try:
                menu_item = MenuItem.objects.get(id=item['menu_item'])
                item['menu_item_obj'] = menu_item
            except MenuItem.DoesNotExist:
                raise serializers.ValidationError(f"Invalid menu item: {item['menu_item']}")
            
            if item['quantity'] <= 0:
                raise serializers.ValidationError("Quantity must be greater than 0")
        
        return value

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update items if provided
        if items_data is not None:
            # Delete existing items
            instance.items.all().delete()
            
            # Create new items and calculate total
            total_amount = 0
            for item in items_data:
                menu_item = item['menu_item_obj']
                OrderItem.objects.create(
                    order=instance,
                    menu_item=menu_item,
                    quantity=item['quantity'],
                    unit_price=menu_item.price,
                    special_instructions=item.get('special_instructions', '')
                )
                total_amount += menu_item.price * item['quantity']
            
            instance.total_amount = total_amount
        
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Passwords don't match"})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = RestaurantUser.objects.get(email=value)
            return value
        except RestaurantUser.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address")


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Passwords don't match"})
        return attrs

    def validate_email(self, value):
        try:
            user = RestaurantUser.objects.get(email=value)
            return value
        except RestaurantUser.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address")


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    todays_orders = serializers.IntegerField()
    todays_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_tables = serializers.IntegerField()
    total_menu_items = serializers.IntegerField()
    recent_orders = OrderSerializer(many=True)


class PublicMenuSerializer(serializers.Serializer):
    """Serializer for public menu view"""
    restaurant = RestaurantBrandingSerializer()
    table = TableSerializer()
    categories = CategorySerializer(many=True)
    menu_items = MenuItemPublicSerializer(many=True) 