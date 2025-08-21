import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);

  // Define logout first to avoid initialization issues
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/profile/');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Setup axios interceptor for authentication
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token and get user info
      fetchUserProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  // Axios interceptor for auto-refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && refreshToken && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const res = await axios.post('/api/auth/token/refresh/', { refresh: refreshToken });
            const newAccess = res.data.access;
            setToken(newAccess);
            localStorage.setItem('token', newAccess);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
            return axios(originalRequest);
          } catch (refreshError) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshToken, logout]);

  // On app load, if refreshToken exists but no access token, try to refresh.
  useEffect(() => {
    if (!token && refreshToken) {
      axios.post('/api/auth/token/refresh/', { refresh: refreshToken })
        .then(res => {
          const newAccess = res.data.access;
          setToken(newAccess);
          localStorage.setItem('token', newAccess);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          fetchUserProfile();
        })
        .catch(() => {
          logout();
        });
    }
  }, [token, refreshToken, fetchUserProfile, logout]);

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login/', credentials);
      const { access: loginAccess, refresh: loginRefresh, user: loginUserData } = response.data;
      
      // Set axios authorization header immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${loginAccess}`;
      
      setToken(loginAccess);
      setRefreshToken(loginRefresh);
      setUser(loginUserData);
      localStorage.setItem('token', loginAccess);
      localStorage.setItem('refreshToken', loginRefresh);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (registrationData) => {
    try {
      const response = await axios.post('/api/auth/register/', registrationData);
      const { access: registerAccess, refresh: registerRefresh, user: registerUserData } = response.data;
      
      // Set axios authorization header immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${registerAccess}`;
      
      setToken(registerAccess);
      setRefreshToken(registerRefresh);
      setUser(registerUserData);
      localStorage.setItem('token', registerAccess);
      localStorage.setItem('refreshToken', registerRefresh);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 