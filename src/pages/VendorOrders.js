import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './VendorOrders.css';

const VendorOrders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(null);
    const [error, setError] = useState(null);

    const token = user?.token;

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Sort orders newest first
            const sorted = res.data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setOrders(sorted);
        } catch (err) {
            console.error('Failed to fetch orders:', err.response?.data || err.message);
            setError('Failed to fetch orders. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const updateStatus = async (orderId, newStatus) => {
        if (!token) return;
        try {
            setStatusUpdating(orderId);
            await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/vendor/orders/${orderId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchOrders();
        } catch (err) {
            console.error('Failed to update status:', err.response?.data || err.message);
            alert('Failed to update status. Please try again.');
        } finally {
            setStatusUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="vendor-orders-loading" role="status" aria-live="polite">
                Loading orders...
            </div>
        );
    }

    if (error) {
        return (
            <div className="vendor-orders-error" role="alert" aria-live="assertive">
                {error}
            </div>
        );
    }

    return (
        <div className="vendor-orders-container">
            <h2 className="vendor-orders-title">Vendor Orders</h2>

            {orders.length === 0 ? (
                <p className="vendor-orders-empty">No orders yet.</p>
            ) : (
                orders.map(order => (
                    <article
                        key={order._id}
                        className="order-card"
                        aria-live="polite"
                        aria-relevant="additions"
                    >
                        <time dateTime={order.createdAt} className="order-time">
                            Date: {new Date(order.createdAt).toLocaleString()}
                        </time>

                        <div className="order-customer">
                            Customer: {order.customer?.name || 'N/A'}
                        </div>

                        <address className="order-address">{order.address}</address>

                        <ul className="order-items">
                            {order.items.map(item => (
                                <li key={item._id}>
                                    {item.productId?.name || 'Unknown Product'} × {item.quantity}
                                </li>
                            ))}
                        </ul>
                        <div className="order-total">
                            <strong>Items Total:</strong> ₹{(order.totalAmount - order.deliveryCharge).toFixed(2)}<br />
                            <strong>Delivery Charge:</strong> ₹{order.deliveryCharge.toFixed(2)}<br />
                            <strong>Grand Total:</strong> ₹{order.totalAmount.toFixed(2)}
                        </div>


                        <div className="order-status-container">
                            <strong>Status:</strong>
                            <span
                                className={`order-status-badge status-${order.status
                                    .replace(/\s+/g, '-')
                                    .toLowerCase()}`}
                            >
                                {order.status}
                            </span>

                            {(order.status === 'preparing' || order.status === 'out for delivery') && (
                                <select
                                    aria-label={`Update status for order ${order._id}`}
                                    value={order.status}
                                    onChange={e => updateStatus(order._id, e.target.value)}
                                    disabled={statusUpdating === order._id}
                                    className="status-select"
                                >
                                    {order.status === 'preparing' && (
                                        <>
                                            <option value="preparing">Preparing</option>
                                            <option value="out for delivery">Out for Delivery</option>
                                        </>
                                    )}
                                    {order.status === 'out for delivery' && (
                                        <>
                                            <option value="out for delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                        </>
                                    )}
                                </select>
                            )}
                        </div>

                        {order.status === 'cancelled' && order.reason && (
                            <p className="order-reason">
                                <strong>Rejection Reason:</strong> {order.reason}
                            </p>
                        )}
                    </article>
                ))
            )}
        </div>
    );
};

export default VendorOrders;