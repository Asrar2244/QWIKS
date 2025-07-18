import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [lastPolledAt, setLastPolledAt] = useState(new Date());

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.getAll('pending');
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

      setNotifications(orderNotifications);
      
      // Count unread notifications
      const unread = orderNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      setLastPolledAt(new Date());
    } catch (error) {
      console.error('Failed to fetch notifications:', handleAPIError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        await ordersAPI.markNotificationRead(notification.orderId);
        
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', handleAPIError(error));
    }
  }, [notifications]);

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

  // Poll for new notifications
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

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