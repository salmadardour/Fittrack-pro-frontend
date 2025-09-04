import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Activity, TrendingUp, User, Settings, LogOut, Menu, X,
    Calendar, Clock, Plus, BarChart3, Scale, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '../../App';
import { useWebSocket, useRealtimeNotifications } from '../Services/WebSocketService';
import axios from 'axios';
import './Dashboard.css';

// Import sub-components
import DashboardHome from './DashboardHome';
import WorkoutList from '../Workouts/WorkoutList';
import NewWorkout from '../Workouts/NewWorkout';
import Profile from '../Profile/Profile';
import Analytics from './Analytics';
import Help from './Help';
import WorkoutDetail from '../Workouts/WorkoutDetail';
import Measurements from '../Measurements/Measurements';
import SettingsComponent from './Settings';

function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isConnected: wsConnected } = useWebSocket();
    const { notifications, clearNotifications, removeNotification } = useRealtimeNotifications();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        recentWorkouts: 0,
        totalVolume: 0,
        averageDuration: 0
    });
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        fetchUserStats();

        // Monitor online/offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Register service worker for PWA functionality
    useEffect(() => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    }, []);

    const fetchUserStats = async () => {
        try {
            const response = await axios.get('/users/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // If offline, try to get cached stats
            if (!navigator.onLine) {
                const cachedStats = localStorage.getItem('cachedUserStats');
                if (cachedStats) {
                    setStats(JSON.parse(cachedStats));
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Overview', exact: true },
        { path: '/dashboard/workouts', icon: Activity, label: 'Workouts' },
        { path: '/dashboard/new-workout', icon: Plus, label: 'New Workout' },
        { path: '/dashboard/measurements', icon: Scale, label: 'Measurements' },
        { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/dashboard/profile', icon: User, label: 'Profile' },
        { path: '/dashboard/settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-logo">
                        <span className="logo-main">FitTrack</span>
                        <span className="logo-accent">Pro</span>
                    </h2>
                    <button className="sidebar-toggle desktop-hidden" onClick={toggleSidebar}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive && item.exact ? 'active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                            end={item.exact}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.firstName} {user?.lastName}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>

                    {/* Connection Status */}
                    <div className="connection-status">
                        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        {wsConnected && (
                            <div className="ws-status">
                                <div className="ws-indicator active"></div>
                                <span>Real-time sync</span>
                            </div>
                        )}
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Top Bar */}
                <header className="dashboard-header">
                    <button className="sidebar-toggle mobile-only" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </button>

                    <div className="header-content">
                        <h1 className="header-title">
                            Welcome back, {user?.firstName}!
                        </h1>
                        <p className="header-subtitle">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="header-actions">
                        {/* Notifications */}
                        <div className="notifications-container">
                            <button
                                className={`notifications-btn ${notifications.length > 0 ? 'has-notifications' : ''}`}
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Calendar size={20} />
                                {notifications.length > 0 && (
                                    <span className="notification-badge">{notifications.length}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="notifications-dropdown">
                                    <div className="notifications-header">
                                        <h3>Notifications</h3>
                                        {notifications.length > 0 && (
                                            <button onClick={clearNotifications} className="clear-all-btn">
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="notifications-list">
                                        {notifications.length === 0 ? (
                                            <p className="no-notifications">No new notifications</p>
                                        ) : (
                                            notifications.map(notification => (
                                                <div key={notification.id} className="notification-item">
                                                    <h4>{notification.title}</h4>
                                                    <p>{notification.message}</p>
                                                    <button
                                                        onClick={() => removeNotification(notification.id)}
                                                        className="remove-notification"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="quick-action-btn" onClick={() => navigate('/dashboard/new-workout')}>
                            <Plus size={20} />
                            <span>Quick Workout</span>
                        </button>
                    </div>
                </header>

                {/* Offline Banner */}
                {!isOnline && (
                    <div className="offline-banner">
                        <WifiOff size={20} />
                        <span>You're offline. Some features may be limited.</span>
                    </div>
                )}

                {/* Stats Bar */}
                <div className="stats-bar">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Activity size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.totalWorkouts}</span>
                            <span className="stat-label">Total Workouts</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.recentWorkouts}</span>
                            <span className="stat-label">This Month</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{Math.round(stats.totalVolume / 1000)}k</span>
                            <span className="stat-label">Total Volume (kg)</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.averageDuration}</span>
                            <span className="stat-label">Avg Duration (min)</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="dashboard-content">
                    <Routes>
                        <Route path="/" element={<DashboardHome stats={stats} loading={loading} />} />
                        <Route path="/workouts" element={<WorkoutList />} />
                        <Route path="/workout/:id" element={<WorkoutDetail />} />
                        <Route path="/new-workout" element={<NewWorkout />} />
                        <Route path="/measurements" element={<Measurements />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<SettingsComponent />} />
                        <Route path="/help" element={<Help />} />
                    </Routes>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}
        </div>
    );
}

export default Dashboard;