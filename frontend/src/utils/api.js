import axios from 'axios';

// Build information for debugging
const BUILD_INFO = {
  version: '1.0.1',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV
};

// Determine API base URL based on environment
let API_BASE_URL;
if (process.env.NODE_ENV === 'production') {
  // Production: Use the backend URL directly
  API_BASE_URL = 'https://qwiks-backend.onrender.com/api';
} else {
  // Development: Use relative path for local development
  API_BASE_URL = '/api';
}

// Debug logging
console.log('=== API Configuration Debug ===');
console.log('Build Info:', BUILD_INFO);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('process.env.REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
console.log('================================');

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Add request interceptor for debugging and authentication
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + config.url;
    console.log('🚀 API Request:', config.method?.toUpperCase(), fullUrl);
    console.log('📡 Base URL:', config.baseURL);
    console.log('🔗 Endpoint:', config.url);
    
    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Auth token included');
    } else {
      console.log('⚠️ No auth token available');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
      message: error.message
    });
    
    // Handle token refresh for 401 errors
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          
          // Use the same base URL for token refresh
          const baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://qwiks-backend.onrender.com/api'
            : '/api';
          
          const refreshResponse = await axios.post(`${baseURL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const newToken = refreshResponse.data.access;
          localStorage.setItem('token', newToken);
          
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          console.log('🔄 Retrying request with new token');
          
          return apiClient(error.config);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
    
    return Promise.reject(error);
  }
);

// Restaurant API
export const restaurantAPI = {
  getDetails: () => apiClient.get(`/restaurant/`),
  updateDetails: (data) => apiClient.patch(`/restaurant/`, data),
  getBranding: (slug) => apiClient.get(`/restaurant/${slug}/branding/`),
  changePassword: (data) => apiClient.post(`/auth/change-password/`, data),
  forgotPassword: (data) => apiClient.post(`/auth/forgot-password/`, data),
  resetPassword: (data) => apiClient.post(`/auth/reset-password/`, data),
};

// Tables API
export const tablesAPI = {
  getAll: () => apiClient.get(`/tables/`),
  create: (data) => apiClient.post(`/tables/`, data),
  update: (id, data) => apiClient.patch(`/tables/${id}/`, data),
  delete: (id) => apiClient.delete(`/tables/${id}/`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiClient.get(`/categories/`),
  create: (data) => apiClient.post(`/categories/`, data),
  update: (id, data) => apiClient.patch(`/categories/${id}/`, data),
  delete: (id) => apiClient.delete(`/categories/${id}/`),
};

// Menu Items API
export const menuItemsAPI = {
  getAll: (categoryId = null) => {
    const params = categoryId ? `?category=${categoryId}` : '';
    return apiClient.get(`/menu-items/${params}`);
  },
  create: (data) => apiClient.post(`/menu-items/`, data),
  update: (id, data) => apiClient.patch(`/menu-items/${id}/`, data),
  delete: (id) => apiClient.delete(`/menu-items/${id}/`),
};

// Orders API
export const ordersAPI = {
  getAll: (status = null) => {
    const params = status ? `?status=${status}` : '';
    return apiClient.get(`/orders/${params}`);
  },
  getUnread: () => apiClient.get(`/orders/notifications/`),
  updateStatus: (orderId, status) => 
    apiClient.patch(`/orders/${orderId}/status/`, { status }),
  edit: (orderId, data) => 
    apiClient.put(`/orders/${orderId}/edit/`, data),
  create: (data) => apiClient.post(`/orders/create/`, data),
  markNotificationRead: (orderId) => apiClient.patch(`/orders/${orderId}/mark-read/`),
};

// Public API (no authentication needed)
export const publicAPI = {
  getMenu: (restaurantSlug, tableId) => 
    apiClient.get(`/menu/${restaurantSlug}/${tableId}/`),
  createOrder: (orderData) => 
    apiClient.post(`/orders/create/`, orderData),
  placeOrder: (orderData) => 
    apiClient.post(`/orders/create/`, orderData),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiClient.get(`/dashboard/stats/`),
};

// Error handler for API calls
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error:', error.response.data);
    return error.response.data.detail || error.response.data.error || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network Error:', error.request);
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    console.error('Error:', error.message);
    return 'An unexpected error occurred';
  }
}; 