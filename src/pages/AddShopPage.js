import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AddShopPage.css';

const AddShopPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', description: '', location: '', lat: '', lng: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Validate form fields
    const validate = () => {
        const errors = {};
        if (!form.name.trim()) errors.name = 'Name is required';
        if (!form.description.trim()) errors.description = 'Description is required';
        if (!form.location.trim()) errors.location = 'Location is required';
        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' }); // Clear error on input change
    };

    // Fetch current location using browser geolocation
    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm((prev) => ({
                    ...prev,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    location: `${position.coords.latitude}, ${position.coords.longitude}`
                }));
            },
            (error) => {
                alert('Failed to fetch location. Please allow location access.');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/shops`,
                {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    location: {
                        lat: form.lat ? parseFloat(form.lat) : undefined,
                        lng: form.lng ? parseFloat(form.lng) : undefined
                    },
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );
            setLoading(false);
            navigate('/');
        } catch (err) {
            setLoading(false);
            alert(err?.response?.data?.message || 'Failed to add shop. Please try again.');
        }
    };

    return (
        <div className="add-shop-container" style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
            <h2>Add Shop</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: 4 }}>
                        Name <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter shop name"
                        className={`input-field ${errors.name ? 'input-error' : ''}`}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: 4,
                            border: errors.name ? '1px solid red' : '1px solid #ccc',
                        }}
                    />
                    {errors.name && <small style={{ color: 'red' }}>{errors.name}</small>}
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="description" style={{ display: 'block', marginBottom: 4 }}>
                        Description <span style={{ color: 'red' }}>*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Enter shop description"
                        rows={4}
                        className={`input-field ${errors.description ? 'input-error' : ''}`}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: 4,
                            border: errors.description ? '1px solid red' : '1px solid #ccc',
                            resize: 'vertical',
                        }}
                    />
                    {errors.description && <small style={{ color: 'red' }}>{errors.description}</small>}
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="location" style={{ display: 'block', marginBottom: 4 }}>
                        Location <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            id="location"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Latitude, Longitude"
                            className={`input-field ${errors.location ? 'input-error' : ''}`}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 4,
                                border: errors.location ? '1px solid red' : '1px solid #ccc',
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleFetchLocation}
                            style={{
                                background: '#1976d2',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                            disabled={loading}
                        >
                            Fetch Location
                        </button>
                    </div>
                    {errors.location && <small style={{ color: 'red' }}>{errors.location}</small>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        backgroundColor: '#4ecdc4',
                        color: '#fff',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 6,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        border: 'none',
                        fontWeight: 'bold',
                        width: '100%',
                    }}
                >
                    {loading ? 'Saving...' : 'Save Shop'}
                </button>
            </form>
        </div>
    );
};

export default AddShopPage;