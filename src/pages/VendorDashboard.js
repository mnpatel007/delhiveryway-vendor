import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './VendorDashboard.css';

const VendorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({ totalShops: 0, totalProducts: 0, totalOrders: 0 });
    const [persistentOrder, setPersistentOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = user.token;

    const playAlertSound = () => {
        const audio = new Audio('/alert.mp3');
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
        const socket = io('https://delhiveryway-backend-1.onrender.com');
        socket.emit('registerVendor', user.user._id);

        const storedOrder = localStorage.getItem('persistentVendorOrder');
        if (storedOrder) {
            setPersistentOrder(JSON.parse(storedOrder));
        }

        socket.on('newOrder', (orderData) => {
            console.log('📢 New order received:', orderData);
            playAlertSound();
            localStorage.setItem('persistentVendorOrder', JSON.stringify(orderData));
            setPersistentOrder(orderData);
        });

        const fetchData = async () => {
            try {
                setLoading(true);
                const [shopRes, productRes, statsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops/vendor`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/vendors`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/vendor/stats`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setShops(shopRes.data);
                setProducts(productRes.data);
                setStats(statsRes.data);
                setError(null);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            socket.off('newOrder');
            socket.disconnect();
        };
    }, [user.user._id, token]);

    const handleOrderAction = async (status) => {
        if (!persistentOrder) return;

        try {
            const reason = status === 'cancelled' ? prompt('Enter reason for rejection:') : null;

            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${persistentOrder.orderId}`, {
                status,
                reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            localStorage.removeItem('persistentVendorOrder');
            setPersistentOrder(null);
        } catch (err) {
            console.error('Order action error:', err);
            alert('Failed to process order. Please try again.');
        }
    };

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm('Are you sure you want to delete this shop and its products?')) return;

        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/shops/${shopId}`, { headers: { Authorization: `Bearer ${token}` } });

            const [shopRes, productRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops/vendor`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/vendors`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setShops(shopRes.data);
            setProducts(productRes.data);
        } catch (err) {
            console.error('Delete shop error:', err);
            alert('Failed to delete shop.');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
            const productRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/vendors`, { headers: { Authorization: `Bearer ${token}` } });
            setProducts(productRes.data);
        } catch (err) {
            console.error('Delete product error:', err);
            alert('Failed to delete product.');
        }
    };

    const groupedProducts = {};
    products.forEach(product => {
        const shopId = product.shopId._id;
        if (!groupedProducts[shopId]) groupedProducts[shopId] = [];
        groupedProducts[shopId].push(product);
    });

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading Vendor Dashboard...</p></div>;
    if (error) return <div className="error-container"><p>{error}</p><button onClick={() => window.location.reload()}>Retry</button></div>;

    return (
        <div className="vendor-dashboard">
            <div className="dashboard-header">
                <h1>Vendor Dashboard</h1>
                <p className="welcome-message">Welcome, <strong>{user.user.name}</strong></p>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card"><h3>{stats.totalShops}</h3><p>Total Shops</p></div>
                <div className="stat-card"><h3>{stats.totalProducts}</h3><p>Total Products</p></div>
                <div className="stat-card"><h3>{stats.totalOrders}</h3><p>Total Orders</p></div>
            </div>

            <div className="shops-section">
                <div className="section-header">
                    <h2>Your Shops</h2>
                    <div className="section-actions">
                        <Link to="/add-shop" className="action-btn">+ Add New Shop</Link>
                        <Link to="/vendor-orders" className="action-btn">View Orders</Link>
                    </div>
                </div>

                {shops.length === 0 ? (
                    <div className="empty-state">
                        <p>No shops added yet.</p>
                        <Link to="/add-shop" className="cta-btn">Create Your First Shop</Link>
                    </div>
                ) : (
                    shops.map(shop => (
                        <div key={shop._id} className="shop-card">
                            <div className="shop-header">
                                <h3>{shop.name}</h3>
                                <button onClick={() => handleDeleteShop(shop._id)} className="delete-btn">Delete Shop</button>
                            </div>
                            <p className="shop-description">{shop.description}</p>
                            <p className="shop-location"><strong>Location:</strong> {shop.location}</p>
                            <div className="shop-products">
                                <div className="products-header">
                                    <h4>Products in {shop.name}</h4>
                                    <Link to="/add-product" className="action-btn">+ Add Product</Link>
                                </div>
                                {(groupedProducts[shop._id] || []).length === 0 ? (
                                    <p className="no-products">No products added yet.</p>
                                ) : (
                                    <ul className="products-list">
                                        {groupedProducts[shop._id].map(product => (
                                            <li key={product._id} className="product-item">
                                                <div className="product-details">
                                                    <span className="product">{product.name} - {product.description} - ₹{product.price}</span>
                                                </div>
                                                <div className="product-actions">
                                                    <button onClick={() => handleDeleteProduct(product._id)} className="delete-btn small">🗑️ Delete</button>
                                                    <Link to={`/edit-product/${product._id}`} className="edit-btn">✏️ Edit</Link>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {persistentOrder && (
                <div className="persistent-order-modal">
                    <div className="persistent-modal-content">
                        <h3>🆕 New Order Alert</h3>
                        <p><strong>Delivery Address:</strong> {persistentOrder.address}</p>
                        <ul>
                            {persistentOrder.items.map((item, idx) => (
                                <li key={idx}>{item.shopName} - {item.name} × {item.quantity} - {item.description}</li>
                            ))}
                        </ul>
                        <div className="persistent-modal-actions">
                            <button onClick={() => handleOrderAction('preparing')} className="accept-btn">✅ Accept</button>
                            <button onClick={() => handleOrderAction('cancelled')} className="reject-btn">❌ Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorDashboard;
