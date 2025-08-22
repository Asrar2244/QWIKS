import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
  // Debug logging for route matching
  console.log('🚀 App Component Rendered');
  console.log('📍 Current Pathname:', window.location.pathname);
  
  return (
    <Router>
      <div className="App">
        <Routes>
        {/* Customer Routes - Completely Public, No Authentication Required */}
        <Route path="/menu/:restaurantSlug/:tableId" element={<CustomerMenu />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
        
        {/* Admin Routes - Wrapped in AuthProvider for Authentication */}
        <Route path="/admin/*" element={
          <AuthProvider>
            <Routes>
              <Route path="login" element={<AdminLogin />} />
              <Route path="register" element={<AdminRegister />} />
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="restaurant" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <RestaurantSettings />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="tables" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <TablesManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="menu" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <MenuManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="orders" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <OrdersManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route index element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        } />
        
        {/* Default redirect - Show a choice between customer and admin */}
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">QR Menu Super App</h2>
              <div className="space-y-4">
                <a 
                  href="/admin/login"
                  className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
                >
                  Admin Login
                </a>
                <p className="text-sm text-gray-500">
                  Scan a QR code to view customer menu
                </p>
              </div>
            </div>
          </div>
        } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 