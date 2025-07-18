import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 