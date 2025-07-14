import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { VendorOrderProvider, VendorOrderContext } from './context/VendorOrderContext';
import axios from 'axios';
import './GlobalOrderModal.css';
import io from 'socket.io-client';

// Import all your pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VendorDashboard from './pages/VendorDashboard';
import AddShopPage from './pages/AddShopPage';
import AddProductPage from './pages/AddProductPage';
import Navbar from './components/Navbar';
import EditProductPage from './pages/EditProductPage';
import VendorOrders from './pages/VendorOrders';
import VerifyEmail from './pages/VerifyEmail';
import VendorForgotPasswordPage from './pages/VendorForgotPasswordPage';
import VendorResetPasswordPage from './pages/VendorResetPasswordPage';


// Cross-Browser Notification Function
function showCrossBrowserNotification(orderType, orderData) {
  // Play sound
  const audio = new Audio('/alert.mp3');
  audio.play();

  // Browser Notification (if supported)
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(`New ${orderType === 'staged' ? 'Paid' : 'Rehearsal'} Order`, {
        body: 'You have a new order waiting for review!',
        icon: '/logo192.png'
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(`New ${orderType === 'staged' ? 'Paid' : 'Rehearsal'} Order`, {
            body: 'You have a new order waiting for review!',
            icon: '/logo192.png'
          });
        }
      });
    }
  }

  // Cross-Window Popup
  const orderAlert = window.open('', 'Order Alert', 'width=400,height=300,resizable=yes');

  if (orderAlert) {
    orderAlert.document.write(`
            <html>
                <head>
                    <title>New Order Alert</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 20px;
                        }
                        .alert-container {
                            background-color: white;
                            border-radius: 10px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            padding: 20px;
                            max-width: 350px;
                            margin: 0 auto;
                        }
                        .alert-title {
                            color: ${orderType === 'staged' ? '#FF6B00' : '#4CAF50'};
                            font-size: 24px;
                            margin-bottom: 15px;
                        }
                        .alert-details {
                            margin-bottom: 20px;
                            color: #333;
                        }
                        .btn-container {
                            display: flex;
                            justify-content: space-between;
                        }
                        .btn {
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            transition: background-color 0.3s;
                        }
                        .btn-view {
                            background-color: ${orderType === 'staged' ? '#FF6B00' : '#4CAF50'};
                            color: white;
                        }
                        .btn-dismiss {
                            background-color: #e0e0e0;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="alert-container">
                        <h2 class="alert-title">
                            New ${orderType === 'staged' ? 'Paid' : 'Rehearsal'} Order
                        </h2>
                        <div class="alert-details">
                            <p>You have a new order waiting for review!</p>
                            <p>Order ID: ${orderData.orderId}</p>
                        </div>
                        <div class="btn-container">
                            <button class="btn btn-view" onclick="window.opener.handleOrderView('${orderType}', ${JSON.stringify(orderData)}); window.close();">
                                View Order
                            </button>
                            <button class="btn btn-dismiss" onclick="window.close();">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </body>
            </html>
        `);

    // Add method to handle order view in main window
    window.handleOrderView = (type, orderData) => {
      // This will be implemented in your main application context
      // For example, you might dispatch an action or call a method to show the order modal
      console.log(`Handling ${type} order`, orderData);
    };
  }
}

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user && user.user.role === 'vendor' ? children : <Navigate to="/login" />;
};

// Layout Component
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

