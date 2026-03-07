import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const BudgetCharts = ({ budgets = [] }) => {
    const chartData = useMemo(() => {
        if (!Array.isArray(budgets) || budgets.length === 0) return null;

        // Group budgets by category
        const categoryGroups = budgets.reduce((groups, budget) => {
            const category = budget.categoryId?.name || 'Uncategorized';
            if (!groups[category]) {
                groups[category] = {
                    allocated: 0,
                    spent: 0
                };
            }
            groups[category].allocated += budget.amount || 0;
            groups[category].spent += budget.spent || 0;
            return groups;
        }, {});

        // Generate colors for each category
        const colors = Object.keys(categoryGroups).map((_, index) => {
            const hue = (index * 137.5) % 360; // Golden angle approximation
            return `hsl(${hue}, 70%, 50%)`;
        });

        // Prepare data for pie chart
        const pieData = {
            labels: Object.keys(categoryGroups),
            datasets: [
                {
                    data: Object.values(categoryGroups).map(g => g.allocated),
                    backgroundColor: colors,
                    borderColor: 'rgba(0,0,0,0)', // Transparent border
                    borderWidth: 0,
                    hoverOffset: 4
                }
            ]
        };

        // Prepare data for spending trend line chart
        const spendingData = {
            labels: Object.keys(categoryGroups),
            datasets: [
                {
                    label: 'Allocated',
                    data: Object.values(categoryGroups).map(g => g.allocated),
                    borderColor: '#10b981', // emerald-500
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Spent',
                    data: Object.values(categoryGroups).map(g => g.spent),
                    borderColor: '#f59e0b', // amber-500
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };

        return { pieData, spendingData };
    }, [budgets]);

    if (!Array.isArray(budgets)) {
        console.warn('BudgetCharts: budgets prop is not an array');
        return null;
    }

    if (budgets.length === 0 || !chartData) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground bg-white/5 rounded-xl border border-white/5">
                <p>No budget data available for visualization</p>
            </div>
        );
    }

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#9ca3af', // gray-400
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(value)} (${percentage}%)`;
                    }
                }
            }
        }
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#9ca3af', // gray-400
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                callbacks: {
                    label: (context) => {
                        return `${context.dataset.label}: ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(context.raw)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#9ca3af', // gray-400
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    callback: (value) => {
                        return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            notation: 'compact'
                        }).format(value);
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#9ca3af', // gray-400
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            }
        }
    };

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="grid grid-cols-1 gap-6">
                <div className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Budget Allocation</h3>
                    <div className="h-[250px]">
                        <Pie
                            data={chartData.pieData}
                            options={pieOptions}
                            aria-label="Budget allocation pie chart"
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-white/5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Spending Trends</h3>
                    <div className="h-[250px]">
                        <Line
                            data={chartData.spendingData}
                            options={lineOptions}
                            aria-label="Spending trends line chart"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default BudgetCharts;
