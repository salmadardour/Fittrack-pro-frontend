import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../../App';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscribers = new Map();
        this.isConnected = false;
        this.heartbeatInterval = null;
        this.connectionPromise = null;
    }

    // Initialize WebSocket connection
    async connect(token) {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
                this.socket = new WebSocket(`${wsUrl}?token=${token}`);

                this.socket.onopen = () => {
                    console.log('[WS] Connected to WebSocket server');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.notifySubscribers('connection', { status: 'connected' });
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('[WS] Failed to parse message:', error);
                    }
                };

                this.socket.onclose = (event) => {
                    console.log('[WS] Connection closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.notifySubscribers('connection', { status: 'disconnected' });

                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect(token);
                    }
                };

                this.socket.onerror = (error) => {
                    console.error('[WS] WebSocket error:', error);
                    this.notifySubscribers('error', { error: 'Connection error' });
                    reject(error);
                };

                // Timeout for connection
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);

            } catch (error) {
                console.error('[WS] Failed to create WebSocket connection:', error);
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    // Handle incoming messages
    handleMessage(data) {
        console.log('[WS] Received message:', data);

        switch (data.type) {
            case 'workout_update':
                this.notifySubscribers('workout_update', data.payload);
                break;

            case 'measurement_update':
                this.notifySubscribers('measurement_update', data.payload);
                break;

            case 'user_stats_update':
                this.notifySubscribers('user_stats_update', data.payload);
                break;

            case 'notification':
                this.notifySubscribers('notification', data.payload);
                break;

            case 'live_workout_session':
                this.notifySubscribers('live_workout', data.payload);
                break;

            case 'pong':
                // Heartbeat response
                break;

            default:
                console.warn('[WS] Unknown message type:', data.type);
        }
    }

    // Send message to server
    send(type, payload) {
        if (!this.isConnected || !this.socket) {
            console.warn('[WS] Cannot send message - not connected');
            return false;
        }

        try {
            const message = JSON.stringify({ type, payload, timestamp: Date.now() });
            this.socket.send(message);
            return true;
        } catch (error) {
            console.error('[WS] Failed to send message:', error);
            return false;
        }
    }

    // Subscribe to specific event types
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }

        this.subscribers.get(eventType).add(callback);

        // Return unsubscribe function
        return () => {
            const subscribers = this.subscribers.get(eventType);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    this.subscribers.delete(eventType);
                }
            }
        };
    }

    // Notify all subscribers of an event
    notifySubscribers(eventType, data) {
        const subscribers = this.subscribers.get(eventType);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[WS] Subscriber callback error:', error);
                }
            });
        }
    }

    // Start heartbeat to keep connection alive
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send('ping', {});
            }
        }, 30000); // Send ping every 30 seconds
    }

    // Stop heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Schedule reconnection attempt
    scheduleReconnect(token) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[WS] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

        setTimeout(() => {
            if (!this.isConnected) {
                this.connectionPromise = null;
                this.connect(token).catch(error => {
                    console.error('[WS] Reconnection failed:', error);
                });
            }
        }, delay);
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'Client disconnecting');
            this.socket = null;
        }

        this.isConnected = false;
        this.stopHeartbeat();
        this.subscribers.clear();
        this.connectionPromise = null;
    }

    // Get connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscriberCount: Array.from(this.subscribers.values())
                .reduce((total, subscribers) => total + subscribers.size, 0)
        };
    }

    // Workout-specific methods
    startLiveWorkout(workoutData) {
        return this.send('start_live_workout', workoutData);
    }

    updateLiveWorkout(updateData) {
        return this.send('update_live_workout', updateData);
    }

    endLiveWorkout(workoutId) {
        return this.send('end_live_workout', { workoutId });
    }

    // Sync offline data when reconnected
    syncOfflineData(offlineData) {
        return this.send('sync_offline_data', offlineData);
    }

    // Request real-time stats update
    requestStatsUpdate() {
        return this.send('request_stats_update', {});
    }
}

// Create singleton instance
export const wsService = new WebSocketService();

// React Hook for WebSocket functionality
export const useWebSocket = () => {
    const { user } = useAuth();
    const wsRef = useRef(wsService);

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('accessToken');
            if (token) {
                wsRef.current.connect(token).catch(error => {
                    console.error('[WS Hook] Connection failed:', error);
                });
            }
        }

        return () => {
            // Don't disconnect on cleanup - let the service manage the connection
        };
    }, [user]);

    const subscribe = useCallback((eventType, callback) => {
        return wsRef.current.subscribe(eventType, callback);
    }, []);

    const send = useCallback((type, payload) => {
        return wsRef.current.send(type, payload);
    }, []);

    const getStatus = useCallback(() => {
        return wsRef.current.getConnectionStatus();
    }, []);

    return {
        subscribe,
        send,
        getStatus,
        isConnected: wsRef.current.isConnected
    };
};

// React Hook for live workout session
export const useLiveWorkout = () => {
    const { send, subscribe } = useWebSocket();
    const [liveSession, setLiveSession] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribe('live_workout', (data) => {
            setLiveSession(data);
        });

        return unsubscribe;
    }, [subscribe]);

    const startWorkout = useCallback((workoutData) => {
        const success = send('start_live_workout', workoutData);
        if (success) {
            setLiveSession({ ...workoutData, status: 'active', startTime: Date.now() });
        }
        return success;
    }, [send]);

    const updateWorkout = useCallback((updateData) => {
        return send('update_live_workout', updateData);
    }, [send]);

    const endWorkout = useCallback((workoutId) => {
        const success = send('end_live_workout', { workoutId });
        if (success) {
            setLiveSession(null);
        }
        return success;
    }, [send]);

    return {
        liveSession,
        startWorkout,
        updateWorkout,
        endWorkout
    };
};

// React Hook for real-time notifications
export const useRealtimeNotifications = () => {
    const { subscribe } = useWebSocket();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribe('notification', (notification) => {
            setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/icons/icon-192x192.png',
                    tag: notification.id
                });
            }
        });

        return unsubscribe;
    }, [subscribe]);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return {
        notifications,
        clearNotifications,
        removeNotification
    };
};

// React Hook for real-time data updates
export const useRealtimeData = () => {
    const { subscribe } = useWebSocket();
    const [updates, setUpdates] = useState({
        workouts: null,
        measurements: null,
        stats: null
    });

    useEffect(() => {
        const unsubscribeWorkouts = subscribe('workout_update', (data) => {
            setUpdates(prev => ({ ...prev, workouts: data }));
        });

        const unsubscribeMeasurements = subscribe('measurement_update', (data) => {
            setUpdates(prev => ({ ...prev, measurements: data }));
        });

        const unsubscribeStats = subscribe('user_stats_update', (data) => {
            setUpdates(prev => ({ ...prev, stats: data }));
        });

        return () => {
            unsubscribeWorkouts();
            unsubscribeMeasurements();
            unsubscribeStats();
        };
    }, [subscribe]);

    return updates;
};

export default wsService;