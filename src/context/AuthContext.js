// src/context/AuthContext.js  (vendor portal)
import { createContext, useState } from 'react';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL, { withCredentials: true });

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        // join the vendor’s user-id room for real-time order status
        socket.emit('authenticate', { userId: userData.id });
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};