// Global Order Modal Component
const GlobalOrderModal = () => {
  const { newOrder, setNewOrder, clearOrder } = useContext(VendorOrderContext);
  const { user } = useContext(AuthContext);
  const [editedItems, setEditedItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);

  useEffect(() => {
    // Socket connection
    const socket = io(process.env.REACT_APP_BACKEND_URL);

    if (user?.user?.role === 'vendor') {
      console.log('Registering vendor', user.user._id);
      socket.emit('registerVendor', user.user._id);
    }

    // Handle new rehearsal order
    socket.on('newOrder', (data) => {
      console.log('Received rehearsal order', data);
      showCrossBrowserNotification('rehearsal', data);
    });

    // Handle new staged (paid) order
    socket.on('newStagedOrder', (data) => {
      console.log('Received staged order', data);
      showCrossBrowserNotification('staged', data);
    });

    // Cleanup
    return () => {
      socket.off('newOrder');
      socket.off('newStagedOrder');
      socket.disconnect();
    };
  }, [setNewOrder, user]);

  // Order items and confirmation logic (existing code)
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
    if (editedItems.every(item => item.quantity === 0)) {
      alert('❌ Cannot confirm an order with all quantities set to 0.');
      return;
    }

    try {
      if (newOrder.type === 'staged') {
        await axios.patch(
          `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/confirm/${newOrder.orderId}`,
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      } else {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${newOrder.orderId}/confirm`,
          { items: editedItems },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      }
      clearOrder();
    } catch (err) {
      console.error('❌ Confirm failed:', err.message);
      alert('❌ Failed to confirm order');
    }
  };


  const handleReject = async () => {
    if (newOrder.type !== 'staged') {
      alert('❌ You cannot reject a rehearsal order.');
      return;
    }

    const reason = prompt('Why are you rejecting this order?');
    if (!reason) return;

    try {
      console.log('🔁 PUT reject for order', newOrder.orderId);
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${newOrder.orderId}`,
        { status: 'cancelled', reason },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      clearOrder();
    } catch (err) {
      console.error('❌ Reject failed:', err.message);
      alert('❌ Failed to reject order');
    }
  };


  // Render modal only if there's a new order
  if (!newOrder || editedItems.length === 0) {
    return null;
  }

  return (
    <div className="persistent-order-modal">
      <div className="persistent-modal-content">
        <h3>
          {newOrder.type === 'staged'
            ? 'Paid Order — Awaiting Confirmation'
            : 'Rehearsal Order Review'}
        </h3>
        <p><strong>Delivery Address:</strong> {newOrder.address}</p>

        <ul>
          {editedItems.map((item, index) => (
            <li key={index}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <strong>{item.shopName}</strong><br />
                  {item.name}
                </div>

                {newOrder.type === 'staged' ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      max={originalItems[index]?.quantity || 1}
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                      style={{ width: '60px', textAlign: 'center' }}
                    />
                    <button
                      onClick={() => handleRemove(index)}
                      style={{ marginLeft: '10px' }}
                    >
                      🗑️
                    </button>
                  </>
                ) : (
                  <span style={{ marginLeft: '10px' }}><strong>Quantity:</strong> {item.quantity}</span>
                )}
              </div>
            </li>
          ))}
        </ul>


        <div className="persistent-modal-actions">
          <button onClick={handleConfirm}>Confirm Order</button>
          <button onClick={handleReject}>Reject Order</button>
        </div>
      </div>
    </div>
  );
};

// Routes Component
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PrivateRoute><VendorDashboard /></PrivateRoute>} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/add-shop" element={<PrivateRoute><AddShopPage /></PrivateRoute>} />
    <Route path="/add-product" element={<PrivateRoute><AddProductPage /></PrivateRoute>} />
    <Route path="/edit-product/:id" element={<PrivateRoute><EditProductPage /></PrivateRoute>} />
    <Route path="/vendor-orders" element={<PrivateRoute><VendorOrders /></PrivateRoute>} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/vendor/forgot-password" element={<VendorForgotPasswordPage />} />
    <Route path="/reset-password" element={<VendorResetPasswordPage />} />
  </Routes>
);

// Wrapped App Component
function WrappedApp() {
  const { user } = useContext(AuthContext);
  return (
    <BrowserRouter>
      {user?.user?.role === 'vendor' ? (
        <VendorOrderProvider vendorId={user.user._id}>
          <GlobalOrderModal />
          <Layout><AppRoutes /></Layout>
        </VendorOrderProvider>
      ) : (
        <Layout><AppRoutes /></Layout>
      )}
    </BrowserRouter>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <WrappedApp />
    </AuthProvider>
  );
}

export default App;