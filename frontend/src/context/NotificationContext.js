import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ordersAPI, handleAPIError } from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const knownIdsRef = useRef(new Set());

  // Check authentication status safely
  const checkAuthStatus = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const hasToken = !!token;
      setIsAuthenticated(hasToken);
      return hasToken;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    // Only fetch notifications if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping notification fetch');
      return;
    }

    try {
      setIsLoading(true);
      // Fetch only unread notifications from dedicated endpoint
      const response = await ordersAPI.getUnread();
      const orders = response.data.results || response.data;
      
      // Transform orders into notifications
      const orderNotifications = orders.map(order => ({
        id: order.id,
        type: 'new_order',
        title: `New Order #${order.order_number}`,
        message: `Table ${order.table?.number || order.table_id} - ${order.total_amount} ${order.currency || 'USD'}`,
        timestamp: new Date(order.created_at),
        read: order.notification_read || false,
        orderId: order.id,
        orderNumber: order.order_number,
        tableNumber: order.table?.number || order.table_id,
        amount: order.total_amount,
        status: order.status
      }));

      // Detect new notifications compared to previous poll
      const incomingIds = new Set(orderNotifications.map(n => n.id));
      const prevKnown = knownIdsRef.current;
      const newlyArrived = orderNotifications.filter(n => !prevKnown.has(n.id));

      // Update known IDs
      knownIdsRef.current = incomingIds;

      // Prepend newly arrived as "new" to trigger browser notifications
      if (newlyArrived.length > 0) {
        newlyArrived.forEach(n => {
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(n.title, {
                body: n.message,
                icon: '/favicon.ico',
                tag: `order-${n.id}`
              });
            } catch (_) { /* no-op */ }
          }
        });
      }

      setNotifications(orderNotifications);
      
      // Count unread notifications
      const unread = orderNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      setLastPolledAt(new Date());
    } catch (error) {
      console.error('Failed to fetch notifications:', handleAPIError(error));
      // If it's an authentication error, don't keep retrying
      if (error.response?.status === 401) {
        console.log('Authentication failed, stopping notification polling');
        setIsAuthenticated(false);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        await ordersAPI.markNotificationRead(notification.orderId);
        // Remove it from the list immediately since we only show unread
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Refresh from server to stay in sync
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', handleAPIError(error));
    }
  }, [notifications, fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(n => ordersAPI.markNotificationRead(n.orderId))
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', handleAPIError(error));
    }
  }, [notifications]);

  // Clear old notifications
  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((order) => {
    const newNotification = {
      id: order.id,
      type: 'new_order',
      title: `New Order #${order.order_number}`,
      message: `Table ${order.table?.number || order.table_id} - ${order.total_amount} ${order.currency || 'USD'}`,
      timestamp: new Date(),
      read: false,
      orderId: order.id,
      orderNumber: order.order_number,
      tableNumber: order.table?.number || order.table_id,
      amount: order.total_amount,
      status: order.status
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico',
        tag: `order-${order.id}`
      });
    }
  }, []);

  // Monitor authentication status changes
  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus();
    
    // Set up interval to check auth status
    const authCheckInterval = setInterval(checkAuthStatus, 1000);
    
    // Listen for storage changes (login/logout)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(authCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);

  // Poll for new notifications (only when authenticated)
  useEffect(() => {
    let intervalId;
    
    const startPolling = () => {
      if (isAuthenticated) {
        console.log('Starting notification polling - user authenticated');
        fetchNotifications();
        intervalId = setInterval(fetchNotifications, 5000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        console.log('Stopping notification polling');
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Only start polling if user is authenticated
    if (isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
    }

    // Pause when tab is hidden to save resources
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else if (isAuthenticated) {
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchNotifications, isAuthenticated]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    lastPolledAt,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 