# QR Menu Super App

A comprehensive QR Menu ordering system that allows multiple restaurants to create customized digital menus with QR code table ordering.

## 🌟 Features

### 🔑 Multi-Restaurant Support
- Each restaurant gets unique branding (logo, colors, slug)
- Isolated data per restaurant
- Restaurant admin authentication with JWT

### 📱 Customer Experience
- QR code links to restaurant-specific menu
- Dynamic branding application
- Mobile-responsive design
- Shopping cart functionality
- Order placement without registration

### 🧑‍🍳 Restaurant Admin Panel
- Dashboard with analytics
- Restaurant branding management
- Table and QR code management
- Menu categories and items management
- Real-time order tracking
- Order status updates

### 🎨 Dynamic Theming
- Per-restaurant color schemes
- Logo integration
- Automatic QR code generation
- Custom branding on customer menu

## 🛠️ Technology Stack

**Backend:**
- Django 4.2 with Django REST Framework
- SQLite database
- SimpleJWT for authentication
- QR code generation with `qrcode` library
- Image handling with Pillow

**Frontend:**
- React 18 with React Router
- Tailwind CSS for styling
- Axios for API calls
- Context API for state management
- Dynamic theming system

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server:**
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 📱 Usage

### For Restaurant Owners

1. **Register your restaurant:**
   - Go to `http://localhost:3000/admin/register`
   - Fill in restaurant and personal details
   - Get automatically logged in

2. **Set up your restaurant:**
   - Navigate to Restaurant Settings
   - Upload logo and set brand colors
   - Add restaurant description and contact info

3. **Create tables:**
   - Go to Tables Management
   - Add tables with numbers/names
   - Download QR codes for each table

4. **Build your menu:**
   - Create categories in Menu Management
   - Add menu items with images, prices, and descriptions
   - Set dietary indicators (vegetarian, vegan, spicy)

5. **Manage orders:**
   - Monitor incoming orders in real-time
   - Update order status (confirm, preparing, ready, served)
   - View order details and customer notes

### For Customers

1. **Scan QR code** at restaurant table
2. **Browse menu** with restaurant branding
3. **Add items** to cart
4. **Place order** with optional contact info
5. **Receive confirmation** with order number

## 🏗️ Project Structure

```
QR Menu Super app/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── qr_menu_app/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── restaurants/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       └── admin.py
└── frontend/
    ├── package.json
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── utils/
    │   └── App.js
    └── public/
```

## 📊 Database Models

### Restaurant
- Basic info (name, slug, description, contact)
- Branding (logo, colors)
- Auto-generated slug for URLs

### RestaurantUser
- Custom user model
- Linked to specific restaurant
- JWT authentication

### Table
- Table number/name
- Auto-generated QR codes
- Restaurant association

### Category & MenuItem
- Organized menu structure
- Rich item details (price, description, dietary info)
- Image support

### Order & OrderItem
- Customer order tracking
- Status workflow
- Item-level details and pricing

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register/` - Restaurant registration
- `POST /api/auth/login/` - Admin login
- `GET /api/auth/profile/` - User profile

### Restaurant Management
- `GET/PATCH /api/restaurant/` - Restaurant details
- `GET /api/restaurant/{slug}/branding/` - Public branding info

### Tables
- `GET/POST /api/tables/` - List/create tables
- `PATCH/DELETE /api/tables/{id}/` - Update/delete table

### Menu
- `GET/POST /api/categories/` - List/create categories
- `GET/POST /api/menu-items/` - List/create menu items

### Orders
- `GET /api/orders/` - List orders (admin)
- `POST /api/orders/create/` - Create order (public)
- `PATCH /api/orders/{id}/status/` - Update order status

### Public
- `GET /api/menu/{slug}/{table_id}/` - Public menu view

## 🎨 Customization

### Adding New Restaurant Features
1. Extend the `Restaurant` model
2. Update serializers and views
3. Add frontend components

### Theming
- Colors are stored per restaurant
- CSS custom properties for dynamic theming
- Tailwind classes with CSS variables

### QR Code Customization
- Modify `Table.generate_qr_code()` method
- Customize QR code appearance and URL structure

## 🔧 Configuration

### Environment Variables
Create `.env` files for different environments:

```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Production Deployment
1. Set `DEBUG=False`
2. Configure proper database (PostgreSQL recommended)
3. Set up static file serving
4. Configure CORS for your domain
5. Use environment variables for sensitive settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic multi-restaurant support
- ✅ QR code generation
- ✅ Order management
- ✅ Dynamic theming

### Phase 2 (Planned)
- [ ] Payment integration
- [ ] Real-time order notifications
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Email notifications

### Phase 3 (Future)
- [ ] Mobile app
- [ ] Inventory management
- [ ] Staff management
- [ ] Loyalty programs
- [ ] Advanced analytics

## 🐛 Known Issues

- QR codes regenerate on every table save (could be optimized)
- File uploads need proper validation
- No real-time notifications yet

## 📞 Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Built with ❤️ for restaurants embracing digital transformation** 