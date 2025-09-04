import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Target, Activity, Edit2, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../../App';
import axios from 'axios';
import './Profile.css';

function Profile() {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user?.gender || '',
        fitnessLevel: user?.fitnessLevel || 'beginner',
        goals: user?.goals || [],
        units: user?.units || 'metric',
        privacy: user?.privacy || 'private'
    });

    const [newGoal, setNewGoal] = useState('');

    const fitnessLevels = [
        { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
        { value: 'intermediate', label: 'Intermediate', description: 'Regular training experience' },
        { value: 'advanced', label: 'Advanced', description: 'Extensive training experience' }
    ];

    const predefinedGoals = [
        'Lose Weight',
        'Build Muscle',
        'Increase Strength',
        'Improve Endurance',
        'Stay Active',
        'Improve Flexibility',
        'Train for Event',
        'General Health'
    ];

    useEffect(() => {
        fetchUserStats();
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchUserStats = async () => {
        try {
            const response = await axios.get('/users/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const addGoal = () => {
        if (newGoal.trim() && formData.goals.length < 10) {
            setFormData(prev => ({
                ...prev,
                goals: [...prev.goals, newGoal.trim()]
            }));
            setNewGoal('');
        }
    };

    const addPredefinedGoal = (goal) => {
        if (!formData.goals.includes(goal) && formData.goals.length < 10) {
            setFormData(prev => ({
                ...prev,
                goals: [...prev.goals, goal]
            }));
        }
    };

    const removeGoal = (index) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13 || age > 120) {
                newErrors.dateOfBirth = 'Please enter a valid date of birth';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const result = await updateProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                fitnessLevel: formData.fitnessLevel,
                goals: formData.goals,
                units: formData.units,
                privacy: formData.privacy
            });

            if (result.success) {
                setSuccessMessage('Profile updated successfully!');
                setIsEditing(false);
            } else {
                setErrors({ general: result.error });
            }
        } catch (error) {
            setErrors({ general: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return null;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const getMembershipDuration = () => {
        if (!user?.createdAt) return 'Unknown';

        const joinDate = new Date(user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} days`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
        return `${Math.floor(diffDays / 365)} years`;
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2>Your Profile</h2>
                {!isEditing && (
                    <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                        <Edit2 size={20} />
                        Edit Profile
                    </button>
                )}
            </div>

            {successMessage && (
                <div className="success-message">
                    <CheckCircle size={20} />
                    <span>{successMessage}</span>
                </div>
            )}

            {errors.general && (
                <div className="error-message">
                    <X size={20} />
                    <span>{errors.general}</span>
                </div>
            )}

            <div className="profile-content">
                {/* User Info Card */}
                <div className="profile-card user-info-card">
                    <div className="card-header">
                        <h3>Personal Information</h3>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={errors.firstName ? 'error' : ''}
                                    />
                                    {errors.firstName && (
                                        <span className="field-error">{errors.firstName}</span>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={errors.lastName ? 'error' : ''}
                                    />
                                    {errors.lastName && (
                                        <span className="field-error">{errors.lastName}</span>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label>Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className={errors.dateOfBirth ? 'error' : ''}
                                    />
                                    {errors.dateOfBirth && (
                                        <span className="field-error">{errors.dateOfBirth}</span>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label>Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Units</label>
                                    <select
                                        name="units"
                                        value={formData.units}
                                        onChange={handleChange}
                                    >
                                        <option value="metric">Metric (kg, cm)</option>
                                        <option value="imperial">Imperial (lbs, in)</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Privacy</label>
                                    <select
                                        name="privacy"
                                        value={formData.privacy}
                                        onChange={handleChange}
                                    >
                                        <option value="private">Private</option>
                                        <option value="public">Public</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            firstName: user?.firstName || '',
                                            lastName: user?.lastName || '',
                                            email: user?.email || '',
                                            dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                                            gender: user?.gender || '',
                                            fitnessLevel: user?.fitnessLevel || 'beginner',
                                            goals: user?.goals || [],
                                            units: user?.units || 'metric',
                                            privacy: user?.privacy || 'private'
                                        });
                                        setErrors({});
                                    }}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="info-display">
                            <div className="info-item">
                                <User size={18} />
                                <span className="info-label">Name:</span>
                                <span className="info-value">{user?.firstName} {user?.lastName}</span>
                            </div>
                            <div className="info-item">
                                <Mail size={18} />
                                <span className="info-label">Email:</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                            <div className="info-item">
                                <Calendar size={18} />
                                <span className="info-label">Age:</span>
                                <span className="info-value">
                                    {user?.dateOfBirth ? `${calculateAge(user.dateOfBirth)} years` : 'Not set'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Gender:</span>
                                <span className="info-value">{user?.gender || 'Not set'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Member Since:</span>
                                <span className="info-value">{getMembershipDuration()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fitness Profile Card */}
                <div className="profile-card fitness-card">
                    <div className="card-header">
                        <h3>Fitness Profile</h3>
                    </div>

                    {isEditing ? (
                        <div className="fitness-edit">
                            <div className="fitness-level-selector">
                                <label>Fitness Level</label>
                                <div className="level-options">
                                    {fitnessLevels.map(level => (
                                        <div
                                            key={level.value}
                                            className={`level-option ${formData.fitnessLevel === level.value ? 'selected' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, fitnessLevel: level.value }))}
                                        >
                                            <strong>{level.label}</strong>
                                            <small>{level.description}</small>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="goals-section">
                                <label>Fitness Goals</label>
                                <div className="goals-input">
                                    <input
                                        type="text"
                                        value={newGoal}
                                        onChange={(e) => setNewGoal(e.target.value)}
                                        placeholder="Add custom goal"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                    />
                                    <button type="button" onClick={addGoal} className="add-goal-btn">
                                        Add
                                    </button>
                                </div>

                                <div className="predefined-goals">
                                    {predefinedGoals.map(goal => (
                                        <button
                                            key={goal}
                                            type="button"
                                            className={`goal-chip ${formData.goals.includes(goal) ? 'selected' : ''}`}
                                            onClick={() => addPredefinedGoal(goal)}
                                            disabled={formData.goals.includes(goal)}
                                        >
                                            {goal}
                                        </button>
                                    ))}
                                </div>

                                {formData.goals.length > 0 && (
                                    <div className="current-goals">
                                        <span className="goals-label">Your Goals:</span>
                                        <div className="goals-list">
                                            {formData.goals.map((goal, index) => (
                                                <div key={index} className="goal-tag">
                                                    <span>{goal}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGoal(index)}
                                                        className="remove-goal"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="fitness-display">
                            <div className="fitness-item">
                                <Activity size={18} />
                                <span className="fitness-label">Level:</span>
                                <span className="fitness-value">
                                    {user?.fitnessLevel ? user.fitnessLevel.charAt(0).toUpperCase() + user.fitnessLevel.slice(1) : 'Not set'}
                                </span>
                            </div>
                            <div className="fitness-item">
                                <Target size={18} />
                                <span className="fitness-label">Goals:</span>
                                <div className="goals-display">
                                    {user?.goals && user.goals.length > 0 ? (
                                        user.goals.map((goal, index) => (
                                            <span key={index} className="goal-badge">{goal}</span>
                                        ))
                                    ) : (
                                        <span className="no-goals">No goals set</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Card */}
                {stats && (
                    <div className="profile-card stats-card">
                        <div className="card-header">
                            <h3>Your Statistics</h3>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">{stats.totalWorkouts}</span>
                                <span className="stat-label">Total Workouts</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.recentWorkouts}</span>
                                <span className="stat-label">Last 30 Days</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{Math.round(stats.totalVolume / 1000)}k</span>
                                <span className="stat-label">Volume (kg)</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.averageDuration}</span>
                                <span className="stat-label">Avg Duration (min)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;