import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { VendorOrderProvider, VendorOrderContext } from './context/VendorOrderContext';
import axios from 'axios';
import './GlobalOrderModal.css';

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
  const [editedItems, setEditedItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]); // ✅ Add this



  useEffect(() => {
    if (newOrder?.items) {
      setEditedItems([...newOrder.items]);
      setOriginalItems([...newOrder.items]);
    }
  }, [newOrder]);

  const handleQtyChange = (index, value) => {
    const updated = [...editedItems];
    const inputQty = parseInt(value);
    const maxQty = originalItems[index]?.quantity || 1;

    if (!isNaN(inputQty) && inputQty > 0 && inputQty <= maxQty) {
      updated[index].quantity = inputQty;
      setEditedItems(updated);
    }
  };


  const handleRemove = (index) => {
    const updated = [...editedItems];
    updated.splice(index, 1);
    setEditedItems(updated);
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
      clearOrder();
    } catch (err) {
      alert('❌ Failed to confirm rehearsal order');
    }
  };

  const handleReject = () => {
    alert('Rehearsal orders cannot be rejected — only finalized.');
  };

  if (!newOrder) return null;

  return (
    <div className="persistent-order-modal">
      <div className="persistent-modal-content" role="alertdialog">
        <h3>📝 Rehearsal Order Review</h3>
        <p>
          <strong>Delivery Address:</strong> {newOrder.address}
        </p>

        {editedItems.length === 0 ? (
          <p>No items left in this order.</p>
        ) : (
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
                    max={newOrder.items[index].quantity}
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
        )}

        <div className="persistent-modal-actions">
          <button onClick={handleConfirm} className="accept-btn" disabled={editedItems.length === 0}>
            ✅ Confirm Final Order
          </button>
          <button onClick={handleReject} className="reject-btn">
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