import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// import { NotificationProvider } from './context/NotificationContext';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import AdminDashboard from './pages/admin/AdminDashboard';
import RestaurantSettings from './pages/admin/RestaurantSettings';
import TablesManagement from './pages/admin/TablesManagement';
import MenuManagement from './pages/admin/MenuManagement';
import OrdersManagement from './pages/admin/OrdersManagement';

// Customer Pages
import CustomerMenu from './pages/customer/CustomerMenu';
import OrderConfirmation from './pages/customer/OrderConfirmation';

// Layout Components
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      {/* <NotificationProvider> */}
        <Router>
          <div className="App">
            <Routes>
            {/* Customer Routes - No Layout */}
            <Route path="/menu/:restaurantSlug/:tableId" element={<CustomerMenu />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            
            {/* Admin Authentication Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            
            {/* Protected Admin Routes with Layout */}
            <Route path="/admin/*" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="restaurant" element={<RestaurantSettings />} />
                    <Route path="tables" element={<TablesManagement />} />
                    <Route path="menu" element={<MenuManagement />} />
                    <Route path="orders" element={<OrdersManagement />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<AdminLogin />} />
            
            {/* Catch-all route for unmatched URLs */}
            <Route path="*" element={
              <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
                  <div className="text-6xl mb-4">😕</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                  <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                  <button
                    onClick={() => window.history.back()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            } />
            </Routes>
          </div>
        </Router>
      {/* </NotificationProvider> */}
    </AuthProvider>
  );
}

export default App; 