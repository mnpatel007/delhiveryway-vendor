import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AddProductPage.css';

const AddProductPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        shopId: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [shopsLoading, setShopsLoading] = useState(true);
    const [shopsError, setShopsError] = useState(null);

    // Fetch shops for the vendor
    const fetchShops = useCallback(async () => {
        try {
            setShopsLoading(true);
            setShopsError(null);
            const res = await axios.get('http://localhost:5000/api/shops/vendor', {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setShops(res.data);
        } catch (err) {
            setShopsError('Failed to load shops. Please try again.');
        } finally {
            setShopsLoading(false);
        }
    }, [user.token]);

    useEffect(() => {
        if (user?.token) {
            fetchShops();
        }
    }, [fetchShops, user?.token]);

    // Validate form inputs
    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.description.trim()) errs.description = 'Description is required';
        if (!form.price || Number(form.price) <= 0) errs.price = 'Price must be a positive number';
        if (!form.shopId) errs.shopId = 'Please select a shop';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' })); // Clear error for this field on change
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            await axios.post(
                'http://localhost:5000/api/products',
                {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    price: Number(form.price),
                    shopId: form.shopId,
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );
            setLoading(false);
            navigate('/');
        } catch (err) {
            setLoading(false);
            alert(err?.response?.data?.message || 'Failed to add product. Please try again.');
        }
    };

    if (shopsLoading) {
        return (
            <div className="loading-container">
                <p>Loading shops...</p>
            </div>
        );
    }

    if (shopsError) {
        return (
            <div className="error-container">
                <p className="error-message">{shopsError}</p>
                <button className="retry-button" onClick={fetchShops}>
                    Retry
                </button>
            </div>
        );
    }

    if (shops.length === 0) {
        return (
            <div className="no-shops-container">
                <h2>No Shops Available</h2>
                <p>You have no shops created yet. Please create a shop before adding a product.</p>
                <button className="btn-primary" onClick={() => navigate('/add-shop')}>
                    Add Shop
                </button>
            </div>
        );
    }

    return (
        <div className="add-product-container">
            <h2 className="page-title">Add Product</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="name">
                        Name <span className="required">*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        className={errors.name ? 'input-error' : ''}
                        disabled={loading}
                        autoComplete="off"
                    />
                    {errors.name && <small className="error-text">{errors.name}</small>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">
                        Description <span className="required">*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Enter product description"
                        rows={4}
                        className={errors.description ? 'input-error' : ''}
                        disabled={loading}
                    />
                    {errors.description && <small className="error-text">{errors.description}</small>}
                </div>

                <div className="form-group">
                    <label htmlFor="price">
                        Price (₹) <span className="required">*</span>
                    </label>
                    <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="Enter product price"
                        className={errors.price ? 'input-error' : ''}
                        disabled={loading}
                    />
                    {errors.price && <small className="error-text">{errors.price}</small>}
                </div>

                <div className="form-group">
                    <label htmlFor="shopId">
                        Shop <span className="required">*</span>
                    </label>
                    <select
                        id="shopId"
                        name="shopId"
                        value={form.shopId}
                        onChange={handleChange}
                        className={errors.shopId ? 'input-error' : ''}
                        disabled={loading}
                    >
                        <option value="">Select Shop</option>
                        {shops.map(shop => (
                            <option key={shop._id} value={shop._id}>
                                {shop.name}
                            </option>
                        ))}
                    </select>
                    {errors.shopId && <small className="error-text">{errors.shopId}</small>}
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Product'}
                </button>
            </form>
        </div>
    );
};

export default AddProductPage;