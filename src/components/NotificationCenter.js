import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const {
        notifications,
        removeNotification,
        clearNotifications,
        isConnected,
        reconnectAttempts,
        requestNotificationPermission,
        incomingOrders,
        acceptOrder,
        rejectOrder
    } = useSocket();

    const [isOpen, setIsOpen] = useState(false);
    const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

    // Request notification permission on first interaction
    const handleRequestPermission = async () => {
        if (!hasRequestedPermission) {
            await requestNotificationPermission();
            setHasRequestedPermission(true);
        }
    };

    const getConnectionStatus = () => {
        if (isConnected) return { status: 'Connected', color: '#4CAF50' };
        if (reconnectAttempts > 0) return { status: `Reconnecting... (${reconnectAttempts})`, color: '#FF9800' };
        return { status: 'Disconnected', color: '#F44336' };
    };

    const connectionStatus = getConnectionStatus();
    const unreadCount = notifications.length + incomingOrders.length;

    const handleAcceptOrder = async (orderId) => {
        const success = await acceptOrder(orderId);
        if (success) {
            alert('✅ Order accepted successfully!');
        }
    };

    const handleRejectOrder = async (orderId) => {
        const reason = prompt('Please provide a reason for rejecting this order:');
        if (!reason) return;

        const success = await rejectOrder(orderId, reason);
        if (success) {
            alert('❌ Order rejected successfully!');
        }
    };

    return (
        <div className="notification-center vendor">
            {/* Connection Status Indicator */}
            <div className="connection-status" style={{ color: connectionStatus.color }}>
                <span className="status-dot" style={{ backgroundColor: connectionStatus.color }}></span>
                {connectionStatus.status}
            </div>

            {/* Notification Bell */}
            <div className="notification-bell vendor" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </div>

            {/* Notification Panel */}
            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        <h3>Vendor Notifications</h3>
                        <div className="notification-actions">
                            {!hasRequestedPermission && (
                                <button
                                    className="permission-btn"
                                    onClick={handleRequestPermission}
                                    title="Enable browser notifications"
                                >
                                    🔔 Enable
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    className="clear-btn"
                                    onClick={clearNotifications}
                                    title="Clear all notifications"
                                >
                                    🗑️ Clear
                                </button>
                            )}
                            <button
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✖️
                            </button>
                        </div>
                    </div>

                    <div className="notification-list">
                        {/* Incoming Orders Section */}
                        {incomingOrders.length > 0 && (
                            <div className="incoming-orders-section">
                                <h4 className="section-title">🚨 Incoming Orders</h4>
                                {incomingOrders.map((order) => (
                                    <div key={order._id} className="incoming-order-item">
                                        <div className="order-content">
                                            <div className="order-title">
                                                New Order from {order.customer?.name || 'Customer'}
                                            </div>
                                            <div className="order-details">
                                                <p><strong>Items:</strong> {order.items?.length || 0}</p>
                                                <p><strong>Total:</strong> ₹{order.totalAmount || 0}</p>
                                                <p><strong>Address:</strong> {order.address}</p>
                                            </div>
                                            <div className="order-actions">
                                                <button
                                                    className="accept-btn"
                                                    onClick={() => handleAcceptOrder(order._id)}
                                                >
                                                    ✅ Accept
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => handleRejectOrder(order._id)}
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Regular Notifications */}
                        {notifications.length === 0 && incomingOrders.length === 0 ? (
                            <div className="no-notifications">
                                <p>No notifications yet</p>
                                <small>You'll see order updates and new orders here</small>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.type}`}
                                >
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title}
                                        </div>
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>
                                        <div className="notification-time">
                                            {new Date(notification.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <button
                                        className="remove-notification"
                                        onClick={() => removeNotification(notification.id)}
                                        title="Remove notification"
                                    >
                                        ✖️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;