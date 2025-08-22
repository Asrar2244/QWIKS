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
    <AuthProvider>
      {/* <NotificationProvider> */}
        <Router>
          <div className="App">
            <Routes>
            {/* Customer Routes - Completely Public, No Authentication */}
            <Route path="/menu/:restaurantSlug/:tableId" element={<CustomerMenu />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            
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
            </Routes>
          </div>
        </Router>
      {/* </NotificationProvider> */}
    </AuthProvider>
  );
}

export default App; 