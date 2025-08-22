import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI, handleAPIError } from '../../utils/api';

const CartModal = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  totalPrice,
  totalItems,
  customerData,
  onCustomerChange,
  onPlaceOrder,
  isOrderLoading,
  tableNumber,
  restaurant,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 theme-modal-overlay">
      {/* Bottom Sheet */}
      <div
        className="w-full max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl theme-modal
          transition-transform duration-300
          animate-slideup
          max-h-[90vh] overflow-hidden
          relative"
        style={{
          // For mobile, make it full width, for desktop, max-w-lg
          width: '100%',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Your Order</h2>
              <p className="text-blue-100">Table {tableNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
            >
              <span className="text-lg sm:text-xl">✕</span>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto theme-modal-content">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 theme-modal-title">Your cart is empty</h3>
              <p className="text-gray-600 mb-6 theme-modal-text">Add some delicious items to get started!</p>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.menu_item} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl theme-cart-item">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm theme-item-name">{item.menu_item_name}</h4>
                      <p className="text-xs text-gray-600 theme-item-price">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUpdateQuantity(item.menu_item, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors duration-200 text-sm"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-semibold text-sm theme-quantity">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.menu_item, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors duration-200 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Info */}
              <div className="space-y-3 mb-6 p-3 bg-blue-50 rounded-xl theme-contact-section">
                <h3 className="font-semibold text-gray-900 flex items-center text-sm theme-contact-title">
                  <span className="mr-2">👤</span> Contact Information
                </h3>
                <input
                  type="text"
                  name="customer_name"
                  placeholder="Your name (optional)"
                  value={customerData.customer_name}
                  onChange={onCustomerChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm theme-contact-input"
                />
                <input
                  type="tel"
                  name="customer_phone"
                  placeholder="Your phone number (optional)"
                  value={customerData.customer_phone}
                  onChange={onCustomerChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm theme-contact-input"
                />
                <textarea
                  name="special_instructions"
                  placeholder="Special instructions (optional)"
                  value={customerData.special_instructions || ''}
                  onChange={onCustomerChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 resize-none text-sm theme-contact-input"
                  rows={2}
                />
              </div>

              {/* Total */}
              <div className="bg-gray-900 text-white p-3 rounded-xl mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Total ({totalItems} items)</span>
                  <span className="text-xl font-bold">₹{totalPrice}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={onPlaceOrder}
                disabled={isOrderLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOrderLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    Placing Order...
                  </div>
                ) : (
                  `Place Order - ₹${totalPrice}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


const CustomerMenu = () => {
  const { restaurantSlug, tableId } = useParams();
  const navigate = useNavigate();
  
  // Debug logging
  console.log('🎯 CustomerMenu Component Loaded');
  console.log('📍 Route Params:', { restaurantSlug, tableId });
  console.log('🌐 Current URL:', window.location.href);
  
  const [menuData, setMenuData] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_phone: ''
  });
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [vegFilter, setVegFilter] = useState('all'); // 'all', 'veg', 'non-veg'

  const fetchMenu = useCallback(async () => {
    try {
      console.log('🔍 Fetching menu for:', { restaurantSlug, tableId });
      const response = await publicAPI.getMenu(restaurantSlug, tableId);
      console.log('✅ Menu data received:', response.data);
      setMenuData(response.data);
    } catch (error) {
      console.error('❌ Menu fetch error:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  }, [restaurantSlug, tableId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Apply dynamic theming
  useEffect(() => {
    if (menuData?.restaurant) {
      console.log('Applying theme:', menuData.restaurant.theme); // Debug log
      console.log('Restaurant data:', menuData.restaurant); // Debug log
      
      const root = document.documentElement;
      root.style.setProperty('--restaurant-primary', menuData.restaurant.primary_color);
      root.style.setProperty('--restaurant-secondary', menuData.restaurant.secondary_color);
      root.style.setProperty('--restaurant-accent', menuData.restaurant.accent_color);

      // Remove all theme classes first
      document.body.classList.remove('theme-light', 'theme-dark', 'theme-modern', 'dark');
      
      // Apply theme classes
      if (menuData.restaurant.theme === 'dark') {
        document.body.classList.add('theme-dark', 'dark');
        console.log('Applied DARK theme classes to body');
      } else if (menuData.restaurant.theme === 'modern') {
        document.body.classList.add('theme-modern');
        console.log('Applied MODERN theme classes to body');
      } else {
        document.body.classList.add('theme-light');
        console.log('Applied LIGHT theme classes to body');
      }
      
      // Log current body classes for debugging
      console.log('Current body classes:', document.body.className);
    }
    return () => {
      document.body.classList.remove('theme-light', 'theme-dark', 'theme-modern', 'dark');
    };
  }, [menuData]);

  // Add a refresh function for testing
  const refreshMenu = async () => {
    setLoading(true);
    await fetchMenu();
  };

  const addToCart = (item, event) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menu_item === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.menu_item === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, {
          menu_item: item.id,
          menu_item_name: item.name,
          quantity: 1,
          price: parseFloat(item.price),
          special_instructions: ''
        }];
      }
    });

    // Add visual feedback
    if (event && event.target) {
      const button = event.target;
      button.classList.add('animate-pulse');
      setTimeout(() => button.classList.remove('animate-pulse'), 300);
    }
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.menu_item !== itemId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.menu_item === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to your cart first!');
      return;
    }

    setOrderLoading(true);
    try {
      const orderData = {
        table_id: parseInt(tableId, 10), // Ensure tableId is an integer
        items: cart,
        customer_name: customerInfo.customer_name,
        customer_phone: customerInfo.customer_phone,
        notes: customerInfo.special_instructions || ''
      };

      console.log('Sending order data:', orderData); // Debug log
      const response = await publicAPI.createOrder(orderData);
      console.log('Order response:', response.data); // Debug log
      
      // Navigate to order confirmation with the order number
      navigate(`/order-confirmation/${response.data.order_number}`, { 
        state: { 
          orderData: { ...orderData, total: getTotalPrice() },
          restaurant: menuData.restaurant,
          table: menuData.table
        }
      });
    } catch (error) {
      console.error('Order creation error:', error.response?.data); // Debug log
      alert(handleAPIError(error));
    } finally {
      setOrderLoading(false);
    }
  };

  // Get selected category data
  const selectedCategoryData = menuData?.categories?.find(cat => cat.id === selectedCategory);

  // Filter items based on search query and veg filter
  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      let items = (menuData?.categories || []).flatMap(cat => cat.items || []);
      // Filter by search query
      if (searchQuery) {
        items = items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      // Filter by vegetarian status
      if (vegFilter !== 'all') {
        items = items.filter(item => {
          if (vegFilter === 'veg') return item.is_vegetarian;
          if (vegFilter === 'non-veg') return !item.is_vegetarian;
          return true;
        });
      }
      return items;
    }
    if (!selectedCategoryData?.items) return [];
    
    let items = selectedCategoryData.items;
    
    // Filter by search query
    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by vegetarian status
    if (vegFilter !== 'all') {
      items = items.filter(item => {
        if (vegFilter === 'veg') return item.is_vegetarian;
        if (vegFilter === 'non-veg') return !item.is_vegetarian;
        return true;
      });
    }
    
    return items;
  };

  const filteredItems = getFilteredItems();

  const MenuItemCard = ({ item }) => {
    const cartItem = cart.find(cartItem => cartItem.menu_item === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200">
      {item.image_url && (
        <div className="relative overflow-hidden">
          <img 
            src={item.image_url} 
            alt={item.name}
              className={`w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition-transform duration-300 ${!item.is_available ? 'grayscale' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-all duration-300"></div>
          {!item.is_available && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-white text-gray-800 px-3 py-1 rounded-full font-bold text-sm shadow-md">
                Unavailable
              </span>
            </div>
          )}
        </div>
      )}
      
        <div className={`p-3 sm:p-4 ${!item.is_available ? 'opacity-60' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
              {item.name}
            </h3>
            <div className="flex items-center space-x-1 mb-1">
              {item.is_vegetarian && (
                <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🌱
                </span>
              )}
              {item.is_vegan && (
                <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🌿
                </span>
              )}
              {item.is_spicy && (
                <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  🌶️
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-bold text-primary">₹{item.price}</div>
          </div>
        </div>
        
        {item.description && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3 leading-relaxed line-clamp-2">{item.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          {item.preparation_time && (
            <div className="flex items-center text-gray-500 text-xs">
              <span className="mr-1">⏱️</span>
                <span>{item.preparation_time} min</span>
            </div>
          )}
            {quantity > 0 ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateCartQuantity(item.id, quantity - 1)}
                  className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors duration-200 text-base"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-primary text-sm">{quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.id, quantity + 1)}
                  className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors duration-200 text-base"
                >
                  +
                </button>
              </div>
            ) : (
          <button
            onClick={(e) => addToCart(item, e)}
            disabled={!item.is_available}
                className="px-3 py-1 text-xs sm:text-sm font-semibold text-white bg-primary rounded-full hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Add
          </button>
            )}
        </div>
      </div>
    </div>
  );
  };

  const CategoryButton = ({ category }) => (
    <button
      onClick={() => {
        setSelectedCategory(category.id);
        setShowCategoryMenu(false);
      }}
      className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
        selectedCategory === category.id
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {category.name}
      {category.items?.length > 0 && (
        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
          selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-100'
        }`}>
          {category.items.length}
        </span>
      )}
    </button>
  );

  const CategoryMenuModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 theme-modal-overlay">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl theme-modal">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Select Category</h2>
            <button
              onClick={() => setShowCategoryMenu(false)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto theme-modal-content">
          <div className="space-y-2">
            {menuData?.categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setShowCategoryMenu(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 theme-category-item ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium theme-category-name">{category.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full theme-item-count">
                    {category.items?.length || 0} items
                  </span>
                </div>
                {category.description && (
                  <p className="text-xs text-gray-500 mt-1 theme-category-description">{category.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4 w-12 h-12"></div>
          <p className="text-xl font-semibold text-gray-700">Loading menu...</p>
          <p className="text-gray-500">Please wait while we prepare your dining experience</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-100 rounded">
            <p><strong>Debug Info:</strong></p>
            <p>Restaurant Slug: {restaurantSlug}</p>
            <p>Table ID: {tableId}</p>
            <p>API URL: {process.env.NODE_ENV === 'production' ? 'https://qwiks-backend.onrender.com/api' : '/api'}/menu/{restaurantSlug}/{tableId}/</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm theme-header">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {menuData?.restaurant?.logo_url && (
                <img 
                  src={menuData.restaurant.logo_url} 
                  alt={menuData.restaurant.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 theme-title">{menuData?.restaurant?.name}</h1>
                <p className="text-sm text-gray-600 theme-subtitle">Table {menuData?.table?.number}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Refresh Button for Testing */}
              <button
                onClick={refreshMenu}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 theme-button"
                title="Refresh Menu"
              >
                <svg className="w-5 h-5 text-gray-600 theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>

              {/* Category Menu Button */}
              <button
                onClick={() => setShowCategoryMenu(true)}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 theme-button"
                title="Categories"
              >
                <svg className="w-5 h-5 text-gray-600 theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>

              {cart.length > 0 && (
                <button
                  onClick={() => setShowCart(true)}
                  className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span className="flex items-center">
                    <span className="mr-2">🛒</span>
                    <span className="hidden sm:inline">Cart</span> ({getTotalItems()})
                  </span>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm theme-search-input"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 theme-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 theme-clear-button"
              >
                ✕
              </button>
            )}
          </div>

          {/* Veg/Non-Veg Filter - Zomato Style */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-4 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <button
                onClick={() => setVegFilter('all')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
                  vegFilter === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>All</span>
              </button>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <button
                onClick={() => setVegFilter('veg')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
                  vegFilter === 'veg' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-700 hover:bg-green-50'
                }`}
              >
                <div className={`w-4 h-4 border-2 flex items-center justify-center ${
                  vegFilter === 'veg' ? 'border-white' : 'border-green-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    vegFilter === 'veg' ? 'bg-white' : 'bg-green-600'
                  }`}></div>
                </div>
                <span>Veg</span>
              </button>
              
              <button
                onClick={() => setVegFilter('non-veg')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
                  vegFilter === 'non-veg' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-700 hover:bg-red-50'
                }`}
              >
                <div className={`w-4 h-4 border-2 flex items-center justify-center ${
                  vegFilter === 'non-veg' ? 'border-white' : 'border-red-600'
                }`}>
                  <div className={`w-2 h-2 ${
                    vegFilter === 'non-veg' ? 'bg-white' : 'bg-red-600'
                  }`} style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
                </div>
                <span>Non-Veg</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {menuData?.categories && menuData.categories.length > 0 && (
        <div className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 theme-category-bar">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide">
              {[{ id: 'all', name: 'All' }, ...(menuData?.categories || [])].map((category) => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {selectedCategoryData && (
          <div className="mb-4 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{selectedCategoryData.name}</h2>
            {selectedCategoryData.description && (
              <p className="text-gray-600 text-base sm:text-lg">{selectedCategoryData.description}</p>
            )}
            {searchQuery && (
              <p className="text-sm text-blue-600 mt-2">
                {filteredItems.length} item(s) found for "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {filteredItems && filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="text-4xl sm:text-6xl mb-4">🍽️</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No dishes found' : 'No items in this category yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No dishes match "${searchQuery}". Try searching for something else!`
                : 'Please check other categories or come back later!'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Button for Mobile */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white w-14 h-14 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 flex items-center justify-center"
          >
            <span className="text-xl">🛒</span>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {getTotalItems()}
            </span>
          </button>
        </div>
      )}

      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cart}
        onUpdateQuantity={updateCartQuantity}
        totalPrice={getTotalPrice()}
        totalItems={getTotalItems()}
        customerData={customerInfo}
        onCustomerChange={(e) => setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value })}
        onPlaceOrder={handlePlaceOrder}
        isOrderLoading={orderLoading}
        tableNumber={menuData?.table?.number}
        restaurant={menuData?.restaurant}
      />
      {showCategoryMenu && <CategoryMenuModal />}
    </div>
  );
};

export default CustomerMenu; 