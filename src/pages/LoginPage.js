import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                email, password
            });

            if (res.data.user.role !== 'vendor') {
                alert('This account is not a vendor.');
                return;
            }

            login(res.data);
            navigate('/');
        } catch (err) {
            alert('Login failed: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    return (
        <div>
            <h2>Vendor Login</h2>
            <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
};

export default LoginPage;
