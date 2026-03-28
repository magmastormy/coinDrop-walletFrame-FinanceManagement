import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const BudgetPerformanceChart = ({ budget }) => {
    if (!budget) return null;

    // Since we're now passing a single budget object, we'll wrap it in an array or handle it directly.
    // The previous code expected an array `performanceData`.
    // Let's adapt it to visualize the single budget's performance or accept an array if that was the intent.
    // Based on usage in BudgetAnalytics, it passes `budget={budget}`.

    const data = {
        labels: ['Budget vs Spent'],
        datasets: [
            {
                label: 'Budget Amount',
                data: [budget.amount],
                backgroundColor: 'rgba(16, 185, 129, 0.5)', // emerald-500 with opacity
                borderColor: '#10b981',
                borderWidth: 1,
                borderRadius: 4,
            },
            {
                label: 'Total Spent',
                data: [budget.spent || 0],
                backgroundColor: 'rgba(239, 68, 68, 0.5)', // red-500 with opacity
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            title: {
                display: false,
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
                    color: '#9ca3af',
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
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            }
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Performance Overview</h3>
            <div className="h-[250px]">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default BudgetPerformanceChart;
