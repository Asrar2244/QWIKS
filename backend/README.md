# QR Menu Django Backend

A comprehensive Django REST API backend for the QR Menu Super App that allows multiple restaurants to create customized digital menus with QR code table ordering.

## 🌟 Features

- **Multi-Restaurant Support**: Each restaurant gets unique branding and isolated data
- **JWT Authentication**: Secure token-based authentication for restaurant admins
- **Restaurant Management**: Complete CRUD for restaurant details, branding, and settings
- **Table Management**: QR code generation and table management
- **Menu Management**: Categories and menu items with image support
- **Order Management**: Real-time order tracking and status updates
- **Public API**: Customer-facing endpoints for menu viewing and order placement
- **Admin Panel**: Django admin interface for easy management

## 🛠️ Technology Stack

- **Django 4.2**: Python web framework
- **Django REST Framework**: API development
- **Simple JWT**: JWT authentication
- **SQLite**: Database (development)
- **Pillow**: Image processing
- **QRCode**: QR code generation
- **Django CORS Headers**: Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Linux/Mac
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup the project:**
   ```bash
   python start.py setup
   ```
   This will:
   - Install all dependencies
   - Create necessary directories
   - Run database migrations
   - Optionally create a superuser

5. **Start the development server:**
   ```bash
   python start.py server
   # OR
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

## 📊 Database Models

### RestaurantUser
Custom user model for restaurant owners/admins
- Extends Django's AbstractUser
- Links to a specific restaurant
- JWT authentication

### Restaurant
Restaurant model with branding and business information
- Basic info (name, slug, description)
- Contact info (phone, email, address)
- Legal info (GSTIN, FSSAI)
- Branding (logo, colors, theme)

### Table
Table model with QR code generation
- Table number and name
- Auto-generated QR codes
- Restaurant association

### Category & MenuItem
Organized menu structure
- Categories with ordering
- Menu items with rich details
- Image support and dietary indicators

### Order & OrderItem
Customer order tracking
- Order status workflow
- Customer information
- Item-level details and pricing

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register/` - Restaurant registration
- `POST /api/auth/login/` - Admin login
- `GET /api/auth/profile/` - User profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/forgot-password/` - Forgot password
- `POST /api/auth/reset-password/` - Reset password

### Restaurant Management
- `GET /api/restaurant/` - Get restaurant details
- `PATCH /api/restaurant/` - Update restaurant details
- `GET /api/restaurant/{slug}/branding/` - Public branding info

### Tables
- `GET /api/tables/` - List tables
- `POST /api/tables/` - Create table
- `PATCH /api/tables/{id}/` - Update table
- `DELETE /api/tables/{id}/` - Delete table

### Menu Management
- `GET /api/categories/` - List categories
- `POST /api/categories/` - Create category
- `PATCH /api/categories/{id}/` - Update category
- `DELETE /api/categories/{id}/` - Delete category
- `GET /api/menu-items/` - List menu items
- `POST /api/menu-items/` - Create menu item
- `PATCH /api/menu-items/{id}/` - Update menu item
- `DELETE /api/menu-items/{id}/` - Delete menu item

### Orders
- `GET /api/orders/` - List orders (admin)
- `POST /api/orders/create/` - Create order (public)
- `PATCH /api/orders/{id}/status/` - Update order status
- `PUT /api/orders/{id}/edit/` - Edit order
- `PATCH /api/orders/{id}/mark-read/` - Mark notification read
- `GET /api/orders/notifications/` - Get unread notifications

### Public Endpoints
- `GET /api/menu/{slug}/{table_id}/` - Public menu view
- `POST /api/orders/create/` - Create order (customers)

### Dashboard
- `GET /api/dashboard/stats/` - Dashboard statistics

## 🔧 Configuration

### Environment Variables
Create a `.env` file for production with:

```bash
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (for production)
DATABASE_URL=postgres://user:password@localhost:5432/qrmenu

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Media Files
The backend handles image uploads for:
- Restaurant logos (`/media/restaurant_logos/`)
- QR codes (`/media/qr_codes/`)
- Menu item images (`/media/menu_items/`)

## 🎨 Frontend Integration

The backend is designed to work with the React frontend. Key integration points:

### Authentication Flow
1. Register restaurant admin
2. Login to get JWT tokens
3. Use tokens for authenticated requests
4. Refresh tokens as needed

### Public Menu Flow
1. Customer scans QR code
2. Frontend calls `/api/menu/{slug}/{table_id}/`
3. Display menu with restaurant branding
4. Create order via `/api/orders/create/`

### Admin Dashboard Flow
1. Authenticated admin manages restaurant
2. Real-time order notifications
3. Order status updates
4. Menu and table management

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set all required env vars
2. **Database**: Migrate to PostgreSQL for production
3. **Static Files**: Configure static file serving
4. **Media Files**: Set up proper media file storage
5. **Security**: Update SECRET_KEY, disable DEBUG
6. **CORS**: Configure proper CORS settings
7. **HTTPS**: Enable SSL/HTTPS

### Example Production Settings

```python
# settings.py (production)
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'qrmenu_db',
        'USER': 'qrmenu_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Use proper file storage for media files
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

## 🧪 Testing

Run tests with:
```bash
python manage.py test
```

## 📝 API Documentation

### Authentication Required
Most endpoints require JWT authentication. Include the token in headers:
```
Authorization: Bearer <your_access_token>
```

### Example API Calls

#### Register Restaurant
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "restaurant_admin",
    "email": "admin@restaurant.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "secure_password",
    "password_confirm": "secure_password",
    "restaurant_name": "Amazing Restaurant"
  }'
```

#### Create Table
```bash
curl -X POST http://localhost:8000/api/tables/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "1",
    "name": "Window Table"
  }'
```

#### Create Order (Public)
```bash
curl -X POST http://localhost:8000/api/orders/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "customer_name": "John Customer",
    "customer_phone": "+1234567890",
    "notes": "No spicy food",
    "items": [
      {
        "menu_item": 1,
        "quantity": 2,
        "special_instructions": "Extra cheese"
      }
    ]
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please check the issues page or contact the development team. 