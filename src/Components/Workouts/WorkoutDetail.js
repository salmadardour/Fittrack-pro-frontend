import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Weight, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import './WorkoutDetail.css';

function WorkoutDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use useCallback to memoize the function and prevent useEffect dependency warning
    const fetchWorkoutDetail = useCallback(async () => {
        try {
            const response = await axios.get(`/workouts/${id}`);
            if (response.data.success) {
                setWorkout(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch workout details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchWorkoutDetail();
    }, [fetchWorkoutDetail]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this workout?')) {
            return;
        }

        try {
            await axios.delete(`/workouts/${id}`);
            navigate('/dashboard/workouts', {
                state: { message: 'Workout deleted successfully' }
            });
        } catch (error) {
            console.error('Failed to delete workout:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading workout details...</p>
            </div>
        );
    }

    if (!workout) {
        return (
            <div className="not-found">
                <h2>Workout Not Found</h2>
                <button onClick={() => navigate('/dashboard/workouts')}>Back to Workouts</button>
            </div>
        );
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateTotalSets = () => {
        return workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
    };

    const calculateTotalReps = () => {
        return workout.exercises.reduce((total, ex) => {
            return total + ex.sets.reduce((setTotal, set) => setTotal + (parseInt(set.reps) || 0), 0);
        }, 0);
    };

    return (
        <div className="workout-detail-container">
            <div className="detail-header">
                <button className="back-button" onClick={() => navigate('/dashboard/workouts')}>
                    <ArrowLeft size={20} />
                    Back to Workouts
                </button>
                <div className="detail-actions">
                    <button className="edit-button" onClick={() => navigate(`/dashboard/workout/${id}/edit`)}>
                        <Edit size={18} />
                        Edit
                    </button>
                    <button className="delete-button" onClick={handleDelete}>
                        <Trash2 size={18} />
                        Delete
                    </button>
                </div>
            </div>

            <div className="workout-detail-content">
                <h1>{workout.name}</h1>

                <div className="detail-meta">
                    <div className="meta-item">
                        <Calendar size={18} />
                        <span>{formatDate(workout.date)}</span>
                    </div>
                    {workout.totalDuration && (
                        <div className="meta-item">
                            <Clock size={18} />
                            <span>{workout.totalDuration} minutes</span>
                        </div>
                    )}
                    <div className="meta-item">
                        <Weight size={18} />
                        <span>{workout.totalVolume || 0} kg total volume</span>
                    </div>
                </div>

                {workout.notes && (
                    <div className="workout-notes">
                        <h3>Notes</h3>
                        <p>{workout.notes}</p>
                    </div>
                )}

                <div className="workout-summary">
                    <div className="summary-item">
                        <span className="summary-value">{workout.exercises.length}</span>
                        <span className="summary-label">Exercises</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-value">{calculateTotalSets()}</span>
                        <span className="summary-label">Total Sets</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-value">{calculateTotalReps()}</span>
                        <span className="summary-label">Total Reps</span>
                    </div>
                </div>

                <div className="exercises-detail">
                    <h2>Exercises</h2>
                    {workout.exercises.map((exercise, idx) => (
                        <div key={idx} className="exercise-detail-card">
                            <div className="exercise-detail-header">
                                <h3>{exercise.name}</h3>
                                {exercise.category && (
                                    <span className="exercise-category">{exercise.category}</span>
                                )}
                            </div>

                            {exercise.notes && (
                                <p className="exercise-notes">{exercise.notes}</p>
                            )}

                            <div className="sets-detail">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Set</th>
                                            <th>Reps</th>
                                            <th>Weight (kg)</th>
                                            <th>Rest (sec)</th>
                                            {exercise.sets.some(s => s.rpe) && <th>RPE</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exercise.sets.map((set, setIdx) => (
                                            <tr key={setIdx}>
                                                <td>{setIdx + 1}</td>
                                                <td>{set.reps || '-'}</td>
                                                <td>{set.weight || '-'}</td>
                                                <td>{set.restTime || '-'}</td>
                                                {exercise.sets.some(s => s.rpe) && <td>{set.rpe || '-'}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WorkoutDetail;