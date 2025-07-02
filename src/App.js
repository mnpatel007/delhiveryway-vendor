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
  const { newOrder, clearOrder } = useContext(VendorOrderContext);
  const { user } = useContext(AuthContext);
  const [editedItems, setEditedItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);

  useEffect(() => {
    if (newOrder?.items) {
      const itemsWithProductId = newOrder.items.map(item => ({
        ...item,
        productId: item.product?._id || item.productId // support both formats
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
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${newOrder.orderId}/confirm`,
        { items: editedItems },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // ✅ Emit to the correct customer using Socket.IO
      socket.emit('vendorConfirmedOrder', {
        orderId: newOrder.orderId,
        address: newOrder.address,
        items: editedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });

      clearOrder();
    } catch (err) {
      console.error('❌ Error confirming final order:', err.message);
      alert('❌ Failed to confirm rehearsal order');
    }
  };


  if (!newOrder || editedItems.length === 0) return null;

  return (
    <div className="persistent-order-modal">
      <div className="persistent-modal-content" role="alertdialog">
        <h3>📝 Rehearsal Order Review</h3>
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
            ✅ Confirm Final Order
          </button>
          <button onClick={() => clearOrder()} className="reject-btn">
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


// 🛣️ All routes
const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <PrivateRoute>
          <VendorDashboard />
        </PrivateRoute>
      }
    />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route
      path="/add-shop"
      element={
        <PrivateRoute>
          <AddShopPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/add-product"
      element={
        <PrivateRoute>
          <AddProductPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/edit-product/:id"
      element={
        <PrivateRoute>
          <EditProductPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/vendor-orders"
      element={
        <PrivateRoute>
          <VendorOrders />
        </PrivateRoute>
      }
    />
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