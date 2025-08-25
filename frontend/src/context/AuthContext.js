import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient, restaurantAPI } from '../utils/api';

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
    // Clear any stored user data
    setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await restaurantAPI.getDetails();
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Setup authentication when token changes
  useEffect(() => {
    if (token) {
      // Verify token and get user info
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  // Handle token refresh
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return null;
    
    try {
      const response = await apiClient.post(`/auth/token/refresh/`, { 
        refresh: refreshToken 
      });
      
      const newAccess = response.data.access;
      setToken(newAccess);
      localStorage.setItem('token', newAccess);
      return newAccess;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  }, [refreshToken, logout]);

  // On app load, if refreshToken exists but no access token, try to refresh
  useEffect(() => {
    if (!token && refreshToken) {
      refreshAccessToken();
    }
  }, [token, refreshToken, refreshAccessToken]);

  const login = async (credentials) => {
    try {
      const response = await apiClient.post(`/auth/login/`, credentials);
      const { access: loginAccess, refresh: loginRefresh, user: loginUserData } = response.data;
      
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
      const response = await apiClient.post(`/auth/register/`, registrationData);
      const { access: registerAccess, refresh: registerRefresh, user: registerUserData } = response.data;
      
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
        error: error.response?.data?.error || 'Registration failed' 
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