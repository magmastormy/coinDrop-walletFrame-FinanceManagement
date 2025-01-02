// src/components/Budget/budgetCharts.jsx
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
import './styles/budgetChartsStyles.css';

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
                    borderColor: colors.map(color => color.replace('50%', '40%')),
                    borderWidth: 2,
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
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Spent',
                    data: Object.values(categoryGroups).map(g => g.spent),
                    borderColor: 'var(--accent-2)',
                    backgroundColor: 'rgba(var(--accent-2-rgb), 0.1)',
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
            <div className="charts-empty-state">
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
                    font: {
                        family: 'var(--font-primary)',
                        size: 12
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: 'var(--dark)',
                bodyColor: 'var(--text-secondary)',
                borderColor: 'var(--border)',
                borderWidth: 1,
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
                    font: {
                        family: 'var(--font-primary)',
                        size: 12
                    },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: 'var(--dark)',
                bodyColor: 'var(--text-secondary)',
                borderColor: 'var(--border)',
                borderWidth: 1,
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
                    color: 'var(--border)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: 'var(--font-primary)',
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
                    font: {
                        family: 'var(--font-primary)',
                        size: 12
                    }
                }
            }
        }
    };

    return (
        <motion.div 
            className="budget-charts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>Budget Allocation by Category</h3>
                    <div className="pie-chart-wrapper">
                        <Pie 
                            data={chartData.pieData} 
                            options={pieOptions}
                            aria-label="Budget allocation pie chart"
                        />
                    </div>
                </div>
                <div className="chart-container">
                    <h3>Spending Trends by Category</h3>
                    <div className="line-chart-wrapper">
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