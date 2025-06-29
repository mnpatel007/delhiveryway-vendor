// VendorSocketHandler.js
import { useEffect, useContext, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const socket = io('http://localhost:5000'); // adjust when deployed

const VendorSocketHandler = () => {
    const { user } = useContext(AuthContext);
    const [incomingOrder, setIncomingOrder] = useState(null);

    useEffect(() => {
        if (user?.token && user.user.role === 'vendor') {
            socket.emit('registerVendor', user.user._id);

            socket.on('newOrder', (order) => {
                console.log('📦 New order received via socket:', order);
                setIncomingOrder(order);
            });
        }

        return () => {
            socket.off('newOrder');
        };
    }, [user]);

    const handleAccept = async () => {
        try {
            await axios.put(
                `http://localhost:5000/api/vendor/orders/${incomingOrder._id}/accept`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            socket.emit('orderStatusUpdate', { orderId: incomingOrder._id, status: 'preparing' });
            setIncomingOrder(null);
        } catch (err) {
            console.error('Error accepting order:', err);
        }
    };

    const handleReject = async () => {
        const reason = prompt('Enter reason for rejecting the order:');
        if (!reason) return;
        try {
            await axios.put(
                `http://localhost:5000/api/vendor/orders/${incomingOrder._id}/reject`,
                { reason },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            socket.emit('orderStatusUpdate', { orderId: incomingOrder._id, status: 'cancelled', reason });
            setIncomingOrder(null);
        } catch (err) {
            console.error('Error rejecting order:', err);
        }
    };

    if (!incomingOrder) return null;

    return (
        <div style={{
            position: 'fixed', top: '30%', left: '50%',
            transform: 'translate(-50%, -30%)', background: '#fff',
            border: '2px solid #333', padding: '2rem', zIndex: 1000
        }}>
            <h3>🚨 New Order Received!</h3>
            <p><strong>Customer:</strong> {incomingOrder.customer?.name || 'Customer'}</p>
            <p><strong>Address:</strong> {incomingOrder.address}</p>
            <p><strong>Items:</strong></p>
            <ul>
                {incomingOrder.items.map((item, idx) => (
                    <li key={idx}>{item.productId?.name} × {item.quantity}</li>
                ))}
            </ul>
            <div style={{ marginTop: '1rem' }}>
                <button onClick={handleAccept} style={{ marginRight: '1rem' }}>✅ Accept</button>
                <button onClick={handleReject}>❌ Reject</button>
            </div>
        </div>
    );
};

export default VendorSocketHandler;
