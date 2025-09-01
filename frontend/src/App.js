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
  console.log('🔍 Route Analysis:', {
    isMenuRoute: window.location.pathname.startsWith('/menu/'),
    isAdminRoute: window.location.pathname.startsWith('/admin/'),
    pathSegments: window.location.pathname.split('/').filter(Boolean)
  });
  
  // Check if we're on a customer menu route
  const isCustomerMenuRoute = window.location.pathname.startsWith('/menu/');
  if (isCustomerMenuRoute) {
    console.log('🎯 CUSTOMER MENU ROUTE DETECTED!');
    console.log('📍 Full URL:', window.location.href);
    console.log('🔍 Route should match: /menu/:restaurantSlug/:tableId');
  } else {
    console.log('❌ NOT on customer menu route');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('🔍 Expected: /menu/taj-darbar/1, Got:', window.location.pathname);
  }
  
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Customer Routes - Completely Public, No Authentication - MUST BE FIRST */}
          <Route path="/menu/:restaurantSlug/:tableId" element={<CustomerMenu />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
          
          {/* Test route to verify routing works */}
          <Route path="/test" element={
            <div className="min-h-screen bg-green-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-green-800 mb-4">✅ Test Route Working!</h1>
                <p className="text-green-600">If you see this, routing is working correctly.</p>
                <p className="text-sm text-green-500 mt-2">Current pathname: {window.location.pathname}</p>
              </div>
            </div>
          } />
          
          {/* Admin Routes - Wrapped in AuthProvider */}
          <Route path="/*" element={
            <AuthProvider>
              <Routes>
                {/* Admin Authentication Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                
                {/* Protected Admin Routes - More Specific */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/restaurant" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <RestaurantSettings />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/tables" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <TablesManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/menu" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <MenuManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <OrdersManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                
                {/* Default admin route */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                
                {/* Default redirect */}
                <Route path="/" element={<AdminLogin />} />
                
                {/* Catch-all route - redirect to admin login for unmatched routes */}
                <Route path="*" element={<AdminLogin />} />
              </Routes>
            </AuthProvider>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 