import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { VendorOrderProvider, VendorOrderContext } from './context/VendorOrderContext';
import axios from 'axios';
import './GlobalOrderModal.css';
import io from 'socket.io-client';

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

const socket = io(process.env.REACT_APP_BACKEND_URL);

// 🚨 New order modal (global vendor popup)
const GlobalOrderModal = () => {
  const { newOrder, setNewOrder, clearOrder } = useContext(VendorOrderContext);
  const { user } = useContext(AuthContext);
  const [editedItems, setEditedItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);

  useEffect(() => {
    socket.on('newOrder', (data) => {
      setNewOrder({
        ...data,
        type: 'rehearsal'
      });
    });

    socket.on('newStagedOrder', (data) => {
      setNewOrder({
        ...data,
        type: 'staged'
      });
    });

    return () => {
      socket.off('newOrder');
      socket.off('newStagedOrder');
    };
  }, [setNewOrder]);

  useEffect(() => {
    if (newOrder?.items) {
      const itemsWithProductId = newOrder.items.map(item => ({
        ...item,
        productId: item.product?._id || item.productId,
        price: item.price || 0
      }));

      setEditedItems(itemsWithProductId);
      setOriginalItems(itemsWithProductId);
    }
  }, [newOrder]);

  const handleQtyChange = (index, value) => {
    const updated = [...editedItems];
    const originalQty = originalItems[index]?.quantity || 1;
    const qty = parseInt(value);

    if (!isNaN(qty) && qty >= 0 && qty <= originalQty) {
      updated[index].quantity = qty;
      setEditedItems(updated);
    }
  };

  const handleRemove = (index) => {
    const updated = [...editedItems];
    updated.splice(index, 1);
    setEditedItems(updated);
    const originalCopy = [...originalItems];
    originalCopy.splice(index, 1);
    setOriginalItems(originalCopy);
  };

  const handleConfirm = async () => {
    try {
      if (newOrder.type === 'staged') {
        await axios.patch(
          `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/confirm/${newOrder.orderId}`,
          {},
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
      } else {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${newOrder.orderId}/confirm`,
          { items: editedItems },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
      }

      clearOrder();
    } catch (err) {
      console.error('❌ Error confirming order:', err.message);
      alert('Failed to confirm order');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Why are you rejecting this order?');
    if (!reason) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${newOrder.orderId}`,
        {
          status: 'cancelled',
          reason,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      clearOrder();
    } catch (err) {
      console.error('❌ Error rejecting order:', err.message);
      alert('Failed to reject order');
    }
  };

  if (!newOrder || editedItems.length === 0) return null;

  return (
    <div className="persistent-order-modal">
      <div className="persistent-modal-content" role="alertdialog">
        <h3>
          {newOrder.type === 'staged'
            ? '🧾 Paid Order — Awaiting Your Confirmation'
            : '📝 Rehearsal Order Review'}
        </h3>
        <p><strong>Delivery Address:</strong> {newOrder.address}</p>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {editedItems.map((item, index) => (
            <li key={index} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div>
                  <strong>{item.shopName}</strong><br />
                  {item.name}
                </div>
                <span>₹{item.price}</span>
                <span>×</span>
                <input
                  type="number"
                  min="0"
                  max={originalItems[index]?.quantity || 1}
                  value={item.quantity}
                  onChange={(e) => handleQtyChange(index, e.target.value)}
                  style={{
                    width: '60px',
                    textAlign: 'center',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    padding: '4px'
                  }}
                />
                <span>= ₹{(item.price * item.quantity).toFixed(2)}</span>
                <button
                  onClick={() => handleRemove(index)}
                  aria-label="Remove item"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="persistent-modal-actions">
          <button onClick={handleConfirm} className="accept-btn" disabled={editedItems.length === 0}>
            {newOrder.type === 'staged' ? '✅ Confirm Paid Order' : '✅ Confirm Final Order'}
          </button>
          <button onClick={handleReject} className="reject-btn">
            ❌ Reject Order
          </button>
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

// ✅ Root App
function App() {
  return (
    <AuthProvider>
      <WrappedApp />
    </AuthProvider>
  );
}

export default App;
