import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './VendorLoginPage.css';

const VendorLoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, { email, password });

            if (res.data.user.role !== 'vendor') {
                setError('This account is not a vendor');
                return;
            }

            login(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);
            const { email, name, sub } = decoded;

            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
                email,
                name,
                googleId: sub,
                role: 'vendor'
            });

            if (res.data.user.role !== 'vendor') {
                setError('Google account is not a vendor');
                return;
            }

            login(res.data);
            navigate('/');
        } catch (err) {
            console.error('Google login error:', err);
            setError('Google login failed');
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

                    <div className="google-divider">OR</div>

                    <GoogleOAuthProvider clientId="117679354054-t7tsl5najnu2kab80ffls6flkau21idl.apps.googleusercontent.com">
                        <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={() => setError('Google login error')}
                        />
                    </GoogleOAuthProvider>


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
