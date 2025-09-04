import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Save, X, Clock, Calendar, Dumbbell, Hash, Timer } from 'lucide-react';
import axios from 'axios';
import './Workouts.css';

function NewWorkout() {
    const navigate = useNavigate();
    const [workoutName, setWorkoutName] = useState('');
    const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [duration, setDuration] = useState('');
    const [exercises, setExercises] = useState([
        {
            name: '',
            category: '',
            sets: [{ reps: '', weight: '', restTime: '' }]
        }
    ]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const categories = [
        'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'other'
    ];

    const addExercise = () => {
        setExercises([
            ...exercises,
            {
                name: '',
                category: '',
                sets: [{ reps: '', weight: '', restTime: '' }]
            }
        ]);
    };

    const removeExercise = (index) => {
        if (exercises.length > 1) {
            const newExercises = exercises.filter((_, i) => i !== index);
            setExercises(newExercises);
        }
    };

    const updateExercise = (exerciseIndex, field, value) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex][field] = value;
        setExercises(newExercises);
    };

    const addSet = (exerciseIndex) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets.push({ reps: '', weight: '', restTime: '' });
        setExercises(newExercises);
    };

    const removeSet = (exerciseIndex, setIndex) => {
        const newExercises = [...exercises];
        if (newExercises[exerciseIndex].sets.length > 1) {
            newExercises[exerciseIndex].sets.splice(setIndex, 1);
            setExercises(newExercises);
        }
    };

    const updateSet = (exerciseIndex, setIndex, field, value) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex][field] = value;
        setExercises(newExercises);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!workoutName.trim()) {
            newErrors.workoutName = 'Workout name is required';
        }

        if (!workoutDate) {
            newErrors.workoutDate = 'Date is required';
        }

        // Validate at least one exercise with valid data
        const hasValidExercise = exercises.some(exercise => {
            if (!exercise.name.trim()) return false;
            return exercise.sets.some(set => set.reps || set.weight || set.duration);
        });

        if (!hasValidExercise) {
            newErrors.exercises = 'At least one exercise with valid sets is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        // Filter out empty exercises and sets
        const validExercises = exercises
            .filter(ex => ex.name.trim())
            .map(ex => ({
                ...ex,
                sets: ex.sets.filter(set => set.reps || set.weight || set.duration)
            }))
            .filter(ex => ex.sets.length > 0);

        const workoutData = {
            name: workoutName.trim(),
            date: new Date(workoutDate),
            exercises: validExercises,
            totalDuration: duration ? parseInt(duration) : undefined,
            notes: notes.trim()
        };

        try {
            const response = await axios.post('/workouts', workoutData);

            if (response.data.success) {
                navigate('/dashboard/workouts', {
                    state: { message: 'Workout created successfully!' }
                });
            }
        } catch (error) {
            console.error('Failed to create workout:', error);
            setErrors({
                general: error.response?.data?.error?.message || 'Failed to create workout'
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="new-workout-container">
            <div className="workout-header">
                <h2>Create New Workout</h2>
                <p className="workout-subtitle">Track your exercises and progress</p>
            </div>

            {errors.general && (
                <div className="error-banner">
                    <X size={20} />
                    <span>{errors.general}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="workout-form">
                {/* Workout Details */}
                <div className="workout-details-card">
                    <h3 className="section-title">Workout Details</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="workoutName">
                                <Dumbbell size={18} />
                                Workout Name
                            </label>
                            <input
                                type="text"
                                id="workoutName"
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                                placeholder="e.g., Monday Upper Body"
                                className={errors.workoutName ? 'error' : ''}
                            />
                            {errors.workoutName && (
                                <span className="error-text">{errors.workoutName}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="workoutDate">
                                <Calendar size={18} />
                                Date
                            </label>
                            <input
                                type="date"
                                id="workoutDate"
                                value={workoutDate}
                                onChange={(e) => setWorkoutDate(e.target.value)}
                                className={errors.workoutDate ? 'error' : ''}
                            />
                            {errors.workoutDate && (
                                <span className="error-text">{errors.workoutDate}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="duration">
                                <Clock size={18} />
                                Duration (minutes)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="45"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="notes">Notes (optional)</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How did you feel? Any observations?"
                            rows="3"
                        />
                    </div>
                </div>

                {/* Exercises */}
                <div className="exercises-section">
                    <div className="section-header">
                        <h3 className="section-title">Exercises</h3>
                        <button
                            type="button"
                            onClick={addExercise}
                            className="add-exercise-btn"
                        >
                            <Plus size={18} />
                            Add Exercise
                        </button>
                    </div>

                    {errors.exercises && (
                        <div className="error-text">{errors.exercises}</div>
                    )}

                    {exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="exercise-card">
                            <div className="exercise-header">
                                <h4>Exercise {exerciseIndex + 1}</h4>
                                {exercises.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeExercise(exerciseIndex)}
                                        className="remove-btn"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="exercise-details">
                                <div className="form-group">
                                    <label>Exercise Name</label>
                                    <input
                                        type="text"
                                        value={exercise.name}
                                        onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                                        placeholder="e.g., Bench Press"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={exercise.category}
                                        onChange={(e) => updateExercise(exerciseIndex, 'category', e.target.value)}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Sets */}
                            <div className="sets-section">
                                <div className="sets-header">
                                    <span>Sets</span>
                                    <button
                                        type="button"
                                        onClick={() => addSet(exerciseIndex)}
                                        className="add-set-btn"
                                    >
                                        <Plus size={16} />
                                        Add Set
                                    </button>
                                </div>

                                <div className="sets-table">
                                    <div className="sets-table-header">
                                        <span>Set</span>
                                        <span><Hash size={16} /> Reps</span>
                                        <span>Weight (kg)</span>
                                        <span><Timer size={16} /> Rest (sec)</span>
                                        <span></span>
                                    </div>

                                    {exercise.sets.map((set, setIndex) => (
                                        <div key={setIndex} className="set-row">
                                            <span className="set-number">{setIndex + 1}</span>
                                            <input
                                                type="number"
                                                value={set.reps}
                                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                                                placeholder="12"
                                                min="0"
                                            />
                                            <input
                                                type="number"
                                                value={set.weight}
                                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                                                placeholder="50"
                                                min="0"
                                                step="0.5"
                                            />
                                            <input
                                                type="number"
                                                value={set.restTime}
                                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'restTime', e.target.value)}
                                                placeholder="60"
                                                min="0"
                                            />
                                            {exercise.sets.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                                    className="remove-set-btn"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Buttons */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/workouts')}
                        className="cancel-btn"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="loading">Saving...</span>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Workout
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default NewWorkout;