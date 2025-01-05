import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEllipsisVertical, 
    faDownload,
    faRotate,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js/auto';
import { getUserTransactions } from '../../services/transactionService';
import { getBudgetStats } from '../../services/budgetService';
import './styles/dashboardBarChartStyles.css';

const DashboardBarChart = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);
    const [budgetData, setBudgetData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user && user.id) {
                try {
                    setLoading(true);
                    const [transactionsData, budgetStatsData] = await Promise.all([
                        getUserTransactions(user.id),
                        getBudgetStats()
                    ]);

                    // Process budget vs actual spending data
                    const processedData = {
                        labels: [],
                        budgeted: [],
                        actual: []
                    };

                    if (budgetStatsData && Array.isArray(budgetStatsData)) {
                        budgetStatsData.forEach(stat => {
                            processedData.labels.push(stat.category);
                            processedData.budgeted.push(stat.budgetAmount);
                            processedData.actual.push(stat.actualSpent);
                        });
                    }

                    setBudgetData(processedData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchData();
    }, [user]);

    useEffect(() => {
        if (chartRef.current && budgetData) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient1.addColorStop(0, 'rgba(54, 162, 235, 0.8)');
            gradient1.addColorStop(1, 'rgba(54, 162, 235, 0.2)');

            const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient2.addColorStop(0, 'rgba(255, 99, 132, 0.8)');
            gradient2.addColorStop(1, 'rgba(255, 99, 132, 0.2)');

            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: budgetData.labels,
                    datasets: [
                        {
                            label: 'Budgeted',
                            data: budgetData.budgeted,
                            backgroundColor: gradient1,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false,
                        },
                        {
                            label: 'Actual',
                            data: budgetData.actual,
                            backgroundColor: gradient2,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: 12,
                                    family: "'Inter', sans-serif"
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: '#1a1a1a',
                            bodyColor: '#1a1a1a',
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(context.raw);
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: true,
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            setLoading(false);
        }
    }, [budgetData]);

    return (
        <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Budget vs Actual Spending
                </h3>
                <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <FontAwesomeIcon icon={faRotate} className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                    </button>
                </div>
            </div>
            
            <div className="relative h-80">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="text-blue-500 mb-2"
                        >
                            <FontAwesomeIcon icon={faSpinner} className="h-8 w-8" />
                        </motion.div>
                        <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
                    </div>
                ) : !budgetData || budgetData.labels.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">No budget data available</p>
                    </div>
                ) : (
                    <canvas ref={chartRef} />
                )}
            </div>
        </motion.div>
    );
};

export default DashboardBarChart;