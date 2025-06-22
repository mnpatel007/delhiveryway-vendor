import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const VendorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);

    const token = user.token;

    const fetchData = async () => {
        try {
            const shopRes = await axios.get('http://localhost:5000/api/shops/vendor', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShops(shopRes.data);

            const productRes = await axios.get('http://localhost:5000/api/products/vendors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(productRes.data);
        } catch (err) {
            console.error('Error loading dashboard data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteShop = async (id) => {
        if (!window.confirm('Delete this shop and all its products?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/shops/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error deleting shop', err);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error deleting product', err);
        }
    };

    const groupedProducts = {};
    for (let product of products) {
        const shopId = product.shopId._id;
        if (!groupedProducts[shopId]) {
            groupedProducts[shopId] = [];
        }
        groupedProducts[shopId].push(product);
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1 style={{ marginBottom: '1rem' }}>Vendor Dashboard</h1>
            <p>Welcome, <strong>{user.user.name}</strong></p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Your Shops</h2>
                <Link to="/add-shop" style={{ fontSize: '1rem', textDecoration: 'none' }}>+ Add New Shop</Link>
                <Link to="/vendor-orders" style={{ marginLeft: '1rem' }}>📦 View Orders</Link>
            </div>

            {shops.length === 0 && <p>You haven't added any shops yet.</p>}

            {shops.map(shop => (
                <div
                    key={shop._id}
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#f9f9f9'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0 }}>{shop.name}</h3>
                        <button onClick={() => handleDeleteShop(shop._id)} style={{ background: 'red', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px' }}>Delete Shop</button>
                    </div>
                    <p>{shop.description}</p>
                    <p><strong>Location:</strong> {shop.location}</p>

                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Products in {shop.name}</h4>
                            <Link to="/add-product" style={{ fontSize: '0.9rem' }}>+ Add Product</Link>
                        </div>

                        {(groupedProducts[shop._id] || []).length === 0 ? (
                            <p>No products added yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                {groupedProducts[shop._id].map(product => (
                                    <li key={product._id} style={{ marginBottom: '0.5rem', background: '#fff', padding: '0.5rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            {product.name} - ₹{product.price}
                                        </span>
                                        <div>
                                            <button
                                                onClick={() => handleDeleteProduct(product._id)}
                                                style={{ background: '#eee', border: '1px solid #ccc', marginRight: '0.5rem', cursor: 'pointer' }}
                                            >
                                                🗑️ Delete
                                            </button>
                                            <Link to={`/edit-product/${product._id}`} style={{ textDecoration: 'none', background: '#ddd', padding: '2px 6px', borderRadius: '4px' }}>
                                                ✏️ Edit
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VendorDashboard;
