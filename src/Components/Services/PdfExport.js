// PdfExport.js - Fixed Version
// Note: This requires installing jsPDF first: npm install jspdf jspdf-autotable

// Conditional import to prevent errors if jsPDF is not installed
let jsPDF;
try {
    jsPDF = require('jspdf').jsPDF;
    require('jspdf-autotable');
} catch (error) {
    console.warn('jsPDF not installed. PDF export functionality will be disabled.');
    console.warn('Install with: npm install jspdf jspdf-autotable');
}

class PdfExportService {
    constructor() {
        this.primaryColor = [160, 146, 125];
        this.secondaryColor = [139, 125, 107];
        this.textColor = [74, 63, 53];
        this.lightColor = [232, 221, 212];
        this.isAvailable = !!jsPDF;
    }

    // Check if PDF export is available
    isEnabled() {
        return this.isAvailable;
    }

    // Export workout report
    async exportWorkoutReport(workouts, user, dateRange) {
        if (!this.isAvailable) {
            throw new Error('PDF export is not available. Please install jsPDF: npm install jspdf jspdf-autotable');
        }

        const doc = new jsPDF();

        // Add header
        this.addHeader(doc, 'Workout Report', user);

        // Add date range
        doc.setFontSize(12);
        doc.setTextColor(...this.textColor);
        doc.text(`Report Period: ${dateRange.start} - ${dateRange.end}`, 20, 40);

        // Add summary statistics
        const stats = this.calculateWorkoutStats(workouts);
        this.addSummarySection(doc, stats, 50);

        // Add workout list
        this.addWorkoutTable(doc, workouts, 100);

        // Add exercise breakdown
        const exerciseStats = this.calculateExerciseStats(workouts);
        this.addExerciseBreakdown(doc, exerciseStats);

        // Add footer
        this.addFooter(doc);

        return doc;
    }

    // Export progress report
    async exportProgressReport(measurements, workouts, user, dateRange) {
        if (!this.isAvailable) {
            throw new Error('PDF export is not available. Please install jsPDF: npm install jspdf jspdf-autotable');
        }

        const doc = new jsPDF();

        // Add header
        this.addHeader(doc, 'Progress Report', user);

        // Add date range
        doc.setFontSize(12);
        doc.setTextColor(...this.textColor);
        doc.text(`Report Period: ${dateRange.start} - ${dateRange.end}`, 20, 40);

        // Add measurements summary
        if (measurements.length > 0) {
            this.addMeasurementsSection(doc, measurements, 50);
        }

        // Add workout summary
        if (workouts.length > 0) {
            const workoutStats = this.calculateWorkoutStats(workouts);
            this.addProgressSummary(doc, workoutStats, measurements.length > 0 ? 150 : 50);
        }

        // Add recommendations
        this.addRecommendations(doc, measurements, workouts);

        // Add footer
        this.addFooter(doc);

        return doc;
    }

