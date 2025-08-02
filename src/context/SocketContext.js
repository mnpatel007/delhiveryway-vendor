import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [incomingOrders, setIncomingOrders] = useState([]);

    // Track user activity to maintain connection
    useEffect(() => {
        const updateActivity = () => {
            setLastActivity(Date.now());
            if (socket && !isConnected) {
                console.log('🔄 User activity detected, attempting reconnection...');
                socket.connect();
            }
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateActivity, true);
            });
        };
    }, [socket, isConnected]);

    // Heartbeat to keep connection alive
    useEffect(() => {
        const heartbeat = setInterval(() => {
            if (socket && isConnected) {
                socket.emit('heartbeat', {
                    timestamp: Date.now(),
                    userId: user?.user?._id,
                    userType: 'vendor'
                });
                console.log('💓 Vendor heartbeat sent');
            }
        }, 20000); // Every 20 seconds (more frequent for vendors)

        return () => clearInterval(heartbeat);
    }, [socket, isConnected, user]);

    // Page visibility change handler to reconnect when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && socket && !isConnected) {
                console.log('👁️ Page became visible, attempting reconnection...');
                socket.connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [socket, isConnected]);

    // Window focus handler
    useEffect(() => {
        const handleFocus = () => {
            if (socket && !isConnected) {
                console.log('🎯 Window focused, attempting reconnection...');
                socket.connect();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [socket, isConnected]);

    useEffect(() => {
        if (user?.token && user.user.role === 'vendor') {
            console.log('🔌 Initializing vendor socket connection...');

            // Initialize socket connection with better options
            const newSocket = io(BACKEND_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                timeout: 20000,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                maxReconnectionAttempts: 10,
                forceNew: true
            });

            newSocket.on('connect', () => {
                console.log('🟢 Vendor socket connected:', newSocket.id);
                setIsConnected(true);
                setReconnectAttempts(0);

                // Register as vendor
                newSocket.emit('registerVendor', user.user._id);
                console.log('📝 Registered as vendor:', user.user._id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔴 Vendor socket disconnected:', reason);
                setIsConnected(false);

                if (reason === 'io server disconnect') {
                    // Server disconnected, try to reconnect
                    setTimeout(() => newSocket.connect(), 1000);
                }
            });

            newSocket.on('connect_error', (error) => {
                console.error('❌ Vendor socket connection error:', error);
                setIsConnected(false);
                setReconnectAttempts(prev => prev + 1);
            });

            newSocket.on('reconnect', (attemptNumber) => {
                console.log('🔄 Vendor socket reconnected after', attemptNumber, 'attempts');
                setIsConnected(true);
                setReconnectAttempts(0);
                // Re-register after reconnection
                newSocket.emit('registerVendor', user.user._id);
            });

            newSocket.on('reconnect_attempt', (attemptNumber) => {
                console.log('🔄 Vendor socket reconnection attempt:', attemptNumber);
                setReconnectAttempts(attemptNumber);
            });

            newSocket.on('reconnect_failed', () => {
                console.error('❌ Vendor socket reconnection failed');
                setIsConnected(false);
            });

            // Listen for new orders
            newSocket.on('newOrder', (order) => {
                console.log('📦 New order received via socket:', order);

                // Add to incoming orders queue
                setIncomingOrders(prev => {
                    // Check if order already exists
                    const exists = prev.some(existingOrder => existingOrder._id === order._id);
                    if (exists) return prev;

                    return [order, ...prev];
                });

                addNotification({
                    id: Date.now(),
                    type: 'new_order',
                    title: '🚨 New Order Received!',
                    message: `Order from ${order.customer?.name || 'Customer'} - ${order.items?.length || 0} items`,
                    data: order,
                    timestamp: new Date().toISOString()
                });

                // Play notification sound
                playNotificationSound();

                // Show browser notification
                showBrowserNotification(
                    '🚨 New Order Received!',
                    `Order from ${order.customer?.name || 'Customer'} - ${order.items?.length || 0} items`
                );

                // Show urgent alert
                setTimeout(() => {
                    if (window.confirm(`🚨 NEW ORDER RECEIVED!\n\nCustomer: ${order.customer?.name || 'Customer'}\nItems: ${order.items?.length || 0}\nTotal: ₹${order.totalAmount || 0}\n\nClick OK to view details or Cancel to dismiss.`)) {
                        // Focus on the order notification
                        window.scrollTo(0, 0);
                    }
                }, 500);
            });

            // Listen for rehearsal checkout requests
            newSocket.on('rehearsalCheckoutRequest', (data) => {
                console.log('🎭 Rehearsal checkout request:', data);

                addNotification({
                    id: Date.now(),
                    type: 'rehearsal_request',
                    title: 'Rehearsal Checkout Request',
                    message: `Customer wants to rehearse checkout for ${data.items?.length || 0} items`,
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('Rehearsal Checkout Request', `Customer wants to rehearse checkout`);
            });

            // Listen for final checkout requests
            newSocket.on('finalCheckoutRequest', (data) => {
                console.log('✅ Final checkout request:', data);

                addNotification({
                    id: Date.now(),
                    type: 'final_request',
                    title: 'Final Checkout Request',
                    message: `Customer is ready for final checkout - ${data.items?.length || 0} items`,
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('Final Checkout Request', `Customer is ready for final checkout`);
            });

            // Listen for order status updates
            newSocket.on('orderStatusUpdate', (data) => {
                console.log('📋 Order status update:', data);

                addNotification({
                    id: Date.now(),
                    type: 'status_update',
                    title: 'Order Status Updated',
                    message: `Order #${data.orderId?.slice(-6) || 'Unknown'} status: ${data.status}`,
                    data: data,
                    timestamp: new Date().toISOString()
                });

                // Refresh vendor data
                if (window.refreshVendorData) {
                    window.refreshVendorData();
                }

                // Also trigger a general page refresh for vendor order pages
                if (window.location.pathname.includes('/vendor-orders') ||
                    window.location.pathname === '/') {
                    setTimeout(() => window.location.reload(), 2000);
                }
            });

            // Listen for payment confirmations
            newSocket.on('paymentConfirmed', (data) => {
                console.log('💳 Customer payment confirmed:', data);

                addNotification({
                    id: Date.now(),
                    type: 'payment_confirmed',
                    title: '💳 Payment Received!',
                    message: `Customer has paid ₹${data.amount}. Order is now confirmed and ready for preparation.`,
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('💳 Payment Received!', `₹${data.amount} received. Start preparing the order.`);

                // Refresh vendor data
                if (window.refreshVendorData) {
                    window.refreshVendorData();
                }
            });

            // Listen for delivery partner assignments
            newSocket.on('deliveryAssigned', (data) => {
                console.log('🚚 Delivery partner assigned:', data);

                addNotification({
                    id: Date.now(),
                    type: 'delivery_assigned',
                    title: '🚚 Delivery Partner Assigned!',
                    message: `${data.deliveryPartner?.name || 'A delivery partner'} will pick up the order from your location.`,
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('🚚 Delivery Partner Assigned!', 'Prepare the order for pickup');
            });

            // Listen for delivery assignments
            newSocket.on('deliveryAssigned', (data) => {
                console.log('🚚 Delivery assigned:', data);

                addNotification({
                    id: Date.now(),
                    type: 'delivery_assigned',
                    title: 'Delivery Assigned',
                    message: `Order #${data.orderId?.slice(-6) || 'Unknown'} has been assigned to delivery`,
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('Delivery Assigned', `Order has been assigned to delivery`);
            });

            setSocket(newSocket);

            return () => {
                console.log('🔌 Cleaning up vendor socket connection...');
                newSocket.disconnect();
                setSocket(null);
                setIsConnected(false);
            };
        }
    }, [user?.token, user?.user?.role, user?.user?._id]);

    // Remove order from incoming queue
    const removeIncomingOrder = (orderId) => {
        setIncomingOrders(prev => prev.filter(order => order._id !== orderId));
    };

    // Accept order
    const acceptOrder = async (orderId) => {
        try {
            console.log('🔄 Accepting order:', orderId);

            // Try different endpoints based on order type
            let response;

            // First try the rehearsal order confirmation endpoint
            response = await fetch(`${BACKEND_URL}/api/vendor/orders/${orderId}/confirm`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'confirmed'
                })
            });

            // If that fails, try the accept endpoint
            if (!response.ok) {
                console.log('🔄 Trying accept endpoint...');
                response = await fetch(`${BACKEND_URL}/api/vendor/orders/${orderId}/accept`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            // If that fails, try the generic status update
            if (!response.ok) {
                console.log('🔄 Trying status update endpoint...');
                response = await fetch(`${BACKEND_URL}/api/vendor/orders/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'preparing' })
                });
            }

            if (response.ok) {
                console.log('✅ Order accepted successfully');
                emitEvent('orderStatusUpdate', { orderId, status: 'preparing' });
                removeIncomingOrder(orderId);

                addNotification({
                    id: Date.now(),
                    type: 'order_accepted',
                    title: 'Order Accepted',
                    message: `Order #${orderId.slice(-6)} has been accepted and is now being prepared`,
                    timestamp: new Date().toISOString()
                });

                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to accept order:', response.status, errorText);
                throw new Error(`Failed to accept order: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error accepting order:', error);
            alert(`Failed to accept order: ${error.message}. Please try again.`);
            return false;
        }
    };

    // Reject order
    const rejectOrder = async (orderId, reason) => {
        try {
            console.log('🔄 Rejecting order:', orderId, 'Reason:', reason);

            let response;

            // Try the reject endpoint first
            response = await fetch(`${BACKEND_URL}/api/vendor/orders/${orderId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            // If that fails, try the generic status update
            if (!response.ok) {
                console.log('🔄 Trying status update endpoint for rejection...');
                response = await fetch(`${BACKEND_URL}/api/vendor/orders/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'cancelled', reason })
                });
            }

            if (response.ok) {
                console.log('✅ Order rejected successfully');
                emitEvent('orderStatusUpdate', { orderId, status: 'cancelled', reason });
                removeIncomingOrder(orderId);

                addNotification({
                    id: Date.now(),
                    type: 'order_rejected',
                    title: 'Order Rejected',
                    message: `Order #${orderId.slice(-6)} has been rejected: ${reason}`,
                    timestamp: new Date().toISOString()
                });

                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to reject order:', response.status, errorText);
                throw new Error(`Failed to reject order: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error rejecting order:', error);
            alert(`Failed to reject order: ${error.message}. Please try again.`);
            return false;
        }
    };

    // Add notification to list
    const addNotification = (notification) => {
        setNotifications(prev => {
            // Check if notification already exists
            const exists = prev.some(notif =>
                notif.id === notification.id ||
                (notif.message === notification.message && notif.title === notification.title)
            );

            if (exists) {
                return prev; // Don't add duplicate
            }

            return [notification, ...prev.slice(0, 49)]; // Keep last 50 notifications
        });
    };

    // Remove notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    // Clear all notifications
    const clearNotifications = () => {
        setNotifications([]);
    };

    // Play notification sound
    const playNotificationSound = () => {
        try {
            // Try to play MP3 file first
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.7; // Slightly louder for vendors
            audio.play().catch(error => {
                console.log('MP3 not available, generating sound:', error);
                // Fallback: Generate a more urgent notification sound for vendors
                generateVendorNotificationSound();
            });
        } catch (error) {
            console.log('Audio not available:', error);
            generateVendorNotificationSound();
        }
    };

    // Generate urgent notification sound for vendors using Web Audio API
    const generateVendorNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a more urgent notification sound (three-tone beep)
            const playTone = (frequency, duration, delay = 0) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                    oscillator.type = 'square'; // More attention-grabbing sound

                    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + duration);
                }, delay);
            };

            // Play urgent three-tone notification for new orders
            playTone(1000, 0.15, 0);    // First tone (high)
            playTone(800, 0.15, 200);   // Second tone (medium)
            playTone(1000, 0.2, 400);   // Third tone (high, longer)

        } catch (error) {
            console.log('Web Audio API not available:', error);
        }
    };

    // Show browser notification
    const showBrowserNotification = (title, body) => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    tag: 'vendor-notification',
                    requireInteraction: true,
                    silent: false
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, {
                            body,
                            icon: '/logo192.png',
                            badge: '/logo192.png',
                            tag: 'vendor-notification',
                            requireInteraction: true,
                            silent: false
                        });
                    }
                });
            }
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission;
        }
        return 'denied';
    };

    // Emit events
    const emitEvent = (eventName, data) => {
        if (socket && isConnected) {
            socket.emit(eventName, data);
        } else {
            console.warn('Cannot emit event - socket not connected:', eventName);
        }
    };

    // Join specific room
    const joinRoom = (roomName) => {
        if (socket && isConnected) {
            socket.emit('join', roomName);
        }
    };

    // Leave specific room
    const leaveRoom = (roomName) => {
        if (socket && isConnected) {
            socket.emit('leave', roomName);
        }
    };

    const value = {
        socket,
        isConnected,
        notifications,
        reconnectAttempts,
        incomingOrders,
        addNotification,
        removeNotification,
        clearNotifications,
        requestNotificationPermission,
        acceptOrder,
        rejectOrder,
        removeIncomingOrder,
        emitEvent,
        joinRoom,
        leaveRoom
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};