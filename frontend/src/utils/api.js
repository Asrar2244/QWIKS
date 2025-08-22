import axios from 'axios';

// Use environment variables for API URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://qwiks-backend.onrender.com/api'
    : '/api');

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
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