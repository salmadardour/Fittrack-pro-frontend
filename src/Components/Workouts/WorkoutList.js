import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Calendar, Clock, Dumbbell, ChevronRight, Trash2, Search, Filter } from 'lucide-react';
import axios from 'axios';
import './Workouts.css';

function WorkoutList() {
    const navigate = useNavigate();
    const location = useLocation();
    const [workouts, setWorkouts] = useState([]);
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

    useEffect(() => {
        fetchWorkouts();
        // Clear success message after 3 seconds
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        filterWorkouts();
    }, [workouts, searchTerm, filterCategory]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchWorkouts = async () => {
        try {
            const response = await axios.get('/workouts');
            if (response.data.success) {
                setWorkouts(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch workouts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterWorkouts = () => {
        let filtered = [...workouts];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(workout =>
                workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                workout.exercises.some(ex =>
                    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(workout =>
                workout.exercises.some(ex => ex.category === filterCategory)
            );
        }

        setFilteredWorkouts(filtered);
    };

    const handleDelete = async (workoutId) => {
        if (!window.confirm('Are you sure you want to delete this workout?')) {
            return;
        }

        try {
            const response = await axios.delete(`/workouts/${workoutId}`);
            if (response.data.success) {
                setWorkouts(workouts.filter(w => w._id !== workoutId));
                setSuccessMessage('Workout deleted successfully');
            }
        } catch (error) {
            console.error('Failed to delete workout:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateTotalVolume = (exercises) => {
        let total = 0;
        exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                if (set.weight && set.reps) {
                    total += parseFloat(set.weight) * parseInt(set.reps);
                }
            });
        });
        return Math.round(total);
    };

    const getExerciseCategories = () => {
        const categories = new Set();
        workouts.forEach(workout => {
            workout.exercises.forEach(ex => {
                if (ex.category) categories.add(ex.category);
            });
        });
        return Array.from(categories);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading workouts...</p>
            </div>
        );
    }

    return (
        <div className="workout-list-container">
            {/* Header */}
            <div className="list-header">
                <div className="list-title-section">
                    <h2>Your Workouts</h2>
                    <p className="list-subtitle">Track your progress and stay consistent</p>
                </div>
                <button
                    className="new-workout-btn"
                    onClick={() => navigate('/dashboard/new-workout')}
                >
                    <Plus size={20} />
                    New Workout
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="success-banner">
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search workouts or exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-dropdown">
                    <Filter size={20} />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {getExerciseCategories().map(cat => (
                            <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Workout Stats Summary */}
            <div className="workout-stats-summary">
                <div className="summary-card">
                    <span className="summary-label">Total Workouts</span>
                    <span className="summary-value">{workouts.length}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">This Week</span>
                    <span className="summary-value">
                        {workouts.filter(w => {
                            const workoutDate = new Date(w.date);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return workoutDate >= weekAgo;
                        }).length}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Exercises</span>
                    <span className="summary-value">
                        {workouts.reduce((total, w) => total + w.exercises.length, 0)}
                    </span>
                </div>
            </div>

            {/* Workouts List */}
            {filteredWorkouts.length === 0 ? (
                <div className="empty-state">
                    {workouts.length === 0 ? (
                        <>
                            <Dumbbell size={48} />
                            <h3>No workouts yet</h3>
                            <p>Start your fitness journey by creating your first workout!</p>
                            <button
                                className="empty-state-btn"
                                onClick={() => navigate('/dashboard/new-workout')}
                            >
                                <Plus size={20} />
                                Create First Workout
                            </button>
                        </>
                    ) : (
                        <>
                            <Search size={48} />
                            <h3>No matching workouts</h3>
                            <p>Try adjusting your search or filters</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="workouts-grid">
                    {filteredWorkouts.map(workout => (
                        <div key={workout._id} className="workout-card">
                            <div className="workout-card-header">
                                <h3>{workout.name}</h3>
                                <button
                                    className="delete-workout-btn"
                                    onClick={() => handleDelete(workout._id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="workout-card-meta">
                                <div className="meta-item">
                                    <Calendar size={16} />
                                    <span>{formatDate(workout.date)}</span>
                                </div>
                                {workout.totalDuration && (
                                    <div className="meta-item">
                                        <Clock size={16} />
                                        <span>{workout.totalDuration} min</span>
                                    </div>
                                )}
                            </div>

                            <div className="workout-exercises">
                                <h4>Exercises ({workout.exercises.length})</h4>
                                <ul className="exercise-list">
                                    {workout.exercises.slice(0, 3).map((exercise, idx) => (
                                        <li key={idx}>
                                            <span className="exercise-name">{exercise.name}</span>
                                            <span className="exercise-sets">{exercise.sets.length} sets</span>
                                        </li>
                                    ))}
                                    {workout.exercises.length > 3 && (
                                        <li className="more-exercises">
                                            +{workout.exercises.length - 3} more exercises
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="workout-card-footer">
                                <div className="workout-volume">
                                    <span className="volume-label">Total Volume</span>
                                    <span className="volume-value">
                                        {calculateTotalVolume(workout.exercises)} kg
                                    </span>
                                </div>
                                <button
                                    className="view-details-btn"
                                    onClick={() => navigate(`/dashboard/workout/${workout._id}`)}
                                >
                                    View Details
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default WorkoutList;