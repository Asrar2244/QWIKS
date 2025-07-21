import React, { useState, useEffect, useCallback } from 'react';
import { ordersAPI, menuItemsAPI, categoriesAPI, restaurantAPI, handleAPIError } from '../../utils/api';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [editOrderData, setEditOrderData] = useState({
    customer_name: '',
    customer_phone: '',
    notes: '',
    items: []
  });
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  
  // New state for Add Item modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // 1. Add state for the print bill modal and service tax toggle
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [includeServiceTax, setIncludeServiceTax] = useState(true);

  // Add state for service tax percentage
  const [serviceTaxPercent, setServiceTaxPercent] = useState(5);

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'served', label: 'Served' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const fetchOrders = useCallback(async (isBackgroundUpdate = false) => {
    try {
      if (isBackgroundUpdate) {
        setIsUpdating(true);
      }
      const response = await ordersAPI.getAll(statusFilter === 'all' ? null : statusFilter);
      const newOrders = response.data.results || response.data;
      
      // Check if there are new orders
      if (isBackgroundUpdate && orders.length > 0) {
        const currentOrderIds = new Set(orders.map(order => order.id));
        const newOrderIdsFound = newOrders
          .filter(order => !currentOrderIds.has(order.id))
          .map(order => order.id);
        
        if (newOrderIdsFound.length > 0) {
          console.log('New orders detected:', newOrderIdsFound);
          setNewOrderIds(new Set(newOrderIdsFound));
          
          // Clear the new order highlight after 5 seconds
          setTimeout(() => {
            setNewOrderIds(new Set());
          }, 5000);
        }
      }
      
      setOrders(newOrders);
      setLastUpdateTime(new Date());
    } catch (error) {
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [statusFilter, orders.length]);

  // Real-time order updates
  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Set up polling every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const fetchRestaurant = useCallback(async () => {
    try {
      const response = await restaurantAPI.getDetails();
      setRestaurant(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      // Don't set error state for restaurant fetch failure
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      setError(handleAPIError(error));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextStatus = (currentStatus) => {
    const nextStatuses = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'served'
    };
    return nextStatuses[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Confirm',
      confirmed: 'Start Prep',
      preparing: 'Ready',
      ready: 'Served'
    };
    return labels[currentStatus];
  };

  // Edit Order Functions
  const openEditModal = async (order) => {
    // Allow editing for all orders - no restrictions
    try {
      // Fetch menu items for the edit modal
      const menuResponse = await menuItemsAPI.getAll();
      setMenuItems(menuResponse.data.results || menuResponse.data);
      
      // Set up edit order data
      setEditingOrder(order);
      setEditOrderData({
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        notes: order.notes || '',
        items: order.items.map(item => ({
          menu_item: item.menu_item,
          menu_item_name: item.menu_item_name,
          quantity: item.quantity,
          special_instructions: item.special_instructions || ''
        }))
      });
      setShowEditModal(true);
    } catch (error) {
      setError(handleAPIError(error));
    }
  };

  // Print Bill Function
  const printBill = (order, serviceTax = true, serviceTaxPercentValue = 5) => {
    setShowPrintModal(false);
    const printWindow = window.open('', '_blank');
    
    // Calculate tax breakdown (assuming 18% GST split as 9% CGST + 9% SGST)
    const subtotal = parseFloat(order.total_amount);
    const taxRate = 0.18; // 18% GST
    const baseAmount = subtotal / (1 + taxRate);
    const totalTax = subtotal - baseAmount;
    const cgst = totalTax / 2; // 9% CGST
    const sgst = totalTax / 2; // 9% SGST
    const serviceTaxAmount = serviceTax ? subtotal * (serviceTaxPercentValue / 100) : 0;
    const grandTotal = subtotal + serviceTaxAmount;

    const billContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - Order #${order.order_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 0; padding: 15px; font-size: 12px; line-height: 1.3; max-width: 300px; }
            .header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 10px; }
            .restaurant-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .restaurant-info { font-size: 10px; margin-bottom: 1px; }
            .bill-title { font-size: 14px; font-weight: bold; margin: 8px 0; text-decoration: underline; }
            .section { margin-bottom: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            .items-table td { padding: 2px 0; vertical-align: top; }
            .item-name { width: 60%; }
            .item-qty { width: 10%; text-align: center; }
            .item-rate { width: 15%; text-align: right; }
            .item-amount { width: 15%; text-align: right; }
            .dashed-line { border-top: 1px dashed #333; margin: 5px 0; }
            .solid-line { border-top: 1px solid #333; margin: 5px 0; }
            .total-section { margin-top: 8px; }
            .total-row { display: flex; justify-content: space-between; margin: 1px 0; }
            .grand-total { font-weight: bold; font-size: 13px; border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 2px 0; margin: 3px 0; }
            .footer { text-align: center; margin-top: 10px; font-size: 10px; }
            .tax-details { font-size: 10px; margin: 5px 0; }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">${restaurant?.name || 'QR MENU RESTAURANT'}</div>
            <div class="restaurant-info">${restaurant?.address || '123 Food Street, Gourmet District'}</div>
            <div class="restaurant-info">${restaurant?.city || 'City'} - ${restaurant?.pincode || '560001'}, ${restaurant?.state || 'State'}</div>
            <div class="restaurant-info">Ph: ${restaurant?.phone || '+91-9876543210'}</div>
            <div class="restaurant-info">Email: ${restaurant?.email || 'orders@qrmenu.com'}</div>
            <div class="restaurant-info">GSTIN: ${restaurant?.gstin || '29ABCDE1234F1Z5'}</div>
            <div class="restaurant-info">FSSAI: ${restaurant?.fssai || '12345678901234'}</div>
          </div>
          
          <div class="bill-title">TAX INVOICE</div>
          
          <div class="section">
            <div><strong>Bill No:</strong> ${order.order_number}</div>
            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN')}</div>
            <div><strong>Time:</strong> ${new Date(order.created_at).toLocaleTimeString('en-IN', {hour12: true})}</div>
            <div><strong>Table No:</strong> ${order.table_number}</div>
            ${order.customer_name ? `<div><strong>Customer:</strong> ${order.customer_name}</div>` : ''}
            ${order.customer_phone ? `<div><strong>Mobile:</strong> ${order.customer_phone}</div>` : ''}
          </div>

          <div class="dashed-line"></div>

          <table class="items-table">
            <thead>
              <tr style="font-weight: bold;">
                <td class="item-name">ITEM</td>
                <td class="item-qty">QTY</td>
                <td class="item-rate">RATE</td>
                <td class="item-amount">AMT</td>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const itemRate = (item.subtotal / item.quantity);
                const itemBaseAmount = itemRate / (1 + taxRate);
                return `
                <tr>
                  <td class="item-name">
                    ${item.menu_item_name}
                    ${item.special_instructions ? `<br><small style="font-size: 9px;">*${item.special_instructions}</small>` : ''}
                  </td>
                  <td class="item-qty">${item.quantity}</td>
                  <td class="item-rate">₹${itemBaseAmount.toFixed(2)}</td>
                  <td class="item-amount">₹${(itemBaseAmount * item.quantity).toFixed(2)}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>

          <div class="dashed-line"></div>

          <div class="total-section">
            <div class="total-row">
              <span>Sub Total:</span>
              <span>₹${baseAmount.toFixed(2)}</span>
            </div>
            
            <div class="tax-details">
              <div class="total-row">
                <span>CGST @ 9%:</span>
                <span>₹${cgst.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>SGST @ 9%:</span>
                <span>₹${sgst.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="total-row">
              <span>Total Tax:</span>
              <span>₹${totalTax.toFixed(2)}</span>
            </div>
            ${serviceTax ? `<div class="total-row"><span>Service Tax @ ${serviceTaxPercentValue}%:</span><span>₹${serviceTaxAmount.toFixed(2)}</span></div>` : ''}
            
            <div class="solid-line"></div>
            
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
            
            <div class="total-row" style="margin-top: 5px;">
              <span>Payment Mode:</span>
              <span>Cash/Card</span>
            </div>
          </div>

          ${order.notes ? `
            <div class="dashed-line"></div>
            <div class="section">
              <div><strong>Special Instructions:</strong></div>
              <div style="font-size: 10px; font-style: italic;">${order.notes}</div>
            </div>
          ` : ''}

          <div class="dashed-line"></div>
          
          <div class="footer">
            <div style="margin-bottom: 5px;"><strong>*** THANK YOU ***</strong></div>
            <div>Visit Again!</div>
            <div style="margin-top: 5px;">www.qrmenuapp.com</div>
            <div style="margin-top: 8px; font-size: 9px;">
              This is a computer generated invoice
            </div>
            <div style="font-size: 9px;">
              Printed on: ${new Date().toLocaleString('en-IN')}
            </div>
          </div>

          <div class="no-print" style="margin-top: 15px; text-align: center;">
            <button onclick="window.print()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Bill
            </button>
            <button onclick="window.close()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(billContent);
    printWindow.document.close();
    
    // Auto print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingOrder(null);
    setEditOrderData({
      customer_name: '',
      customer_phone: '',
      notes: '',
      items: []
    });
  };

  const addItemToOrder = (menuItem) => {
    const existingItem = editOrderData.items.find(item => item.menu_item === menuItem.id);
    
    if (existingItem) {
      setEditOrderData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.menu_item === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }));
    } else {
      setEditOrderData(prev => ({
        ...prev,
        items: [...prev.items, {
          menu_item: menuItem.id,
          menu_item_name: menuItem.name,
          quantity: 1,
          special_instructions: ''
        }]
      }));
    }
  };

  const updateItemQuantity = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      setEditOrderData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.menu_item !== menuItemId)
      }));
    } else {
      setEditOrderData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.menu_item === menuItemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      }));
    }
  };

  const removeItemFromOrder = (menuItemId) => {
    setEditOrderData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.menu_item !== menuItemId)
    }));
  };

  const calculateTotal = () => {
    return editOrderData.items.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_item);
      return total + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0).toFixed(2);
  };

  const handleSaveOrder = async () => {
    try {
      await ordersAPI.edit(editingOrder.id, editOrderData);
      closeEditModal();
      fetchOrders(); // Refresh orders list
      alert('Order updated successfully!');
    } catch (error) {
      setError(handleAPIError(error));
    }
  };

  const OrderDetailsModal = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold">Order #{order.order_number}</h2>
              <p className="text-sm text-gray-600">
                Table {order.table_number} • {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Order Items:</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <span className="font-medium">{item.quantity}x {item.menu_item_name}</span>
                      {item.special_instructions && (
                        <p className="text-sm text-gray-600 mt-1">
                          <em>Note: {item.special_instructions}</em>
                        </p>
                      )}
                    </div>
                    <span className="text-gray-900 font-medium">₹{item.subtotal}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-gray-300">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span className="text-lg">₹{order.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {order.notes && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Customer Notes:</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-gray-700">{order.notes}</p>
                </div>
              </div>
            )}

            {(order.customer_name || order.customer_phone) && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Customer Info:</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  {order.customer_name && <p><strong>Name:</strong> {order.customer_name}</p>}
                  {order.customer_phone && <p><strong>Phone:</strong> {order.customer_phone}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EditOrderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Edit Order #{editingOrder?.order_number}</h2>
              <p className="text-green-100 text-sm">Table {editingOrder?.table_number}</p>
            </div>
            <button
              onClick={closeEditModal}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Order Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                <button
                  onClick={openAddItemModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 shadow-md"
                >
                  <span className="text-lg">+</span>
                  <span className="font-medium">Add Item</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {editOrderData.items.length > 0 ? (
                  editOrderData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.menu_item_name}</h4>
                        {item.special_instructions && (
                          <p className="text-xs text-gray-600 mt-1">Note: {item.special_instructions}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300 px-2 py-1">
                          <button
                            onClick={() => updateItemQuantity(item.menu_item, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors duration-200"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.menu_item, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors duration-200"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItemFromOrder(item.menu_item)}
                          className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-2">🍽️</div>
                    <p className="text-gray-600">No items in order</p>
                    <p className="text-sm text-gray-500">Click "Add Item" to add menu items</p>
                  </div>
                )}
              </div>
              
              {editOrderData.items.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Order Total:</span>
                    <span className="text-2xl font-bold text-blue-600">₹{calculateTotal()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={editOrderData.customer_name}
                    onChange={(e) => setEditOrderData(prev => ({...prev, customer_name: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={editOrderData.customer_phone}
                    onChange={(e) => setEditOrderData(prev => ({...prev, customer_phone: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes</label>
                  <textarea
                    placeholder="Any special instructions or notes"
                    value={editOrderData.notes}
                    onChange={(e) => setEditOrderData(prev => ({...prev, notes: e.target.value}))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeEditModal}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOrder}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Add Item Modal Functions
  const openAddItemModal = async () => {
    try {
      // Fetch menu items and categories
      const [menuResponse, categoriesResponse] = await Promise.all([
        menuItemsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      setMenuItems(menuResponse.data.results || menuResponse.data);
      setCategories(categoriesResponse.data.results || categoriesResponse.data);
      setShowAddItemModal(true);
      setItemSearchQuery('');
      setSelectedCategory('all');
    } catch (error) {
      setError(handleAPIError(error));
    }
  };

  const closeAddItemModal = () => {
    setShowAddItemModal(false);
    setItemSearchQuery('');
    setSelectedCategory('all');
  };

  const getFilteredMenuItems = () => {
    let filtered = menuItems.filter(item => item.is_available);
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === parseInt(selectedCategory));
    }
    
    // Filter by search query
    if (itemSearchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(itemSearchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const addItemToOrderFromModal = (menuItem) => {
    addItemToOrder(menuItem);
    closeAddItemModal();
  };

  // Add Item Modal Component
  const AddItemModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Add Items to Order</h2>
              <p className="text-blue-100 text-sm">Search and add menu items to the order</p>
            </div>
            <button
              onClick={closeAddItemModal}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {getFilteredMenuItems().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredMenuItems().map((menuItem) => (
                <div
                  key={menuItem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-white"
                >
                  {menuItem.image_url && (
                    <img
                      src={menuItem.image_url}
                      alt={menuItem.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <h4 className="font-semibold text-gray-900 mb-1">{menuItem.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{menuItem.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">₹{menuItem.price}</span>
                    <button
                      onClick={() => addItemToOrderFromModal(menuItem)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <span className="text-sm">+</span>
                      <span className="text-sm">Add</span>
                    </button>
                  </div>
                  <div className="flex items-center mt-2 space-x-2">
                    {menuItem.is_vegetarian && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">🌱 Veg</span>
                    )}
                    {menuItem.is_spicy && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">🌶️ Spicy</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {itemSearchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No menu items available'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeAddItemModal}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-600">
            Track and manage customer orders
            {lastUpdateTime && (
              <span className="ml-2 text-xs text-gray-500">
                • Last updated: {lastUpdateTime.toLocaleTimeString()}
                {isUpdating && <span className="ml-1 animate-pulse">🔄</span>}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchOrders(false)}
          disabled={isUpdating}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-1"
        >
          <span className={isUpdating ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  statusFilter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-2">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
          </h3>
          <p className="text-sm text-gray-600">
            {statusFilter === 'all' 
              ? 'Orders will appear here when customers place them'
              : 'Switch to "All Orders" to see orders with different statuses'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status & Actions</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit & Print</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  
                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 transition-all duration-500 ${
                        newOrderIds.has(order.id) 
                          ? 'bg-green-50 border-l-4 border-l-green-500 animate-pulse' 
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{order.order_number}</div>
                          {order.customer_name && (
                            <div className="text-xs text-gray-500">{order.customer_name}</div>
                          )}
                          <button
                            onClick={() => setExpandedOrder(order)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Table {order.table_number}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex flex-col space-y-1">
                          {nextStatus ? (
                            <button
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)} hover:opacity-80 transition-all duration-200 cursor-pointer`}
                              title={`Click to change to ${nextStatus}`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)} → {getNextStatusLabel(order.status)}
                            </button>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                              title="Cancel order"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ₹{order.total_amount}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>{new Date(order.created_at).toLocaleDateString()}</div>
                        <div>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => openEditModal(order)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                            title="Edit Order"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setPrintOrder(order); setShowPrintModal(true); setIncludeServiceTax(true); }}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                            title="Print Bill"
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Status Legend */}
      <div className="bg-white rounded-lg shadow p-3">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Status Guide:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="flex items-center">
            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 mr-1">
              Pending
            </span>
            <span className="text-gray-600">New</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-1">
              Confirmed
            </span>
            <span className="text-gray-600">Accepted</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 mr-1">
              Preparing
            </span>
            <span className="text-gray-600">Cooking</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 mr-1">
              Ready
            </span>
            <span className="text-gray-600">To serve</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 mr-1">
              Served
            </span>
            <span className="text-gray-600">Done</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 mr-1">
              Cancelled
            </span>
            <span className="text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>

      {expandedOrder && (
        <OrderDetailsModal 
          order={expandedOrder} 
          onClose={() => setExpandedOrder(null)} 
        />
      )}

      {showEditModal && (
        <EditOrderModal />
      )}

      {showAddItemModal && (
        <AddItemModal />
      )}

      {showPrintModal && printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Print Bill Options</h2>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="serviceTax"
                checked={includeServiceTax}
                onChange={e => setIncludeServiceTax(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="serviceTax" className="text-sm">Include Service Tax</label>
              {includeServiceTax && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={serviceTaxPercent}
                  onChange={e => setServiceTaxPercent(Number(e.target.value))}
                  className="ml-4 w-20 px-2 py-1 border rounded text-sm"
                  style={{ width: '70px' }}
                  disabled={!includeServiceTax}
                />
              )}
              {includeServiceTax && <span className="ml-1 text-sm">%</span>}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => printBill(printOrder, includeServiceTax, serviceTaxPercent)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement; 