import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Scale, Ruler, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../App';
import axios from 'axios';
import './Measurements.css';

function Measurements() {
    const { user } = useAuth();
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeTab, setActiveTab] = useState('weight');
    const [formData, setFormData] = useState({
        weight: '',
        bodyFat: '',
        chest: '',
        waist: '',
        hips: '',
        biceps: '',
        thighs: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchMeasurements();
    }, []);

    const fetchMeasurements = async () => {
        try {
            const response = await axios.get('/measurements');
            if (response.data.success) {
                setMeasurements(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch measurements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const measurementData = {
                ...formData,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
                chest: formData.chest ? parseFloat(formData.chest) : null,
                waist: formData.waist ? parseFloat(formData.waist) : null,
                hips: formData.hips ? parseFloat(formData.hips) : null,
                biceps: formData.biceps ? parseFloat(formData.biceps) : null,
                thighs: formData.thighs ? parseFloat(formData.thighs) : null,
                date: new Date(formData.date)
            };

            const response = await axios.post('/measurements', measurementData);
            if (response.data.success) {
                setMeasurements([response.data.data, ...measurements]);
                setFormData({
                    weight: '',
                    bodyFat: '',
                    chest: '',
                    waist: '',
                    hips: '',
                    biceps: '',
                    thighs: '',
                    notes: '',
                    date: new Date().toISOString().split('T')[0]
                });
                setShowAddForm(false);
            }
        } catch (error) {
            console.error('Failed to save measurement:', error);
        }
    };

    const getChartData = (field) => {
        return measurements
            .filter(m => m[field] !== null && m[field] !== undefined)
            .map(m => ({
                date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: m[field],
                fullDate: m.date
            }))
            .reverse();
    };

    const calculateTrend = (field) => {
        const data = getChartData(field);
        if (data.length < 2) return null;

        const latest = data[data.length - 1].value;
        const previous = data[data.length - 2].value;
        const change = latest - previous;

        return {
            change: change.toFixed(1),
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
    };

    const getLatestValue = (field) => {
        const latest = measurements.find(m => m[field] !== null && m[field] !== undefined);
        return latest ? latest[field] : null;
    };

    const units = user?.units === 'imperial' ?
        { weight: 'lbs', length: 'in' } :
        { weight: 'kg', length: 'cm' };

    const measurementTypes = [
        { key: 'weight', label: 'Weight', icon: Scale, unit: units.weight },
        { key: 'bodyFat', label: 'Body Fat %', icon: TrendingUp, unit: '%' },
        { key: 'chest', label: 'Chest', icon: Ruler, unit: units.length },
        { key: 'waist', label: 'Waist', icon: Ruler, unit: units.length },
        { key: 'hips', label: 'Hips', icon: Ruler, unit: units.length },
        { key: 'biceps', label: 'Biceps', icon: Ruler, unit: units.length },
        { key: 'thighs', label: 'Thighs', icon: Ruler, unit: units.length }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading measurements...</p>
            </div>
        );
    }

    return (
        <div className="measurements-container">
            <div className="measurements-header">
                <h2>Body Measurements</h2>
                <button
                    className="add-measurement-btn"
                    onClick={() => setShowAddForm(true)}
                >
                    <Plus size={20} />
                    Add Measurement
                </button>
            </div>

            {/* Overview Cards */}
            <div className="measurements-overview">
                {measurementTypes.map(type => {
                    const latest = getLatestValue(type.key);
                    const trend = calculateTrend(type.key);

                    return (
                        <div key={type.key} className="measurement-card">
                            <div className="measurement-icon">
                                <type.icon size={24} />
                            </div>
                            <div className="measurement-content">
                                <h3>{type.label}</h3>
                                <div className="measurement-value">
                                    {latest ? `${latest} ${type.unit}` : 'No data'}
                                </div>
                                {trend && (
                                    <div className={`measurement-trend ${trend.direction}`}>
                                        {trend.direction === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        <span>{trend.change > 0 ? '+' : ''}{trend.change} {type.unit}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart Tabs */}
            <div className="chart-section">
                <div className="chart-tabs">
                    {measurementTypes.map(type => (
                        <button
                            key={type.key}
                            className={`chart-tab ${activeTab === type.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(type.key)}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getChartData(activeTab)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd4" />
                            <XAxis dataKey="date" stroke="#6b5b4f" />
                            <YAxis stroke="#6b5b4f" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid #e8ddd4',
                                    borderRadius: '8px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#a0927d"
                                strokeWidth={3}
                                dot={{ fill: '#8b7d6b', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Add Measurement Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Measurement</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowAddForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="measurement-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <div className="input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Weight ({units.weight})</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        placeholder="Enter weight"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Body Fat (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.bodyFat}
                                        onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                                        placeholder="Enter body fat %"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Chest ({units.length})</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.chest}
                                        onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                                        placeholder="Enter chest measurement"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Waist ({units.length})</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.waist}
                                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                                        placeholder="Enter waist measurement"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Hips ({units.length})</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.hips}
                                        onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                                        placeholder="Enter hips measurement"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Biceps ({units.length})</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.biceps}
                                        onChange={(e) => setFormData({ ...formData, biceps: e.target.value })}
                                        placeholder="Enter biceps measurement"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Thighs ({units.length})</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.thighs}
                                        onChange={(e) => setFormData({ ...formData, thighs: e.target.value })}
                                        placeholder="Enter thighs measurement"
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Notes (optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any notes about this measurement..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Save Measurement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Measurements;