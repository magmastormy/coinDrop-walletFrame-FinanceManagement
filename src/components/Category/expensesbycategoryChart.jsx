import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './styles/chartStyles.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpensesByCategoryChart = ({ transactions = [], categories = [], loading = false }) => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (!loading && transactions.length > 0 && categories.length > 0) {
            prepareChartData();
        }
    }, [transactions, categories, loading]);

    const prepareChartData = () => {
        // Group transactions by category
        const expensesByCategory = transactions.reduce((acc, transaction) => {
            const category = categories.find(c => c._id === transaction.categoryId);
            if (category) {
                acc[category.name] = (acc[category.name] || 0) + Math.abs(transaction.amount);
            }
            return acc;
        }, {});

        // Sort categories by amount
        const sortedCategories = Object.entries(expensesByCategory)
            .sort(([, a], [, b]) => b - a);

        // Generate colors using HSL for better distribution
        const generateColor = (index, total) => {
            const hue = (index * (360 / total)) % 360;
            return `hsl(${hue}, 70%, 50%)`;
        };

        const data = {
            labels: sortedCategories.map(([category]) => category),
            datasets: [{
                data: sortedCategories.map(([, amount]) => amount),
                backgroundColor: sortedCategories.map((_, index) => 
                    generateColor(index, sortedCategories.length)
                ),
                borderColor: 'white',
                borderWidth: 2,
            }]
        };

        setChartData(data);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const formattedValue = new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(value);
                        return `${label}: ${formattedValue}`;
                    }
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
                    <FontAwesomeIcon icon={faChartPie} />
                    Expenses by Category
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
                        <FontAwesomeIcon icon={faChartPie} />
                        <p>No expense data available</p>
                    </div>
                ) : (
                    <div className="pie-chart-wrapper">
                        <Pie data={chartData} options={chartOptions} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ExpensesByCategoryChart;