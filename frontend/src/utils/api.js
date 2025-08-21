import axios from 'axios';

const API_BASE_URL = '/api';

// Restaurant API
export const restaurantAPI = {
  getDetails: () => axios.get(`${API_BASE_URL}/restaurant/`),
  updateDetails: (data) => axios.patch(`${API_BASE_URL}/restaurant/`, data),
  getBranding: (slug) => axios.get(`${API_BASE_URL}/restaurant/${slug}/branding/`),
  changePassword: (data) => axios.post(`${API_BASE_URL}/auth/change-password/`, data),
  forgotPassword: (data) => axios.post(`${API_BASE_URL}/auth/forgot-password/`, data),
  resetPassword: (data) => axios.post(`${API_BASE_URL}/auth/reset-password/`, data),
};

// Tables API
export const tablesAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/tables/`),
  create: (data) => axios.post(`${API_BASE_URL}/tables/`, data),
  update: (id, data) => axios.patch(`${API_BASE_URL}/tables/${id}/`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/tables/${id}/`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/categories/`),
  create: (data) => axios.post(`${API_BASE_URL}/categories/`, data),
  update: (id, data) => axios.patch(`${API_BASE_URL}/categories/${id}/`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/categories/${id}/`),
};

// Menu Items API
export const menuItemsAPI = {
  getAll: (categoryId = null) => {
    const params = categoryId ? `?category=${categoryId}` : '';
    return axios.get(`${API_BASE_URL}/menu-items/${params}`);
  },
  create: (data) => axios.post(`${API_BASE_URL}/menu-items/`, data),
  update: (id, data) => axios.patch(`${API_BASE_URL}/menu-items/${id}/`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/menu-items/${id}/`),
};

// Orders API
export const ordersAPI = {
  getAll: (status = null) => {
    const params = status ? `?status=${status}` : '';
    return axios.get(`${API_BASE_URL}/orders/${params}`);
  },
  getUnread: () => axios.get(`${API_BASE_URL}/orders/notifications/`),
  updateStatus: (orderId, status) => 
    axios.patch(`${API_BASE_URL}/orders/${orderId}/status/`, { status }),
  edit: (orderId, data) => 
    axios.put(`${API_BASE_URL}/orders/${orderId}/edit/`, data),
  create: (data) => axios.post(`${API_BASE_URL}/orders/create/`, data),
  markNotificationRead: (orderId) => axios.patch(`${API_BASE_URL}/orders/${orderId}/mark-read/`),
};

// Public API (no authentication needed)
export const publicAPI = {
  getMenu: (restaurantSlug, tableId) => 
    axios.get(`${API_BASE_URL}/menu/${restaurantSlug}/${tableId}/`),
  createOrder: (orderData) => 
    axios.post(`${API_BASE_URL}/orders/create/`, orderData),
  placeOrder: (orderData) => 
    axios.post(`${API_BASE_URL}/orders/create/`, orderData),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => axios.get(`${API_BASE_URL}/dashboard/stats/`),
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