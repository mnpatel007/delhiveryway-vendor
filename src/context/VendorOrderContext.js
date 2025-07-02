import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

export const VendorOrderContext = createContext();

const socket = io('https://delhiveryway-backend-1.onrender.com', {
    withCredentials: true,
    transports: ['websocket', 'polling']
});

export const VendorOrderProvider = ({ vendorId, children }) => {
    const [newOrder, setNewOrder] = useState(() => {
        const saved = localStorage.getItem('persistentVendorOrder');
        return saved ? JSON.parse(saved) : null;
    });

    const playAlertSound = () => {
        const audio = new Audio('/alert.mp3');
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                const resume = () => {
                    audio.play();
                    document.removeEventListener('click', resume);
                };
                document.addEventListener('click', resume);
            });
        }
    };

    useEffect(() => {
        if (vendorId) {
            socket.emit('registerVendor', vendorId);
        }

        socket.on('newOrder', async (orderData) => {
            const res = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${orderData.orderId}/status`
            );
            if (res.data.status !== 'pending') return;

            playAlertSound();
            localStorage.setItem('persistentVendorOrder', JSON.stringify(orderData));
            setNewOrder(orderData);
        });

        socket.on('newRehearsalOrder', async (orderData) => {
            const res = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${orderData.orderId}/status`
            );
            if (res.data.status !== 'pending_vendor') return;

            playAlertSound();
            localStorage.setItem('persistentVendorOrder', JSON.stringify(orderData));
            setNewOrder(orderData);
        });

        return () => {
            socket.off('newOrder');
            socket.off('newRehearsalOrder');
        };
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
