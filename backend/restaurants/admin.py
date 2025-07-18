from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import RestaurantUser, Restaurant, Table, Category, MenuItem, Order, OrderItem


@admin.register(RestaurantUser)
class RestaurantUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'restaurant', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'restaurant')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Restaurant Info', {'fields': ('phone', 'restaurant')}),
    )


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'city', 'phone', 'email', 'created_at')
    list_filter = ('theme', 'city', 'state', 'created_at')
    search_fields = ('name', 'slug', 'email', 'phone')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'address', 'city', 'state', 'pincode')
        }),
        ('Legal Information', {
            'fields': ('gstin', 'fssai')
        }),
        ('Branding', {
            'fields': ('logo', 'theme', 'primary_color', 'secondary_color', 'accent_color')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('number', 'name', 'restaurant', 'is_active', 'created_at')
    list_filter = ('is_active', 'restaurant', 'created_at')
    search_fields = ('number', 'name', 'restaurant__name')
    readonly_fields = ('qr_code_url', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Table Information', {
            'fields': ('restaurant', 'number', 'name', 'is_active')
        }),
        ('QR Code', {
            'fields': ('qr_code', 'qr_code_url'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'order', 'is_active', 'created_at')
    list_filter = ('is_active', 'restaurant', 'created_at')
    search_fields = ('name', 'restaurant__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Category Information', {
            'fields': ('restaurant', 'name', 'description', 'order', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'restaurant', 'price', 'is_available', 'is_vegetarian')
    list_filter = ('is_available', 'is_vegetarian', 'is_vegan', 'is_spicy', 'category', 'restaurant')
    search_fields = ('name', 'description', 'category__name', 'restaurant__name')
    readonly_fields = ('image_url', 'category_name', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('restaurant', 'category', 'name', 'description', 'price')
        }),
        ('Image', {
            'fields': ('image', 'image_url'),
            'classes': ('collapse',)
        }),
        ('Dietary Information', {
            'fields': ('is_vegetarian', 'is_vegan', 'is_spicy')
        }),
        ('Availability & Ordering', {
            'fields': ('is_available', 'preparation_time', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('menu_item_name', 'subtotal')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'restaurant', 'table', 'customer_name', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'restaurant', 'created_at', 'notification_read')
    search_fields = ('order_number', 'customer_name', 'customer_phone', 'restaurant__name')
    readonly_fields = ('order_number', 'table_number', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('restaurant', 'table', 'order_number', 'status', 'total_amount')
        }),
        ('Customer Information', {
            'fields': ('customer_name', 'customer_phone', 'customer_email')
        }),
        ('Order Details', {
            'fields': ('notes', 'notification_read')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'menu_item_name', 'quantity', 'unit_price', 'subtotal')
    list_filter = ('order__restaurant', 'order__status', 'created_at')
    search_fields = ('order__order_number', 'menu_item__name')
    readonly_fields = ('menu_item_name', 'subtotal', 'created_at') 