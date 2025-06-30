import React, { createContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

export const VendorOrderContext = createContext();

const socket = io('https://delhiveryway-backend-1.onrender.com');

export const VendorOrderProvider = ({ vendorId, children }) => {
    const [newOrder, setNewOrder] = useState(() => {
        const saved = localStorage.getItem('persistentVendorOrder');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (vendorId) {
            socket.emit('registerVendor', vendorId);
        }

        socket.on('newOrder', (orderData) => {
            localStorage.setItem('persistentVendorOrder', JSON.stringify(orderData));
            setNewOrder(orderData);
        });

        return () => socket.off('newOrder');
    }, [vendorId]);

    const clearOrder = () => {
        localStorage.removeItem('persistentVendorOrder');
        setNewOrder(null);
    };

    return (
        <VendorOrderContext.Provider value={{ newOrder, clearOrder }}>
            {children}
        </VendorOrderContext.Provider>
    );
};
