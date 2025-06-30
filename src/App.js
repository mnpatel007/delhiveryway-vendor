import React, { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { VendorOrderProvider, VendorOrderContext } from './context/VendorOrderContext';
import axios from 'axios';
import './pages/VendorDashboard.css';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VendorDashboard from './pages/VendorDashboard';
import AddShopPage from './pages/AddShopPage';
import AddProductPage from './pages/AddProductPage';
import Navbar from './components/Navbar';
import EditProductPage from './pages/EditProductPage';
import VendorOrders from './pages/VendorOrders';

// 🔐 Protect vendor-only routes
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user && user.user.role === 'vendor' ? children : <Navigate to="/login" />;
};

// 🔁 Hide navbar on login/signup
const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';
  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
};

// 🚨 New order modal (global vendor popup)
const GlobalOrderModal = () => {
  const { newOrder, clearOrder } = useContext(VendorOrderContext);
  const { user } = useContext(AuthContext);

  const playAlertSound = () => {
    const audio = new Audio('./public/alert.mp3');
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const resume = () => {
          audio.play();
          document.removeEventListener('click', resume);
        };
        document.addEventListener('click', resume);
      });
    }
  };

  useEffect(() => {
    if (newOrder) playAlertSound();
  }, [newOrder]);

  const handleAction = async (status) => {
    if (!newOrder) return;

    let reason = null;
    if (status === 'cancelled') {
      reason = prompt('Enter reason for rejection:');
      if (!reason || reason.trim() === '') {
        alert('❌ You must provide a reason to reject the order.');
        return;
      }
    }

    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${newOrder.orderId}`, {
        status,
        reason
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      clearOrder();
    } catch (err) {
      alert('Failed to process order.');
    }
  };

  if (!newOrder) return null;

  return (
    <div className="persistent-order-modal">
      <div className="persistent-modal-content">
        <h3>🆕 New Order Alert</h3>
        <p><strong>Delivery Address:</strong> {newOrder.address}</p>
        <ul>
          {newOrder.items.map((item, idx) => (
            <li key={idx}>{item.shopName} - {item.name} × {item.quantity}</li>
          ))}
        </ul>
        <div className="persistent-modal-actions">
          <button onClick={() => handleAction('preparing')} className="accept-btn">✅ Accept</button>
          <button onClick={() => handleAction('cancelled')} className="reject-btn">❌ Reject</button>
        </div>
      </div>
    </div>
  );
};

// 🛣️ All routes
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PrivateRoute><VendorDashboard /></PrivateRoute>} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/add-shop" element={<PrivateRoute><AddShopPage /></PrivateRoute>} />
    <Route path="/add-product" element={<PrivateRoute><AddProductPage /></PrivateRoute>} />
    <Route path="/edit-product/:id" element={<PrivateRoute><EditProductPage /></PrivateRoute>} />
    <Route path="/vendor-orders" element={<PrivateRoute><VendorOrders /></PrivateRoute>} />
  </Routes>
);

// ✅ Wrapper used inside <AuthProvider>
function WrappedApp() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      {user?.user?.role === 'vendor' ? (
        <VendorOrderProvider vendorId={user.user._id}>
          <GlobalOrderModal />
          <Layout>
            <AppRoutes />
          </Layout>
        </VendorOrderProvider>
      ) : (
        <Layout>
          <AppRoutes />
        </Layout>
      )}
    </BrowserRouter>
  );
}

// ✅ Root App (with AuthProvider)
function App() {
  return (
    <AuthProvider>
      <WrappedApp />
    </AuthProvider>
  );
}

export default App;
