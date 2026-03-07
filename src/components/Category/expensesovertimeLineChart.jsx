import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faSpinner } from '@fortawesome/free-solid-svg-icons';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ExpensesOverTimeLineChart = ({ transactions = [], categories = [], loading = false }) => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (!loading && transactions.length > 0) {
            prepareChartData();
        }
    }, [transactions, loading]);

    const prepareChartData = () => {
        // Sort transactions by date
        const sortedTransactions = [...transactions].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        // Group transactions by month
        const monthlyExpenses = sortedTransactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!acc[monthKey]) {
                acc[monthKey] = 0;
            }
            acc[monthKey] += Math.abs(transaction.amount);
            return acc;
        }, {});

        // Format dates for display
        const formatMonth = (monthKey) => {
            const [year, month] = monthKey.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit'
            });
        };

        const data = {
            labels: Object.keys(monthlyExpenses).map(formatMonth),
            datasets: [{
                label: 'Total Expenses',
                data: Object.values(monthlyExpenses),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        };

        setChartData(data);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.raw || 0;
                        return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(value);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => {
                        return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };

    return (
        <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="chart-header">
                <h3>
                    <FontAwesomeIcon icon={faChartLine} />
                    Expenses Over Time
                </h3>
            </div>

            <div className="chart-content">
                {loading ? (
                    <div className="chart-loading">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <FontAwesomeIcon icon={faSpinner} />
                        </motion.div>
                        <p>Loading chart data...</p>
                    </div>
                ) : !chartData ? (
                    <div className="chart-empty">
                        <FontAwesomeIcon icon={faChartLine} />
                        <p>No expense data available</p>
                    </div>
                ) : (
                    <div className="line-chart-wrapper">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ExpensesOverTimeLineChart;
