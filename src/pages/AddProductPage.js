import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddProductPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [form, setForm] = useState({ name: '', description: '', price: '', shopId: '' });

    useEffect(() => {
        axios.get('http://localhost:5000/api/shops/vendor', {
            headers: { Authorization: `Bearer ${user.token}` }
        }).then(res => setShops(res.data));
    }, [user]);

    const handleSubmit = async () => {
        try {
            await axios.post('http://localhost:5000/api/products', form, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            navigate('/');
        } catch (err) {
            alert('Failed to add product');
        }
    };

    return (
        <div>
            <h2>Add Product</h2>
            <input placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Description" onChange={e => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Price" type="number" onChange={e => setForm({ ...form, price: e.target.value })} />

            <select onChange={e => setForm({ ...form, shopId: e.target.value })}>
                <option value="">Select Shop</option>
                {shops.map(shop => (
                    <option key={shop._id} value={shop._id}>{shop.name}</option>
                ))}
            </select>

            <button onClick={handleSubmit}>Add</button>
        </div>
    );
};

export default AddProductPage;
