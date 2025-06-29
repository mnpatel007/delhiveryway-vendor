import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './EditProductPage.css';

const EditProductPage = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', description: '', price: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const fetchProduct = useCallback(async () => {
        try {
            setLoading(true);
            setFetchError(null);
            const res = await axios.get(`http://localhost:5000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const { name, description, price } = res.data;
            setForm({ name, description, price });
        } catch (err) {
            setFetchError('Failed to load product. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id, user.token]);

    useEffect(() => {
        if (user?.token) {
            fetchProduct();
        }
    }, [fetchProduct, user?.token]);

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.description.trim()) errs.description = 'Description is required';
        if (!form.price || Number(form.price) <= 0) errs.price = 'Price must be a positive number';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitLoading(true);
            await axios.put(
                `http://localhost:5000/api/products/${id}`,
                {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    price: Number(form.price),
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );
            setSubmitLoading(false);
            navigate('/');
        } catch (err) {
            setSubmitLoading(false);
            alert(err?.response?.data?.message || 'Failed to update product. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <p>Loading product details...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="error-container">
                <p className="error-message">{fetchError}</p>
                <button className="retry-button" onClick={fetchProduct}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="edit-product-container">
            <h2 className="page-title">Edit Product</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="name">
                        Name <span className="required">*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        className={errors.name ? 'input-error' : ''}
                        placeholder="Enter product name"
                        disabled={submitLoading}
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
                        className={errors.description ? 'input-error' : ''}
                        placeholder="Enter product description"
                        rows={5}
                        disabled={submitLoading}
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
                        className={errors.price ? 'input-error' : ''}
                        placeholder="Enter product price"
                        disabled={submitLoading}
                    />
                    {errors.price && <small className="error-text">{errors.price}</small>}
                </div>

                <button type="submit" className="btn-primary" disabled={submitLoading}>
                    {submitLoading ? 'Updating...' : 'Update'}
                </button>
            </form>
        </div>
    );
};

export default EditProductPage;