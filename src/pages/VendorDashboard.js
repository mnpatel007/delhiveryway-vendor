import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaStore, FaBoxOpen, FaShoppingCart, FaTrash, FaEdit } from 'react-icons/fa';
import './VendorDashboard.css';

const VendorDashboard = () => {
    const { user } = useContext(AuthContext);
    const token = user.token;

    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({ totalShops: 0, totalProducts: 0, totalOrders: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [shopsRes, productsRes, statsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops/vendor`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/vendors`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/vendor/stats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                setShops(shopsRes.data);
                setProducts(productsRes.data);
                setStats(statsRes.data);
                setError(null);
            } catch {
                setError('Unable to load data. Please try again.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [token]);

    const handleDeleteShop = async (id) => {
        if (!window.confirm('Delete this shop and all products?')) return;
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/shops/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShops(shops.filter((shop) => shop._id !== id));
            setProducts(products.filter((product) => product.shopId._id !== id));
        } catch {
            alert('Failed to delete shop.');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProducts(products.filter((product) => product._id !== id));
        } catch {
            alert('Failed to delete product.');
        }
    };

    if (loading)
        return (
            <main className="loading" aria-busy="true" aria-label="Loading vendor dashboard">
                <p>Loading Dashboard...</p>
            </main>
        );
    if (error)
        return (
            <main className="error" role="alert">
                <p>{error}</p>
            </main>
        );

    const groupedProducts = products.reduce((acc, product) => {
        const shopId = product.shopId._id;
        acc[shopId] = acc[shopId] || [];
        acc[shopId].push(product);
        return acc;
    }, {});

    return (
        <main className="vendor-dashboard" role="main">
            <header className="header">
                <h1>Welcome, <strong>{user.user.name}</strong></h1>
            </header>

            <section className="stats">
                <div className="stat-card">
                    <FaStore size={32} color="#2563eb" />
                    <p className="stat-value">{stats.totalShops}</p>
                    <p className="stat-label">Shops</p>
                </div>
                <div className="stat-card">
                    <FaBoxOpen size={32} color="#2563eb" />
                    <p className="stat-value">{stats.totalProducts}</p>
                    <p className="stat-label">Products</p>
                </div>
                <div className="stat-card">
                    <FaShoppingCart size={32} color="#2563eb" />
                    <p className="stat-value">{stats.totalOrders}</p>
                    <p className="stat-label">Orders</p>
                </div>
            </section>

            <section className="shops-list">
                <h2>Your Shops</h2>
                {shops.length === 0 ? (
                    <p className="empty">No shops added yet.</p>
                ) : (
                    shops.map((shop) => (
                        <article className="shop-card" key={shop._id} tabIndex={0}>
                            <div className="shop-header">
                                <h3>{shop.name}</h3>
                                <button
                                    onClick={() => handleDeleteShop(shop._id)}
                                    aria-label={`Delete shop ${shop.name}`}
                                    className="btn-danger"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                            <p className="shop-desc">{shop.description}</p>
                            <p className="shop-location"><strong>Location:</strong> {shop.location}</p>

                            <div className="products-list">
                                <h4>Products</h4>
                                {(groupedProducts[shop._id] || []).length === 0 ? (
                                    <p className="empty">No products found.</p>
                                ) : (
                                    groupedProducts[shop._id].map((prod) => (
                                        <div className="product-card" key={prod._id} tabIndex={0}>
                                            <div className="product-info">
                                                <p className="prod-name">{prod.name}</p>
                                                <p className="prod-price">₹{prod.price.toFixed(2)}</p>
                                            </div>
                                            <div className="product-actions">
                                                <a href={`/edit-product/${prod._id}`} className="btn-primary" aria-label={`Edit ${prod.name}`}>
                                                    <FaEdit />
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteProduct(prod._id)}
                                                    className="btn-danger"
                                                    aria-label={`Delete ${prod.name}`}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </article>
                    ))
                )}
            </section>
        </main>
    );
};

export default VendorDashboard;