import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AddShopPage.css';

const AddShopPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', description: '', location: '', lat: '', lng: '', address: '' });
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
        const { name, value } = e.target;
        const newForm = { ...form, [name]: value };
        if (name === 'location') {
            newForm.address = value;
            newForm.lat = '';
            newForm.lng = '';
        }
        setForm(newForm);
        setErrors({ ...errors, [name]: '' });
    };

    // Fetch current location using browser geolocation
    const handleFindLocation = async () => {
        if (!form.location.trim()) {
            alert('Please enter an address in the location field first.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(form.location)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
            if (response.data.results && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                const address = response.data.results[0].formatted_address;
                setForm(prev => ({
                    ...prev,
                    lat: location.lat,
                    lng: location.lng,
                    location: address,
                    address: address
                }));
                alert('Location found and coordinates saved!');
            } else {
                alert('Could not find location. Please check the address.');
            }
        } catch (error) {
            alert('An error occurred while finding the location.');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        if (!form.lat || !form.lng) {
            alert('Please use the "Find Location" button to get coordinates for the address before saving.');
            return;
        }

        try {
            setLoading(true);
            await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/shops`,
                {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    location: {
                        lat: parseFloat(form.lat),
                        lng: parseFloat(form.lng)
                    },
                    address: form.address,
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
                            onClick={handleFindLocation}
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
                            Find Location
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