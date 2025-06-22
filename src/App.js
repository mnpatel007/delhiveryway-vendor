import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VendorDashboard from './pages/VendorDashboard';
import AddShopPage from './pages/AddShopPage';
import AddProductPage from './pages/AddProductPage';
import Navbar from './components/Navbar';
import EditProductPage from './pages/EditProductPage';
import VendorOrders from './pages/VendorOrders';




const PrivateRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  return user && user.user.role === 'vendor' ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<PrivateRoute><VendorDashboard /></PrivateRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/add-shop" element={<PrivateRoute><AddShopPage /></PrivateRoute>} />
          <Route path="/add-product" element={<PrivateRoute><AddProductPage /></PrivateRoute>} />
          <Route path="/edit-product/:id" element={<PrivateRoute><EditProductPage /></PrivateRoute>} />
          <Route path="/vendor-orders" element={<VendorOrders />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
