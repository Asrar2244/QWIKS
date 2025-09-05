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

// Helper function to create FormData client
const createFormDataClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    // Don't set Content-Type - let the browser set it with boundary for FormData
    withCredentials: true,
  });
  
  // Add the same request interceptor for authentication
  client.interceptors.request.use(
    (config) => {
      const fullUrl = config.baseURL + config.url;
      console.log('🚀 FormData API Request:', config.method?.toUpperCase(), fullUrl);
      console.log('📡 Base URL:', config.baseURL);
      console.log('🔗 Endpoint:', config.url);
      console.log('📋 Content-Type:', config.headers['Content-Type']);
      
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
      console.error('❌ FormData Request Error:', error);
      return Promise.reject(error);
    }
  );
  
  // Add the same response interceptor
  client.interceptors.response.use(
    (response) => {
      console.log('✅ FormData API Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('❌ FormData API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        message: error.message
      });
      return Promise.reject(error);
    }
  );
  
  return client;
};

// Add request interceptor for debugging and authentication
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + config.url;
    console.log('🚀 API Request:', config.method?.toUpperCase(), fullUrl);
    console.log('📡 Base URL:', config.baseURL);
    console.log('🔗 Endpoint:', config.url);
    console.log('📋 Content-Type:', config.headers['Content-Type']);
    
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

// Add request interceptor for FormData client
const addFormDataInterceptors = (client) => {
  client.interceptors.request.use(
    (config) => {
      const fullUrl = config.baseURL + config.url;
      console.log('🚀 FormData API Request:', config.method?.toUpperCase(), fullUrl);
      console.log('📡 Base URL:', config.baseURL);
      console.log('🔗 Endpoint:', config.url);
      console.log('📋 Content-Type:', config.headers['Content-Type']);
      
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
      console.error('❌ FormData Request Error:', error);
      return Promise.reject(error);
    }
  );
  
  client.interceptors.response.use(
    (response) => {
      console.log('✅ FormData API Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('❌ FormData API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        message: error.message
      });
      return Promise.reject(error);
    }
  );
};

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

// Public API Client (no authentication needed)
const publicAPIClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Add request interceptor for public API (no auth token)
publicAPIClient.interceptors.request.use(
  (config) => {
    console.log('🚀 Public API Request:', config.method?.toUpperCase(), config.url);
    console.log('📡 Base URL:', config.baseURL);
    console.log('🔗 Endpoint:', config.url);
    console.log('🔓 Public API - No auth token needed');
    return config;
  },
  (error) => {
    console.error('❌ Public API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for public API
publicAPIClient.interceptors.response.use(
  (response) => {
    console.log('✅ Public API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Public API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle specific error cases for public API
    if (error.response?.status === 404) {
      console.error('🔍 404 - Menu or table not found');
    } else if (error.response?.status === 500) {
      console.error('💥 500 - Server error');
    }
    
    return Promise.reject(error);
  }
);

// Restaurant API
export const restaurantAPI = {
  getDetails: () => apiClient.get(`/restaurant/`),
  updateDetails: (data) => {
    if (data instanceof FormData) {
      return createFormDataClient().patch(`/restaurant/`, data);
    }
    return apiClient.patch(`/restaurant/`, data);
  },
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
  create: (data) => {
    // Use FormData client for file uploads
    if (data instanceof FormData) {
      const formDataClient = createFormDataClient();
      return formDataClient.post(`/menu-items/`, data);
    }
    return apiClient.post(`/menu-items/`, data);
  },
  update: (id, data) => {
    // Use FormData client for file uploads
    if (data instanceof FormData) {
      const formDataClient = createFormDataClient();
      return formDataClient.patch(`/menu-items/${id}/`, data);
    }
    return apiClient.patch(`/menu-items/${id}/`, data);
  },
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
    publicAPIClient.get(`/menu/${restaurantSlug}/${tableId}/`),
  createOrder: (orderData) => 
    publicAPIClient.post(`/orders/create/`, orderData),
  placeOrder: (orderData) => 
    publicAPIClient.post(`/orders/create/`, orderData),
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
    
    // Handle HTML error responses (Django debug pages)
    if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
      // Extract error message from HTML if possible
      const errorMatch = error.response.data.match(/<pre class="exception_value">([^<]+)<\/pre>/);
      if (errorMatch) {
        return `Server Error: ${errorMatch[1]}`;
      }
      return 'Server Error: Please try again or contact support';
    }
    
    // Handle specific error cases
    if (error.response.data.image && Array.isArray(error.response.data.image)) {
      return 'Image upload error: Please select a valid image file';
    }
    
    // Handle validation errors
    if (error.response.data.non_field_errors) {
      return error.response.data.non_field_errors.join(', ');
    }
    
    // Handle field-specific errors
    const fieldErrors = Object.entries(error.response.data)
      .filter(([key, value]) => key !== 'image' && Array.isArray(value))
      .map(([key, value]) => `${key}: ${value.join(', ')}`)
      .join('; ');
    
    if (fieldErrors) {
      return fieldErrors;
    }
    
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