    // Add document header
    addHeader(doc, title, user) {
        // Logo/Brand area
        doc.setFillColor(...this.primaryColor);
        doc.rect(20, 15, 170, 15, 'F');

        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('FitTrack Pro', 25, 25);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(title, 120, 25);

        // User info
        doc.setFontSize(10);
        doc.setTextColor(...this.textColor);
        doc.text(`Generated for: ${user.firstName} ${user.lastName}`, 20, 35);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 35);
    }

    // Add summary statistics section
    addSummarySection(doc, stats, yPosition) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.textColor);
        doc.text('Summary Statistics', 20, yPosition);

        const summaryData = [
            ['Total Workouts', stats.totalWorkouts.toString()],
            ['Total Volume', `${stats.totalVolume.toLocaleString()} kg`],
            ['Average Duration', `${stats.averageDuration} minutes`],
            ['Most Active Day', stats.mostActiveDay],
            ['Total Exercises', stats.totalExercises.toString()],
            ['Average Volume per Workout', `${stats.averageVolumePerWorkout} kg`]
        ];

        doc.autoTable({
            startY: yPosition + 5,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: {
                fillColor: this.primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: this.textColor
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { cellWidth: 60 }
            },
            margin: { left: 20, right: 20 }
        });
    }

    // Add workout table
    addWorkoutTable(doc, workouts, yPosition) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.textColor);
        doc.text('Workout Details', 20, yPosition);

        const workoutData = workouts.map(workout => [
            new Date(workout.date).toLocaleDateString(),
            workout.name,
            workout.exercises.length.toString(),
            workout.totalDuration ? `${workout.totalDuration} min` : 'N/A',
            `${this.calculateWorkoutVolume(workout)} kg`
        ]);

        doc.autoTable({
            startY: yPosition + 5,
            head: [['Date', 'Workout Name', 'Exercises', 'Duration', 'Volume']],
            body: workoutData,
            theme: 'grid',
            headStyles: {
                fillColor: this.primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: this.textColor,
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 60 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 30 }
            },
            margin: { left: 20, right: 20 }
        });
    }

    // Add exercise breakdown
    addExerciseBreakdown(doc, exerciseStats) {
        // Start new page if needed
        if (doc.lastAutoTable.finalY > 200) {
            doc.addPage();
            var yPos = 20;
        } else {
            var yPos = doc.lastAutoTable.finalY + 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.textColor);
        doc.text('Exercise Breakdown', 20, yPos);

        const exerciseData = Object.entries(exerciseStats)
            .sort(([, a], [, b]) => b.totalVolume - a.totalVolume)
            .slice(0, 10) // Top 10 exercises
            .map(([name, stats]) => [
                name,
                stats.totalSets.toString(),
                `${stats.totalVolume} kg`,
                `${stats.averageWeight} kg`,
                stats.maxWeight ? `${stats.maxWeight} kg` : 'N/A'
            ]);

        doc.autoTable({
            startY: yPos + 5,
            head: [['Exercise', 'Sets', 'Total Volume', 'Avg Weight', 'Max Weight']],
            body: exerciseData,
            theme: 'grid',
            headStyles: {
                fillColor: this.secondaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: this.textColor,
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 20 },
                2: { cellWidth: 35 },
                3: { cellWidth: 35 },
                4: { cellWidth: 30 }
            },
            margin: { left: 20, right: 20 }
        });
    }

    // Add measurements section
    addMeasurementsSection(doc, measurements, yPosition) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.textColor);
        doc.text('Body Measurements Progress', 20, yPosition);

        const latest = measurements[0];
        const oldest = measurements[measurements.length - 1];

        const progressData = [];

        const fields = ['weight', 'bodyFat', 'chest', 'waist', 'hips', 'biceps', 'thighs'];
        const labels = ['Weight', 'Body Fat %', 'Chest', 'Waist', 'Hips', 'Biceps', 'Thighs'];

        fields.forEach((field, index) => {
            if (latest[field] !== null && oldest[field] !== null) {
                const change = latest[field] - oldest[field];
                const changeStr = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);

                progressData.push([
                    labels[index],
                    oldest[field].toFixed(1),
                    latest[field].toFixed(1),
                    changeStr
                ]);
            }
        });

        if (progressData.length > 0) {
            doc.autoTable({
                startY: yPosition + 5,
                head: [['Measurement', 'Starting', 'Current', 'Change']],
                body: progressData,
                theme: 'grid',
                headStyles: {
                    fillColor: this.primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    textColor: this.textColor
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 30 }
                },
                margin: { left: 20, right: 20 }
            });
        }
    }

    // Add progress summary
    addProgressSummary(doc, workoutStats, yPosition) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.textColor);
        doc.text('Workout Progress', 20, yPosition);

        const progressData = [
            ['Total Workouts Completed', workoutStats.totalWorkouts.toString()],
            ['Consistency Rate', `${workoutStats.consistencyRate}%`],
            ['Volume Progression', workoutStats.volumeProgression],
            ['Strength Gains', workoutStats.strengthGains]
        ];

        doc.autoTable({
            startY: yPosition + 5,
            head: [['Progress Metric', 'Achievement']],
            body: progressData,
            theme: 'grid',
            headStyles: {
                fillColor: this.secondaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: this.textColor
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { cellWidth: 60 }
            },
            margin: { left: 20, right: 20 }
        });
    }

    // Add recommendations section
    addRecommendations(doc, measurements, workouts) {
        // Start new page if needed
        if (doc.lastAutoTable.finalY > 220) {
            doc.addPage();
            var yPos = 20;
        } else {
            var yPos = doc.lastAutoTable.finalY + 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.textColor);
        doc.text('Recommendations', 20, yPos);

        const recommendations = this.generateRecommendations(measurements, workouts);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        let currentY = yPos + 10;
        recommendations.forEach((rec, index) => {
            doc.text(`${index + 1}. ${rec}`, 25, currentY);
            currentY += 8;
        });
    }

    // Add footer
    addFooter(doc) {
        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Generated by FitTrack Pro - Page ${i} of ${pageCount}`, 20, 285);
            doc.text(`Report generated on ${new Date().toLocaleString()}`, 150, 285);

            // Add line above footer
            doc.setDrawColor(...this.lightColor);
            doc.line(20, 280, 190, 280);
        }
    }

    // Calculate workout statistics
    calculateWorkoutStats(workouts) {
        const totalWorkouts = workouts.length;
        const totalVolume = workouts.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0);
        const totalDuration = workouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0);
        const averageDuration = totalDuration / totalWorkouts || 0;
        const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
        const averageVolumePerWorkout = totalVolume / totalWorkouts || 0;

        // Calculate most active day
        const dayCount = {};
        workouts.forEach(w => {
            const day = new Date(w.date).toLocaleDateString('en-US', { weekday: 'long' });
            dayCount[day] = (dayCount[day] || 0) + 1;
        });
        const mostActiveDay = Object.keys(dayCount).reduce((a, b) =>
            dayCount[a] > dayCount[b] ? a : b, 'N/A'
        );

        // Calculate consistency rate (workouts per week)
        const weeks = Math.ceil(workouts.length / 7) || 1;
        const consistencyRate = Math.round((totalWorkouts / weeks) * 100 / 3); // Assuming 3 workouts/week target

        return {
            totalWorkouts: Math.round(totalWorkouts),
            totalVolume: Math.round(totalVolume),
            averageDuration: Math.round(averageDuration),
            totalExercises,
            averageVolumePerWorkout: Math.round(averageVolumePerWorkout),
            mostActiveDay,
            consistencyRate: Math.min(consistencyRate, 100),
            volumeProgression: this.calculateVolumeProgression(workouts),
            strengthGains: this.calculateStrengthGains(workouts)
        };
    }

    // Calculate exercise statistics
    calculateExerciseStats(workouts) {
        const exerciseStats = {};

        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                if (!exerciseStats[exercise.name]) {
                    exerciseStats[exercise.name] = {
                        totalSets: 0,
                        totalVolume: 0,
                        totalReps: 0,
                        maxWeight: 0,
                        weights: []
                    };
                }

                const stats = exerciseStats[exercise.name];
                stats.totalSets += exercise.sets.length;

                exercise.sets.forEach(set => {
                    if (set.weight && set.reps) {
                        const volume = parseFloat(set.weight) * parseInt(set.reps);
                        stats.totalVolume += volume;
                        stats.totalReps += parseInt(set.reps);
                        stats.weights.push(parseFloat(set.weight));
                        stats.maxWeight = Math.max(stats.maxWeight, parseFloat(set.weight));
                    }
                });

                stats.averageWeight = stats.weights.length > 0
                    ? Math.round(stats.weights.reduce((a, b) => a + b, 0) / stats.weights.length)
                    : 0;
            });
        });

        return exerciseStats;
    }

    // Calculate workout volume
    calculateWorkoutVolume(workout) {
        return workout.exercises.reduce((total, exercise) => {
            return total + exercise.sets.reduce((setTotal, set) => {
                if (set.weight && set.reps) {
                    return setTotal + (parseFloat(set.weight) * parseInt(set.reps));
                }
                return setTotal;
            }, 0);
        }, 0);
    }

    // Calculate volume progression
    calculateVolumeProgression(workouts) {
        if (workouts.length < 2) return 'Insufficient data';

        const sortedWorkouts = workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstHalf = sortedWorkouts.slice(0, Math.floor(sortedWorkouts.length / 2));
        const secondHalf = sortedWorkouts.slice(Math.floor(sortedWorkouts.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0) / secondHalf.length;

        const improvement = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100).toFixed(1);
        return `${improvement > 0 ? '+' : ''}${improvement}%`;
    }

    // Calculate strength gains
    calculateStrengthGains(workouts) {
        if (workouts.length < 2) return 'Insufficient data';

        // Track strength progression for main compound movements
        const compoundMovements = ['bench press', 'squat', 'deadlift', 'overhead press'];
        let strengthGains = 0;
        let movementsTracked = 0;

        compoundMovements.forEach(movement => {
            const exerciseData = [];

            workouts.forEach(workout => {
                workout.exercises.forEach(exercise => {
                    if (exercise.name.toLowerCase().includes(movement)) {
                        const maxWeight = Math.max(...exercise.sets.map(set => parseFloat(set.weight) || 0));
                        if (maxWeight > 0) {
                            exerciseData.push({ date: workout.date, weight: maxWeight });
                        }
                    }
                });
            });

            if (exerciseData.length >= 2) {
                exerciseData.sort((a, b) => new Date(a.date) - new Date(b.date));
                const firstWeight = exerciseData[0].weight;
                const lastWeight = exerciseData[exerciseData.length - 1].weight;
                const gain = ((lastWeight - firstWeight) / firstWeight) * 100;
                strengthGains += gain;
                movementsTracked++;
            }
        });

        return movementsTracked > 0
            ? `+${(strengthGains / movementsTracked).toFixed(1)}% avg`
            : 'No compound movements tracked';
    }

    // Generate recommendations
    generateRecommendations(measurements, workouts) {
        const recommendations = [];

        // Workout frequency recommendations
        if (workouts.length > 0) {
            const avgWorkoutsPerWeek = workouts.length / Math.max(1, Math.ceil(workouts.length / 7));

            if (avgWorkoutsPerWeek < 3) {
                recommendations.push('Consider increasing workout frequency to 3-4 times per week for optimal results.');
            } else if (avgWorkoutsPerWeek > 6) {
                recommendations.push('Ensure adequate rest days between workouts to prevent overtraining and allow recovery.');
            }
        }

        // Volume progression recommendations
        const recentWorkouts = workouts.slice(0, 5);
        const olderWorkouts = workouts.slice(-5);

        if (recentWorkouts.length > 0 && olderWorkouts.length > 0) {
            const recentAvgVolume = recentWorkouts.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0) / recentWorkouts.length;
            const olderAvgVolume = olderWorkouts.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0) / olderWorkouts.length;

            if (recentAvgVolume <= olderAvgVolume) {
                recommendations.push('Consider progressive overload by gradually increasing weight, reps, or sets to continue making progress.');
            }
        }

        // Measurement-based recommendations
        if (measurements.length >= 2) {
            const latest = measurements[0];
            const previous = measurements[1];

            if (latest.weight && previous.weight) {
                const weightChange = latest.weight - previous.weight;

                if (Math.abs(weightChange) < 0.5) {
                    recommendations.push('Weight has remained stable. Consider adjusting nutrition if body composition changes are desired.');
                } else if (weightChange > 2) {
                    recommendations.push('Rapid weight gain detected. Monitor nutrition and consider consulting a healthcare professional.');
                } else if (weightChange < -2) {
                    recommendations.push('Rapid weight loss detected. Ensure adequate nutrition to support your training goals.');
                }
            }
        }

        // Exercise variety recommendations
        if (workouts.length > 0) {
            const allExercises = new Set();
            workouts.forEach(w => w.exercises.forEach(e => allExercises.add(e.name.toLowerCase())));

            if (allExercises.size < 10) {
                recommendations.push('Consider adding more exercise variety to target different muscle groups and movement patterns.');
            }
        }

        // Recovery recommendations
        recommendations.push('Prioritize sleep (7-9 hours) and proper hydration for optimal recovery and performance.');
        recommendations.push('Consider tracking subjective measures like energy levels and sleep quality alongside physical metrics.');

        // Safety reminder
        recommendations.push('Always warm up properly and focus on correct form over heavy weights to prevent injury.');

        return recommendations.slice(0, 6); // Limit to 6 recommendations
    }

    // Download PDF file
    downloadPdf(doc, filename) {
        if (!this.isAvailable) {
            alert('PDF export is not available. Please install jsPDF: npm install jspdf jspdf-autotable');
            return;
        }
        doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // Get PDF as blob for sharing
    getPdfBlob(doc) {
        if (!this.isAvailable) {
            throw new Error('PDF export is not available');
        }
        return doc.output('blob');
    }
}

// Create singleton instance
export const pdfExportService = new PdfExportService();

// Export utility functions with error handling
export const exportWorkoutReport = async (workouts, user, startDate, endDate) => {
    if (!pdfExportService.isEnabled()) {
        alert('PDF export is not available. Please install jsPDF with: npm install jspdf jspdf-autotable');
        return;
    }

    try {
        const dateRange = {
            start: new Date(startDate).toLocaleDateString(),
            end: new Date(endDate).toLocaleDateString()
        };

        const doc = await pdfExportService.exportWorkoutReport(workouts, user, dateRange);
        pdfExportService.downloadPdf(doc, 'fittrack_workout_report');
    } catch (error) {
        console.error('Failed to export workout report:', error);
        alert('Failed to generate PDF report. Make sure jsPDF is installed.');
    }
};

export const exportProgressReport = async (measurements, workouts, user, startDate, endDate) => {
    if (!pdfExportService.isEnabled()) {
        alert('PDF export is not available. Please install jsPDF with: npm install jspdf jspdf-autotable');
        return;
    }

    try {
        const dateRange = {
            start: new Date(startDate).toLocaleDateString(),
            end: new Date(endDate).toLocaleDateString()
        };

        const doc = await pdfExportService.exportProgressReport(measurements, workouts, user, dateRange);
        pdfExportService.downloadPdf(doc, 'fittrack_progress_report');
    } catch (error) {
        console.error('Failed to export progress report:', error);
        alert('Failed to generate PDF report. Make sure jsPDF is installed.');
    }
};

export default pdfExportService;