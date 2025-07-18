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
  const [loading, setLoading] = useState(true);

  // Define logout first to avoid initialization issues
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
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

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login/', credentials);
      const { access, user: userData } = response.data;
      
      // Set axios authorization header immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      setToken(access);
      setUser(userData);
      localStorage.setItem('token', access);
      
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
      const { access, user: userData } = response.data;
      
      // Set axios authorization header immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      setToken(access);
      setUser(userData);
      localStorage.setItem('token', access);
      
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