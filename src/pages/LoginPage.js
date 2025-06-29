import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './VendorLoginPage.css'; // Import CSS file

const VendorLoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setError(''); // Reset error state

        // Basic validation
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                email, password
            });

            if (res.data.user.role !== 'vendor') {
                setError('This account is not a vendor');
                return;
            }

            login(res.data);
            navigate('/vendor');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <form className="login-form" onSubmit={handleLogin}>
                    <h2 className="login-title">Vendor Login</h2>
                    <p className="login-subtitle">Login to your vendor account</p>

                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="forgot-password">
                        <a href="/vendor/forgot-password">Forgot Password?</a>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={!email || !password}
                    >
                        Login
                    </button>

                    <div className="signup-link">
                        Don't have a vendor account?
                        <a href="/signup"> Sign Up</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorLoginPage;