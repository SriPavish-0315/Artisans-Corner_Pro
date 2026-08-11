import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import BecomeSeller from './pages/BecomeSeller';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Protected Route Wrapper requiring login
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-20 text-amber-900 font-bold text-base">Loading Artisan's Corner...</div>;
  }

  // If user is not logged in, redirect defaultly to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If route has specific allowed roles and current user role isn't authorized, redirect to their role home page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Root Entry Point Handler: Detects user email and directs straight to their page or to /login
const RootLanding = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-20 text-amber-900 font-bold text-base">Loading Artisan's Corner...</div>;
  }

  // Detect email: If no valid authenticated email, redirect immediately to /login
  if (!user || !user.email) {
    return <Navigate to="/login" replace />;
  }

  // If valid user email detected, go straight to their designated page:
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
  if (user.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />;

  return <Home />;
};

// Public Auth Route Guard (Redirects away from login/register if user is already signed in)
const PublicAuthRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col justify-between bg-amber-50/30 font-sans text-gray-800 antialiased">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Default Entry Route */}
                <Route path="/" element={<RootLanding />} />

                {/* Public Auth Routes */}
                <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
                <Route path="/register" element={<PublicAuthRoute><Register /></PublicAuthRoute>} />

                {/* Protected Marketplace Routes */}
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/order/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/become-seller" element={<ProtectedRoute><BecomeSeller /></ProtectedRoute>} />

                {/* Role Specific Protected Dashboards */}
                <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><SellerDashboard /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['delivery', 'admin']}><DeliveryDashboard /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;