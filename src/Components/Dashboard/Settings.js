import React, { useState, useEffect } from 'react';
import {
    Bell, Shield, Globe,
    Moon, Sun, Lock, AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '../../App';
import './Settings.css';

function Settings() {
    const { user, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        // General Settings
        units: user?.units || 'metric',
        language: 'english',
        theme: 'light',

        // Notification Settings
        emailNotifications: true,
        workoutReminders: true,
        weeklyReports: false,
        achievementAlerts: true,

        // Privacy Settings
        profileVisibility: user?.privacy || 'private',
        showStats: false,
        allowMessages: false,

        // Account Settings
        twoFactorAuth: false,
        sessionTimeout: '30',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
                setErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const handleSettingChange = (category, setting, value) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const saveGeneralSettings = async () => {
        setIsSaving(true);
        try {
            const result = await updateProfile({
                units: settings.units,
                privacy: settings.profileVisibility
            });

            if (result.success) {
                setSuccessMessage('Settings saved successfully!');
            } else {
                setErrorMessage('Failed to save settings');
            }
        } catch (error) {
            setErrorMessage('An error occurred while saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMessage('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setErrorMessage('Password must be at least 6 characters');
            return;
        }

        setIsSaving(true);
        try {
            // In a real app, you would call an API endpoint to change password
            // For now, we'll just simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccessMessage('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            setErrorMessage('Failed to change password');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'account', label: 'Account', icon: Lock }
    ];

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h2>Settings</h2>
                <p className="settings-subtitle">Manage your account preferences</p>
            </div>

            {successMessage && (
                <div className="settings-alert success">
                    <CheckCircle size={20} />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="settings-alert error">
                    <AlertCircle size={20} />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="settings-content">
                {/* Tabs Navigation */}
                <div className="settings-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="settings-panel">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <h3>General Settings</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Measurement Units</label>
                                    <span className="setting-description">
                                        Choose your preferred unit system
                                    </span>
                                </div>
                                <select
                                    value={settings.units}
                                    onChange={(e) => handleSettingChange('general', 'units', e.target.value)}
                                    className="setting-control"
                                >
                                    <option value="metric">Metric (kg, cm)</option>
                                    <option value="imperial">Imperial (lbs, in)</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Language</label>
                                    <span className="setting-description">
                                        Select your preferred language
                                    </span>
                                </div>
                                <select
                                    value={settings.language}
                                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                                    className="setting-control"
                                >
                                    <option value="english">English</option>
                                    <option value="spanish">Spanish</option>
                                    <option value="french">French</option>
                                    <option value="german">German</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Theme</label>
                                    <span className="setting-description">
                                        Choose your preferred theme
                                    </span>
                                </div>
                                <div className="theme-selector">
                                    <button
                                        className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                                        onClick={() => handleSettingChange('general', 'theme', 'light')}
                                    >
                                        <Sun size={20} />
                                        Light
                                    </button>
                                    <button
                                        className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => handleSettingChange('general', 'theme', 'dark')}
                                    >
                                        <Moon size={20} />
                                        Dark
                                    </button>
                                </div>
                            </div>

                            <button
                                className="save-button"
                                onClick={saveGeneralSettings}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <h3>Notification Preferences</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Email Notifications</label>
                                    <span className="setting-description">
                                        Receive updates and alerts via email
                                    </span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Workout Reminders</label>
                                    <span className="setting-description">
                                        Get reminders to stay active
                                    </span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.workoutReminders}
                                        onChange={(e) => handleSettingChange('notifications', 'workoutReminders', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Weekly Progress Reports</label>
                                    <span className="setting-description">
                                        Receive weekly summary of your progress
                                    </span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.weeklyReports}
                                        onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Achievement Alerts</label>
                                    <span className="setting-description">
                                        Get notified when you reach milestones
                                    </span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.achievementAlerts}
                                        onChange={(e) => handleSettingChange('notifications', 'achievementAlerts', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <button className="save-button" disabled={isSaving}>
                                Save Notification Settings
                            </button>
                        </div>
                    )}

                    {/* Privacy Settings */}
                    {activeTab === 'privacy' && (
                        <div className="settings-section">
                            <h3>Privacy & Security</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Profile Visibility</label>
                                    <span className="setting-description">
                                        Control who can see your profile
                                    </span>
                                </div>
                                <select
                                    value={settings.profileVisibility}
                                    onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                                    className="setting-control"
                                >
                                    <option value="private">Private</option>
                                    <option value="public">Public</option>
                                    <option value="friends">Friends Only</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Show Statistics</label>
                                    <span className="setting-description">
                                        Allow others to see your workout stats
                                    </span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.showStats}
                                        onChange={(e) => handleSettingChange('privacy', 'showStats', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Allow Messages</label>
                                    <span className="setting-description">
                                        Let other users send you messages
                                    </span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.allowMessages}
                                        onChange={(e) => handleSettingChange('privacy', 'allowMessages', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <button className="save-button" disabled={isSaving}>
                                Save Privacy Settings
                            </button>
                        </div>
                    )}

                    {/* Account Settings */}
                    {activeTab === 'account' && (
                        <div className="settings-section">
                            <h3>Account Security</h3>

                            {/* Change Password Form */}
                            <div className="password-section">
                                <h4>Change Password</h4>
                                <form onSubmit={handlePasswordChange} className="password-form">
                                    <div className="form-group">
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData(prev => ({
                                                ...prev,
                                                currentPassword: e.target.value
                                            }))}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({
                                                ...prev,
                                                newPassword: e.target.value
                                            }))}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({
                                                ...prev,
                                                confirmPassword: e.target.value
                                            }))}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="save-button" disabled={isSaving}>
                                        {isSaving ? 'Changing Password...' : 'Change Password'}
                                    </button>
                                </form>
                            </div>

                            <div className="divider"></div>

                            {/* Two-Factor Authentication */}
                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Two-Factor Authentication</label>
                                    <span className="setting-description">
                                        Add an extra layer of security to your account
                                    </span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.twoFactorAuth}
                                        onChange={(e) => handleSettingChange('account', 'twoFactorAuth', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Session Timeout</label>
                                    <span className="setting-description">
                                        Automatically log out after inactivity
                                    </span>
                                </div>
                                <select
                                    value={settings.sessionTimeout}
                                    onChange={(e) => handleSettingChange('account', 'sessionTimeout', e.target.value)}
                                    className="setting-control"
                                >
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="never">Never</option>
                                </select>
                            </div>

                            <div className="divider"></div>

                            {/* Danger Zone */}
                            <div className="danger-zone">
                                <h4>Danger Zone</h4>
                                <p className="danger-description">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button className="danger-button">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Settings;