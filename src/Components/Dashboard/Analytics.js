import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Activity, Target } from 'lucide-react';
import axios from 'axios';
import './Analytics.css';

function Analytics() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

  useEffect(() => {
    fetchWorkouts();
  }, []);

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

  // Process data for volume over time chart
  const getVolumeOverTime = () => {
    const data = {};
    const now = new Date();
    const range = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    
    // Initialize dates
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      data[key] = { date: key, volume: 0, workouts: 0 };
    }

    // Add workout data
    workouts.forEach(workout => {
      const workoutDate = new Date(workout.date);
      const daysDiff = Math.floor((now - workoutDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < range && daysDiff >= 0) {
        const key = workoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (data[key]) {
          data[key].volume += workout.totalVolume || 0;
          data[key].workouts += 1;
        }
      }
    });

    return Object.values(data);
  };

  // Process data for exercises by category
  const getExercisesByCategory = () => {
    const categories = {};
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const category = exercise.category || 'other';
        categories[category] = (categories[category] || 0) + 1;
      });
    });

    return Object.entries(categories).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count
    }));
  };

  // Process data for workout frequency by day
  const getWorkoutFrequencyByDay = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const frequency = days.map(day => ({ day, count: 0 }));
    
    workouts.forEach(workout => {
      const dayIndex = new Date(workout.date).getDay();
      frequency[dayIndex].count += 1;
    });

    return frequency;
  };

  // Calculate progress metrics
  const getProgressMetrics = () => {
    const now = new Date();
    const thisMonth = workouts.filter(w => {
      const date = new Date(w.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const lastMonth = workouts.filter(w => {
      const date = new Date(w.date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    });

    const thisMonthVolume = thisMonth.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const lastMonthVolume = lastMonth.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    
    const volumeChange = lastMonthVolume > 0 
      ? ((thisMonthVolume - lastMonthVolume) / lastMonthVolume * 100).toFixed(1)
      : 0;

    const avgDuration = workouts.length > 0
      ? Math.round(workouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0) / workouts.length)
      : 0;

    return {
      totalWorkouts: workouts.length,
      thisMonthCount: thisMonth.length,
      volumeChange,
      avgDuration,
      totalVolume: Math.round(workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0) / 1000)
    };
  };

  // Get personal records
  const getPersonalRecords = () => {
    const records = {};
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!records[exercise.name]) {
          records[exercise.name] = { name: exercise.name, maxWeight: 0, maxReps: 0 };
        }
        
        exercise.sets.forEach(set => {
          if (set.weight > records[exercise.name].maxWeight) {
            records[exercise.name].maxWeight = set.weight;
          }
          if (set.reps > records[exercise.name].maxReps) {
            records[exercise.name].maxReps = set.reps;
          }
        });
      });
    });

    return Object.values(records).slice(0, 5); // Top 5 exercises
  };

  const COLORS = ['#a0927d', '#8b7d6b', '#d4c4b0', '#6b5b4f', '#e8ddd4'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const metrics = getProgressMetrics();
  const volumeData = getVolumeOverTime();
  const categoryData = getExercisesByCategory();
  const frequencyData = getWorkoutFrequencyByDay();
  const personalRecords = getPersonalRecords();

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <div className="time-range-selector">
          <button
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            className={timeRange === 'year' ? 'active' : ''}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.totalWorkouts}</span>
            <span className="metric-label">Total Workouts</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Calendar size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.thisMonthCount}</span>
            <span className="metric-label">This Month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">
              {metrics.volumeChange > 0 ? '+' : ''}{metrics.volumeChange}%
            </span>
            <span className="metric-label">Volume Change</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.totalVolume}k kg</span>
            <span className="metric-label">Total Volume</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Volume Over Time */}
        <div className="chart-card">
          <h3>Volume Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={volumeData}>
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
                dataKey="volume" 
                stroke="#a0927d" 
                strokeWidth={2}
                dot={{ fill: '#8b7d6b', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Workout Frequency by Day */}
        <div className="chart-card">
          <h3>Workout Frequency by Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={frequencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd4" />
              <XAxis dataKey="day" stroke="#6b5b4f" />
              <YAxis stroke="#6b5b4f" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e8ddd4',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="count" fill="#a0927d">
                {frequencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Exercises by Category */}
        <div className="chart-card">
          <h3>Exercises by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, value}) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Personal Records */}
        <div className="chart-card">
          <h3>Personal Records</h3>
          <div className="records-list">
            {personalRecords.length > 0 ? (
              personalRecords.map((record, index) => (
                <div key={index} className="record-item">
                  <span className="record-name">{record.name}</span>
                  <div className="record-stats">
                    <span className="record-stat">
                      <strong>{record.maxWeight}</strong> kg
                    </span>
                    <span className="record-stat">
                      <strong>{record.maxReps}</strong> reps
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-records">No personal records yet. Keep working out!</p>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h3>Insights & Recommendations</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Most Active Day</h4>
            <p>{frequencyData.reduce((max, day) => day.count > max.count ? day : max, frequencyData[0]).day}</p>
          </div>
          <div className="insight-card">
            <h4>Average Duration</h4>
            <p>{metrics.avgDuration} minutes</p>
          </div>
          <div className="insight-card">
            <h4>Workout Streak</h4>
            <p>Keep it up!</p>
          </div>
          <div className="insight-card">
            <h4>Focus Area</h4>
            <p>{categoryData.length > 0 ? categoryData[0].name : 'Mixed'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;