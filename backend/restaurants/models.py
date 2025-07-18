from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from slugify import slugify
import qrcode
from io import BytesIO
from django.core.files import File
import os


class RestaurantUser(AbstractUser):
    """Custom user model for restaurant owners/admins"""
    phone = models.CharField(max_length=15, blank=True)
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    
    def __str__(self):
        return f"{self.username} - {self.restaurant.name if self.restaurant else 'No Restaurant'}"


class Restaurant(models.Model):
    """Restaurant model with branding and business information"""
    # Basic Information
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    
    # Contact Information
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(
        max_length=6, 
        blank=True,
        validators=[RegexValidator(regex=r'^\d{6}$', message='Pin code must be exactly 6 digits')]
    )
    
    # Legal Information
    gstin = models.CharField(
        max_length=15, 
        blank=True,
        validators=[RegexValidator(
            regex=r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
            message='GSTIN must be 15 characters (format: 22AAAAA0000A1Z5)'
        )]
    )
    fssai = models.CharField(
        max_length=14, 
        blank=True,
        validators=[RegexValidator(regex=r'^\d{14}$', message='FSSAI license must be exactly 14 digits')]
    )
    
    # Branding
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    secondary_color = models.CharField(max_length=7, default='#1E40AF')
    accent_color = models.CharField(max_length=7, default='#EF4444')
    theme = models.CharField(
        max_length=20, 
        choices=[
            ('light', 'Light'),
            ('dark', 'Dark'),
            ('modern', 'Modern'),
        ],
        default='light'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def logo_url(self):
        if self.logo:
            return self.logo.url
        return None
    
    def __str__(self):
        return self.name


class Table(models.Model):
    """Table model with QR code generation"""
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tables')
    number = models.CharField(max_length=20)
    name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['restaurant', 'number']
        ordering = ['number']
    
    def generate_qr_code(self):
        """Generate QR code for the table"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # QR code will contain the menu URL
        menu_url = f"http://localhost:3000/menu/{self.restaurant.slug}/{self.id}"
        qr.add_data(menu_url)
        qr.make(fit=True)
        
        # Create QR code image
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Save to BytesIO
        buffer = BytesIO()
        qr_image.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Save to model
        filename = f'table_{self.restaurant.slug}_{self.number}_qr.png'
        self.qr_code.save(filename, File(buffer), save=False)
        buffer.close()
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Generate QR code after saving (when we have an ID)
        if is_new or not self.qr_code:
            self.generate_qr_code()
            super().save(update_fields=['qr_code'])
    
    @property
    def qr_code_url(self):
        if self.qr_code:
            return self.qr_code.url
        return None
    
    def __str__(self):
        return f"Table {self.number} - {self.restaurant.name}"


class Category(models.Model):
    """Menu category model"""
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        unique_together = ['restaurant', 'name']
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"


class MenuItem(models.Model):
    """Menu item model"""
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_items')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    
    # Dietary and preparation info
    is_available = models.BooleanField(default=True)
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_spicy = models.BooleanField(default=False)
    preparation_time = models.IntegerField(default=15, help_text="Preparation time in minutes")
    
    # Display order
    order = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['restaurant', 'category', 'name']
        ordering = ['order', 'name']
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None
    
    @property
    def category_name(self):
        return self.category.name
    
    def __str__(self):
        return f"{self.name} - {self.category.name} - {self.restaurant.name}"


class Order(models.Model):
    """Order model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]
    
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    
    # Customer information (optional)
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=15, blank=True)
    customer_email = models.EmailField(blank=True)
    
    # Order details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Notifications
    notification_read = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number
            import random
            import string
            self.order_number = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)
    
    @property
    def table_number(self):
        return self.table.number
    
    def __str__(self):
        return f"Order {self.order_number} - Table {self.table.number} - {self.restaurant.name}"


class OrderItem(models.Model):
    """Order item model"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    special_instructions = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
    
    def save(self, *args, **kwargs):
        if not self.unit_price:
            self.unit_price = self.menu_item.price
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)
    
    @property
    def menu_item_name(self):
        return self.menu_item.name
    
    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} - {self.order.order_number}" 