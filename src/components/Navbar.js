import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="logo" aria-label="DelhiveryWay">
                    <span className="logo-glow">ShopEase</span>
                </Link>

                <button
                    className={`menu-toggle ${menuOpen ? 'open' : ''}`}
                    onClick={toggleMenu}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                >
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </button>

                <ul className={`nav-links ${menuOpen ? 'show' : ''}`}>
                    <li>
                        <NavLink to="/" exact="true" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                            Home
                        </NavLink>
                    </li>
                    {user && (
                        <>
                            <li>
                                <NavLink to="/add-shop" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Add Shop
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/add-product" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Add Product
                                </NavLink>
                            </li>
                            <li>
                                <button className="nav-logout-btn" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                                    Logout
                                </button>
                            </li>
                        </>
                    )}

                    {!user && (
                        <>
                            <li>
                                <NavLink to="/login" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Login
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/signup" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Signup
                                </NavLink>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;