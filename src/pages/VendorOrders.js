import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const VendorOrders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);

    const token = user?.token || localStorage.getItem('token');

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/vendor/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders:', err.response?.data || err.message);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/vendor/orders/${orderId}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOrders();
        } catch (err) {
            console.error('Failed to update status');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Vendor Orders</h2>
            {orders.length === 0 ? (
                <p>No orders yet.</p>
            ) : (
                orders.map(order => (
                    <div key={order._id} className="border rounded p-4 mb-4 bg-white shadow">
                        <div className="text-sm text-gray-500">
                            Date: {new Date(order.createdAt).toLocaleString()}
                        </div>
                        <div className="font-semibold">Customer: {order.customer.name}</div>
                        <div className="text-sm mb-2">Address: {order.address}</div>

                        <ul className="mb-2">
                            {order.items.map(item => (
                                <li key={item._id}>
                                    {item.productId.name} × {item.quantity}
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-center space-x-2">
                            <label>Status:</label>
                            <select
                                value={order.status}
                                onChange={e => updateStatus(order._id, e.target.value)}
                                className="border rounded px-2 py-1"
                            >
                                <option value="pending">Pending</option>
                                <option value="preparing">Preparing</option>
                                <option value="out for delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default VendorOrders;
