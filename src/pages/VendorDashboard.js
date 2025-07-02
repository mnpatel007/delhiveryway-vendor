import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './VendorDashboard.css';

const VendorDashboard = () => {
    const { user } = useContext(AuthContext);

    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({ totalShops: 0, totalProducts: 0, totalOrders: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = user.token;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [shopRes, productRes, statsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops/vendor`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/vendors`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/vendor/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
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
    }, [token]);

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm('Are you sure to delete this shop and all its products?')) return;

        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/shops/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const [shopRes, productRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops/vendor`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/vendors`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setShops(shopRes.data);
            setProducts(productRes.data);
        } catch (err) {
            console.error('Delete shop error:', err);
            alert('Failed to delete shop.');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure to delete this product?')) return;

        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const productRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/vendors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(productRes.data);
        } catch (err) {
            console.error('Delete product error:', err);
            alert('Failed to delete product.');
        }
    };

    const groupedProducts = {};
    products.forEach(product => {
        const shopIdStr = product.shopId?._id?.toString() || product.shopId?.toString();
        if (!shopIdStr) return;
        if (!groupedProducts[shopIdStr]) groupedProducts[shopIdStr] = [];
        groupedProducts[shopIdStr].push(product);

    });


    if (loading)
        return (
            <main className="loading-container" aria-busy="true" aria-label="Loading vendor dashboard">
                <div className="spinner"></div>
                <p>Loading Vendor Dashboard...</p>
            </main>
        );

    if (error)
        return (
            <main className="error-container" role="alert" aria-live="assertive">
                <p>{error}</p>
                <button className="retry-btn" onClick={() => window.location.reload()}>
                    Retry
                </button>
            </main>
        );

    return (
        <main className="vendor-dashboard" role="main">
            <header className="dashboard-header" tabIndex={-1}>
                <h1 className="dashboard-title">Vendor Dashboard</h1>
                <p className="welcome-message">
                    Welcome, <strong>{user.user.name}</strong> 👋
                </p>
            </header>

            <section className="dashboard-stats" aria-label="Your statistics overview">
                <article className="stat-card stat-shops" tabIndex={0}>
                    <h2 className="stat-value">{stats.totalShops}</h2>
                    <p className="stat-label">Total Shops</p>
                </article>
                <article className="stat-card stat-products" tabIndex={0}>
                    <h2 className="stat-value">{stats.totalProducts}</h2>
                    <p className="stat-label">Total Products</p>
                </article>
                <article className="stat-card stat-orders" tabIndex={0}>
                    <h2 className="stat-value">{stats.totalOrders}</h2>
                    <p className="stat-label">Total Orders</p>
                </article>
            </section>

            <section className="shops-section" aria-label="Your shops">
                <h2 className="section-heading">Your Shops</h2>
                {shops.length === 0 ? (
                    <article className="empty-state" aria-live="polite" tabIndex={0}>
                        <p>You have not added any shops yet.</p>
                    </article>
                ) : (
                    shops.map(shop => (
                        <article key={shop._id} className="shop-card" tabIndex={-1}>
                            <header className="shop-header">
                                <h3 className="shop-name">{shop.name}</h3>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteShop(shop._id)}
                                    aria-label={`Delete shop named ${shop.name}`}
                                >
                                    Delete Shop
                                </button>
                            </header>
                            <p className="shop-description">{shop.description}</p>
                            <p className="shop-location">
                                <strong>Location:</strong> {shop.location}
                            </p>

                            <section className="shop-products" aria-label={`Products in ${shop.name}`}>
                                <h4 className="products-heading">Products in {shop.name}</h4>
                                {(groupedProducts[shop._id] || []).length === 0 ? (
                                    <p className="no-products" tabIndex={0}>
                                        No products added yet.
                                    </p>
                                ) : (
                                    <ul className="products-list">
                                        {groupedProducts[shop._id].map(product => (
                                            <li key={product._id} className="product-item" tabIndex={-1}>
                                                <div className="product-details">
                                                    <strong className="product-name">{product.name}</strong>
                                                    <p className="product-description">{product.description}</p>
                                                    <p className="product-price">Price: ₹{product.price.toFixed(2)}</p>
                                                </div>
                                                <div className="product-actions">
                                                    <a
                                                        href={`/edit-product/${product._id}`}
                                                        className="edit-btn"
                                                        aria-label={`Edit product ${product.name}`}
                                                    >
                                                        ✏️ Edit
                                                    </a>
                                                    <button
                                                        className="delete-btn small"
                                                        onClick={() => handleDeleteProduct(product._id)}
                                                        aria-label={`Delete product ${product.name}`}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </article>
                    ))
                )}
            </section>
        </main>
    );
};

export default VendorDashboard;