import React from 'react';
import { Activity, TrendingUp, Target, Calendar } from 'lucide-react';

function DashboardHome({ stats, loading }) {
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-home">
            <div className="welcome-section">
                <h2>Your Fitness Overview</h2>
                <p>Track your progress and stay motivated on your fitness journey.</p>
            </div>

            <div className="quick-stats-grid">
                <div className="quick-stat-card">
                    <div className="quick-stat-header">
                        <Activity size={24} />
                        <span>Recent Activity</span>
                    </div>
                    <p className="quick-stat-value">{stats.recentWorkouts} workouts this month</p>
                </div>

                <div className="quick-stat-card">
                    <div className="quick-stat-header">
                        <TrendingUp size={24} />
                        <span>Progress</span>
                    </div>
                    <p className="quick-stat-value">You're on a great track!</p>
                </div>

                <div className="quick-stat-card">
                    <div className="quick-stat-header">
                        <Target size={24} />
                        <span>Goals</span>
                    </div>
                    <p className="quick-stat-value">Set your fitness goals</p>
                </div>

                <div className="quick-stat-card">
                    <div className="quick-stat-header">
                        <Calendar size={24} />
                        <span>Consistency</span>
                    </div>
                    <p className="quick-stat-value">Build your streak</p>
                </div>
            </div>
        </div>
    );
}

export default DashboardHome;