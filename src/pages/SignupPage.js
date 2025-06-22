import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
    const { login } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSignup = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/signup', {
                name, email, password, role: 'vendor'
            });

            if (res.data.user.role !== 'vendor') {
                alert('Signup must be for vendor only.');
                return;
            }

            login(res.data);
            navigate('/');
        } catch (err) {
            alert('Signup failed: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    return (
        <div>
            <h2>Vendor Signup</h2>
            <input placeholder="Name" onChange={e => setName(e.target.value)} />
            <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
            <button onClick={handleSignup}>Signup</button>
        </div>
    );
};

export default SignupPage;
