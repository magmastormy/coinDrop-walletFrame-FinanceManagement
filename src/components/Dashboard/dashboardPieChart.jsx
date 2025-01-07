import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faDownload, faRotate, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js/auto';
import { getUserTransactions } from '../../services/transactionService';
import { getUserCategories } from '../../services/categoryService';
import './styles/dashboardPieChartStyles.css';

const DashboardPieChart = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);
    const [chartData, setChartData] = useState(null);

    const generateRandomColor = (index) => {
        const colors = [
            'rgba(59, 130, 246, 0.8)',   // Blue
            'rgba(16, 185, 129, 0.8)',   // Green
            'rgba(249, 115, 22, 0.8)',   // Orange
            'rgba(139, 92, 246, 0.8)',   // Purple
            'rgba(239, 68, 68, 0.8)',    // Red
            'rgba(245, 158, 11, 0.8)',   // Yellow
            'rgba(14, 165, 233, 0.8)',   // Light Blue
            'rgba(168, 85, 247, 0.8)',   // Violet
            'rgba(234, 88, 12, 0.8)',    // Dark Orange
            'rgba(22, 163, 74, 0.8)',    // Dark Green
        ];
        return colors[index % colors.length];
    };

    useEffect(() => {
        const fetchData = async () => {
            if (user && user.id) {
                try {
                    setLoading(true);
                    const [transactionsResponse, categoriesData] = await Promise.all([
                        getUserTransactions(user.id),
                        getUserCategories(user.id)
                    ]);

                    const transactionsData = transactionsResponse.data || [];
                    
                    // Process transactions by category
                    const expensesByCategory = {};
                    if (Array.isArray(transactionsData)) {
                        transactionsData.forEach(transaction => {
                            const category = categoriesData.find(c => c._id === transaction.categoryId);
                            if (category && transaction.type === 'expense') {
                                expensesByCategory[category.name] = (expensesByCategory[category.name] || 0) + transaction.amount;
                            }
                        });
                    }

                    // If no data, set default state
                    if (Object.keys(expensesByCategory).length === 0) {
                        setChartData({
                            labels: ['No Expenses'],
                            data: [100],
                            backgroundColor: [generateRandomColor(0)]
                        });
                    } else {
                        // Prepare chart data
                        const labels = Object.keys(expensesByCategory);
                        const data = Object.values(expensesByCategory);
                        const backgroundColor = labels.map((_, index) => generateRandomColor(index));

                        setChartData({
                            labels,
                            data,
                            backgroundColor
                        });
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    // Set default state on error
                    setChartData({
                        labels: ['Error Loading Data'],
                        data: [100],
                        backgroundColor: ['rgba(239, 68, 68, 0.8)'] // Red color for error
                    });
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchData();
    }, [user]);

    useEffect(() => {
        if (loading || !chartData) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: chartData.backgroundColor,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            },
                            color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0
                                }).format(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [chartData, loading]);

    return (
        <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Expenses by Category
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
                ) : !chartData || chartData.labels.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">No expense data available</p>
                    </div>
                ) : (
                    <canvas ref={chartRef} />
                )}
            </div>
        </motion.div>
    );
};

export default DashboardPieChart;