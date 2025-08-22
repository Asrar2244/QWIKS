import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, handleAPIError } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
// import { useNotifications } from '../../context/NotificationContext';


const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { user, token } = useAuth();


  useEffect(() => {
    if (user && token) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Refresh stats periodically (every 30 seconds) instead of on every notification poll
  useEffect(() => {
    if (user && token) {
      const interval = setInterval(() => {
        fetchStats();
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user, token, fetchStats]);

  // Update document title with restaurant name
  useEffect(() => {
    if (stats?.restaurant?.name) {
      document.title = `${stats.restaurant.name} - Admin Dashboard`;
    } else {
      document.title = 'Admin Dashboard';
    }
    
    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'QR Menu Admin';
    };
  }, [stats?.restaurant?.name]);

  const fetchStats = useCallback(async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data);
      setLastUpdated(new Date());
      setError(''); // Clear any previous errors
      
      if (showSuccessMessage) {
        console.log('✅ Stats refreshed successfully');
      }
    } catch (error) {
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const StatCard = ({ title, value, icon, gradient, trend, trendValue, link = null }) => (
    <div className={`relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}>
      {/* Background gradient overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-10 rounded-full -mr-16 -mt-16`}></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradient}`}>
            <span className="text-white text-2xl">{icon}</span>
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className="mr-1">{trend === 'up' ? '↗' : '↘'}</span>
              {trendValue}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
        
        {link && (
          <div className="mt-4">
            <Link 
              to={link} 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 group"
            >
              View details 
              <span className="ml-1 group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  // Test customer menu function
  const testCustomerMenu = () => {
    const testUrl = `/menu/${user?.restaurant?.slug || 'test'}/1`;
    console.log('🧪 Testing customer menu URL:', testUrl);
    window.open(testUrl, '_blank');
  };

  const QuickAction = ({ title, description, icon, link, gradient, badge }) => (
    <Link 
      to={link}
      className="group relative bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden"
    >
      {/* Background gradient overlay */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} opacity-5 rounded-full -mr-12 -mt-12 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 rounded-xl ${gradient} group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-white text-xl">{icon}</span>
          </div>
          {badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        
        <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-500">
          <span className="group-hover:translate-x-1 transition-transform duration-200">Get started</span>
          <span className="ml-1 group-hover:translate-x-1 transition-transform duration-200">→</span>
        </div>
      </div>
    </Link>
  );

  const ActivityCard = ({ title, items, icon }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3">
          <span className="text-white text-lg">{icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-700 font-medium">{item.label}</span>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900 mr-2">{item.value}</span>
              {item.change && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.change > 0 ? '+' : ''}{item.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
        <div className="flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h3 className="font-semibold">Error loading dashboard</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const activityData = [
    { label: "Today's Orders", value: stats?.orders?.today || 0, change: stats?.orders?.trend || 0 },
    { label: "Today's Revenue", value: `₹${stats?.revenue?.today?.toLocaleString('en-IN') || '0'}`, change: stats?.revenue?.trend || 0 },
    { label: "This Week's Orders", value: stats?.orders?.week || 0, change: 0 },
    { label: "This Week's Revenue", value: `₹${stats?.revenue?.week?.toLocaleString('en-IN') || '0'}`, change: 0 },
    { label: "Available Items", value: stats?.menu_items?.available || 0, change: 0 },
    { label: "Active Tables", value: stats?.tables?.active || 0, change: 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stats?.restaurant?.name ? `${stats.restaurant.name} Dashboard` : 'Dashboard'}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Welcome back! Here's what's happening with your restaurant.</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-semibold text-gray-900">{lastUpdated.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh requested');
                  fetchStats(true);
                }}
                disabled={loading}
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                title="Refresh dashboard"
              >
                <span className={`text-xl ${loading ? 'animate-spin' : ''}`}>🔄</span>
              </button>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🏪</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tables"
          value={stats?.tables?.total || 0}
          icon="🪑"
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          link="/admin/tables"
        />
        <StatCard
          title="Active Tables"
          value={stats?.tables?.active || 0}
          icon="✅"
          gradient="bg-gradient-to-r from-green-500 to-green-600"
          link="/admin/tables"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats?.revenue?.total?.toLocaleString('en-IN') || '0'}`}
          icon="💰"
          gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
          trend={stats?.revenue?.trend > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats?.revenue?.trend || 0)}%`}
          link="/admin/orders"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.orders?.pending || 0}
          icon="⏰"
          gradient="bg-gradient-to-r from-amber-500 to-orange-500"
          trend={stats?.orders?.trend > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats?.orders?.trend || 0)}%`}
          link="/admin/orders"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Overview */}
        <div className="lg:col-span-2">
          <ActivityCard
            title="Recent Activity"
            icon="📊"
            items={activityData}
          />
        </div>

        {/* Dynamic Insights */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg mr-3">
              <span className="text-white text-lg">💡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Insights</h3>
          </div>
          
          <div className="space-y-4">
            {stats?.orders?.pending > 0 && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div className="flex items-start">
                  <span className="text-amber-500 mr-3 text-lg">⏰</span>
                  <div>
                    <p className="font-medium text-gray-900">Pending Orders Alert</p>
                    <p className="text-sm text-gray-600 mt-1">You have {stats.orders.pending} orders waiting for confirmation</p>
                  </div>
                </div>
              </div>
            )}
            
            {stats?.menu_items?.total === 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-3 text-lg">🍽️</span>
                  <div>
                    <p className="font-medium text-gray-900">Add Your First Menu Item</p>
                    <p className="text-sm text-gray-600 mt-1">Start building your digital menu to attract customers</p>
                  </div>
                </div>
              </div>
            )}
            
            {stats?.tables?.total === 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-start">
                  <span className="text-green-500 mr-3 text-lg">🪑</span>
                  <div>
                    <p className="font-medium text-gray-900">Create Your First Table</p>
                    <p className="text-sm text-gray-600 mt-1">Add tables to generate QR codes for customer ordering</p>
                  </div>
                </div>
              </div>
            )}
            
            {stats?.revenue?.today > 0 && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <div className="flex items-start">
                  <span className="text-emerald-500 mr-3 text-lg">💰</span>
                  <div>
                    <p className="font-medium text-gray-900">Today's Revenue</p>
                    <p className="text-sm text-gray-600 mt-1">Great! You've earned ₹{stats.revenue.today.toLocaleString('en-IN')} today</p>
                  </div>
                </div>
              </div>
            )}
            
            {stats?.orders?.total === 0 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-start">
                  <span className="text-purple-500 mr-3 text-lg">🎯</span>
                  <div>
                    <p className="font-medium text-gray-900">Ready for Orders</p>
                    <p className="text-sm text-gray-600 mt-1">Your restaurant is set up! Customers can start placing orders</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Get started with these common tasks</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAction
            title="Add New Table"
            description="Create QR codes for new dining tables"
            icon="🪑"
            link="/admin/tables"
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <QuickAction
            title="Add Menu Item"
            description="Expand your digital menu offerings"
            icon="🍽️"
            link="/admin/menu"
            gradient="bg-gradient-to-r from-purple-500 to-purple-600"
            badge={stats?.menu_items?.total === 0 ? "Start here" : `${stats?.menu_items?.available}/${stats?.menu_items?.total} available`}
          />
          <QuickAction
            title="Manage Orders"
            description="View and update order statuses"
            icon="📦"
            link="/admin/orders"
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            badge={stats?.orders?.pending > 0 ? `${stats.orders.pending} pending` : null}
          />
        </div>
      </div>

      {/* Test Customer Menu */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Test Customer Menu</h3>
            <p className="text-gray-600">Test the public customer menu to ensure QR codes work</p>
          </div>
          <button 
            onClick={testCustomerMenu}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow duration-200"
          >
            Test Customer Menu
          </button>
        </div>
        <div className="text-sm text-gray-600">
          <p>• This will open the customer menu in a new tab</p>
          <p>• Use this to test if the menu loads correctly</p>
          <p>• QR codes should open this same menu</p>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Performance Overview</h3>
            <p className="text-gray-600">Your restaurant at a glance</p>
          </div>
          <Link 
            to="/admin/orders" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow duration-200"
          >
            View Details
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats?.orders?.total || 0}</div>
            <div className="text-sm font-medium text-blue-800">Total Orders</div>
            <div className="text-xs text-blue-600 mt-1">All time</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="text-3xl font-bold text-green-600 mb-2">₹{stats?.revenue?.total?.toLocaleString('en-IN') || '0'}</div>
            <div className="text-sm font-medium text-green-800">Total Revenue</div>
            <div className="text-xs text-green-600 mt-1">All time</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="text-3xl font-bold text-purple-600 mb-2">₹{Math.round(stats?.avg_order_value || 0)}</div>
            <div className="text-sm font-medium text-purple-800">Avg Order Value</div>
            <div className="text-xs text-purple-600 mt-1">Per order</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {stats?.recent_orders && stats.recent_orders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-gray-600">Latest customer orders</p>
            </div>
            <Link 
              to="/admin/orders" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow duration-200"
            >
              View All Orders
            </Link>
          </div>
          
          <div className="space-y-4">
            {stats.recent_orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-500' :
                    order.status === 'confirmed' ? 'bg-blue-500' :
                    order.status === 'preparing' ? 'bg-orange-500' :
                    order.status === 'ready' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {order.customer_name} • Table {order.table?.table_number || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{order.total_amount}</p>
                  <p className="text-sm text-gray-600 capitalize">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 