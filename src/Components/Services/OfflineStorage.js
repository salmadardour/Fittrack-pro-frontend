class OfflineStorageService {
    constructor() {
        this.dbName = 'FitTrackOffline';
        this.dbVersion = 1;
        this.db = null;
    }

    // Initialize IndexedDB
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create stores for offline data
                if (!db.objectStoreNames.contains('pendingWorkouts')) {
                    const workoutStore = db.createObjectStore('pendingWorkouts', { keyPath: 'id' });
                    workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('pendingMeasurements')) {
                    const measurementStore = db.createObjectStore('pendingMeasurements', { keyPath: 'id' });
                    measurementStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('cachedWorkouts')) {
                    const cachedWorkoutStore = db.createObjectStore('cachedWorkouts', { keyPath: '_id' });
                    cachedWorkoutStore.createIndex('date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains('cachedMeasurements')) {
                    const cachedMeasurementStore = db.createObjectStore('cachedMeasurements', { keyPath: '_id' });
                    cachedMeasurementStore.createIndex('date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains('userPreferences')) {
                    db.createObjectStore('userPreferences', { keyPath: 'key' });
                }

                console.log('IndexedDB stores created successfully');
            };
        });
    }

    // Store workout data for offline sync
    async storePendingWorkout(workoutData, token) {
        await this.init();

        const pendingWorkout = {
            id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: workoutData,
            token: token,
            timestamp: Date.now(),
            type: 'workout'
        };

        return this.addToStore('pendingWorkouts', pendingWorkout);
    }

    // Store measurement data for offline sync
    async storePendingMeasurement(measurementData, token) {
        await this.init();

        const pendingMeasurement = {
            id: `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: measurementData,
            token: token,
            timestamp: Date.now(),
            type: 'measurement'
        };

        return this.addToStore('pendingMeasurements', pendingMeasurement);
    }

    // Cache workout data for offline viewing
    async cacheWorkouts(workouts) {
        await this.init();

        const transaction = this.db.transaction(['cachedWorkouts'], 'readwrite');
        const store = transaction.objectStore('cachedWorkouts');

        // Clear existing cached workouts
        await store.clear();

        // Add new workouts
        for (const workout of workouts) {
            await store.add(workout);
        }

        return transaction.complete;
    }

    // Cache measurement data for offline viewing
    async cacheMeasurements(measurements) {
        await this.init();

        const transaction = this.db.transaction(['cachedMeasurements'], 'readwrite');
        const store = transaction.objectStore('cachedMeasurements');

        // Clear existing cached measurements
        await store.clear();

        // Add new measurements
        for (const measurement of measurements) {
            await store.add(measurement);
        }

        return transaction.complete;
    }

    // Get cached workouts for offline viewing
    async getCachedWorkouts() {
        await this.init();
        return this.getAllFromStore('cachedWorkouts');
    }

    // Get cached measurements for offline viewing
    async getCachedMeasurements() {
        await this.init();
        return this.getAllFromStore('cachedMeasurements');
    }

    // Get pending workouts for sync
    async getPendingWorkouts() {
        await this.init();
        return this.getAllFromStore('pendingWorkouts');
    }

    // Get pending measurements for sync
    async getPendingMeasurements() {
        await this.init();
        return this.getAllFromStore('pendingMeasurements');
    }

    // Remove synced workout
    async removePendingWorkout(id) {
        await this.init();
        return this.removeFromStore('pendingWorkouts', id);
    }

    // Remove synced measurement
    async removePendingMeasurement(id) {
        await this.init();
        return this.removeFromStore('pendingMeasurements', id);
    }

    // Store user preferences
    async storeUserPreference(key, value) {
        await this.init();

        const preference = { key, value, timestamp: Date.now() };
        return this.addToStore('userPreferences', preference);
    }

    // Get user preference
    async getUserPreference(key) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['userPreferences'], 'readonly');
            const store = transaction.objectStore('userPreferences');
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to add data to a store
    async addToStore(storeName, data) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to get all data from a store
    async getAllFromStore(storeName) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to remove data from a store
    async removeFromStore(storeName, id) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Clear all offline data
    async clearAllData() {
        await this.init();

        const storeNames = ['pendingWorkouts', 'pendingMeasurements', 'cachedWorkouts', 'cachedMeasurements', 'userPreferences'];

        for (const storeName of storeNames) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.clear();
        }

        console.log('All offline data cleared');
    }

    // Get storage usage statistics
    async getStorageStats() {
        await this.init();

        const stats = {};
        const storeNames = ['pendingWorkouts', 'pendingMeasurements', 'cachedWorkouts', 'cachedMeasurements', 'userPreferences'];

        for (const storeName of storeNames) {
            const data = await this.getAllFromStore(storeName);
            stats[storeName] = {
                count: data.length,
                size: JSON.stringify(data).length
            };
        }

        return stats;
    }

    // Check if we have offline data
    async hasOfflineData() {
        const pendingWorkouts = await this.getPendingWorkouts();
        const pendingMeasurements = await this.getPendingMeasurements();

        return pendingWorkouts.length > 0 || pendingMeasurements.length > 0;
    }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageService();

// React Hook for offline storage
import { useEffect, useState } from 'react';

export const useOfflineStorage = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasOfflineData, setHasOfflineData] = useState(false);

    useEffect(() => {
        const initStorage = async () => {
            try {
                await offlineStorage.init();
                setIsInitialized(true);

                const hasData = await offlineStorage.hasOfflineData();
                setHasOfflineData(hasData);
            } catch (error) {
                console.error('Failed to initialize offline storage:', error);
            }
        };

        initStorage();
    }, []);

    const storePendingWorkout = async (workoutData, token) => {
        if (!isInitialized) return false;

        try {
            await offlineStorage.storePendingWorkout(workoutData, token);
            setHasOfflineData(true);
            return true;
        } catch (error) {
            console.error('Failed to store pending workout:', error);
            return false;
        }
    };

    const storePendingMeasurement = async (measurementData, token) => {
        if (!isInitialized) return false;

        try {
            await offlineStorage.storePendingMeasurement(measurementData, token);
            setHasOfflineData(true);
            return true;
        } catch (error) {
            console.error('Failed to store pending measurement:', error);
            return false;
        }
    };

    const syncOfflineData = async () => {
        if (!isInitialized || !hasOfflineData) return { success: true, synced: 0 };

        try {
            const pendingWorkouts = await offlineStorage.getPendingWorkouts();
            const pendingMeasurements = await offlineStorage.getPendingMeasurements();

            let syncedCount = 0;

            // Sync workouts
            for (const workout of pendingWorkouts) {
                try {
                    const response = await fetch('/api/v1/workouts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${workout.token}`
                        },
                        body: JSON.stringify(workout.data)
                    });

                    if (response.ok) {
                        await offlineStorage.removePendingWorkout(workout.id);
                        syncedCount++;
                    }
                } catch (error) {
                    console.error('Failed to sync workout:', error);
                }
            }

            // Sync measurements
            for (const measurement of pendingMeasurements) {
                try {
                    const response = await fetch('/api/v1/measurements', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${measurement.token}`
                        },
                        body: JSON.stringify(measurement.data)
                    });

                    if (response.ok) {
                        await offlineStorage.removePendingMeasurement(measurement.id);
                        syncedCount++;
                    }
                } catch (error) {
                    console.error('Failed to sync measurement:', error);
                }
            }

            const stillHasData = await offlineStorage.hasOfflineData();
            setHasOfflineData(stillHasData);

            return { success: true, synced: syncedCount };
        } catch (error) {
            console.error('Failed to sync offline data:', error);
            return { success: false, error: error.message };
        }
    };

    return {
        isInitialized,
        hasOfflineData,
        storePendingWorkout,
        storePendingMeasurement,
        syncOfflineData,
        offlineStorage
    };
};

export default offlineStorage;