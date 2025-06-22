import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const EditProductPage = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', description: '', price: '' });

    useEffect(() => {
        axios.get(`http://localhost:5000/api/products/${id}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        }).then(res => {
            const { name, description, price } = res.data;
            setForm({ name, description, price });
        });
    }, [id, user]);

    const handleSubmit = async () => {
        await axios.put(`http://localhost:5000/api/products/${id}`, form, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        navigate('/');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Edit Product</h2>
            <input
                placeholder="Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <br />
            <input
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <br />
            <input
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
            />
            <br />
            <button onClick={handleSubmit}>Update</button>
        </div>
    );
};

export default EditProductPage;
