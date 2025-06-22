import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddShopPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', description: '', location: '' });

    const handleSubmit = async () => {
        try {
            await axios.post('http://localhost:5000/api/shops', form, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            navigate('/');
        } catch (err) {
            alert('Failed to add shop');
        }
    };

    return (
        <div>
            <h2>Add Shop</h2>
            <input placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Description" onChange={e => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Location" onChange={e => setForm({ ...form, location: e.target.value })} />
            <button onClick={handleSubmit}>Save</button>
        </div>
    );
};

export default AddShopPage;
