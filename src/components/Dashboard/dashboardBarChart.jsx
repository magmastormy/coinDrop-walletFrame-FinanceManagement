import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEllipsisVertical, 
    faDownload,
    faRotate,
    faSpinner,
    faExclamationTriangle,
    faChartColumn
} from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js/auto';
import { getUserTransactions } from '../../services/transactionService';
import { getBudgetStats } from '../../services/budgetService';
import './styles/dashboardBarChartStyles.css';

const DashboardBarChart = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useSelector(state => state.auth);
    const [budgetData, setBudgetData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user && user.id) {
                try {
                    setLoading(true);
                    setError(null);
                    
                    // Add a small delay to prevent too many simultaneous requests
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Get budget stats
                    const budgetStatsResponse = await getBudgetStats();
                    
                    // Process budget vs actual spending data
                    const processedData = {
                        labels: [],
                        budgeted: [],
                        actual: []
                    };

                    // Check if we got an error
                    if (budgetStatsResponse.error) {
                        setError(budgetStatsResponse.message || 'Failed to load budget data');
                        throw new Error(budgetStatsResponse.message);
                    }

                    // Handle successful response - could be in budgetStatsResponse.data or just budgetStatsResponse
                    const budgetStatsData = Array.isArray(budgetStatsResponse) 
                        ? budgetStatsResponse 
                        : (budgetStatsResponse.data || []);

                    if (budgetStatsData.length > 0) {
                        budgetStatsData.forEach(stat => {
                            processedData.labels.push(stat.category || 'Uncategorized');
                            processedData.budgeted.push(stat.budgetAmount || 0);
                            processedData.actual.push(stat.actualSpent || 0);
                        });
                        
                        setBudgetData(processedData);
                    } else {
                        // Use placeholder data if no actual budget data
                        setBudgetData({
                            labels: ['No Budget Data Available'],
                            budgeted: [0],
                            actual: [0]
                        });
                        console.warn('No budget stats data available');
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    setError('Failed to load budget data. Please try again later.');
                    
                    // Set placeholder data
                    setBudgetData({
                        labels: ['Error Loading Data'],
                        budgeted: [0],
                        actual: [0]
                    });
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

            // Only create chart if we have actual data
            if (budgetData.labels.length > 0 && 
                (budgetData.budgeted.some(val => val > 0) || budgetData.actual.some(val => val > 0))) {
                
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
            }
            setLoading(false);
        }
    }, [budgetData]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            // Reload data
            const budgetStatsData = await getBudgetStats();
            
            // Process data
            const processedData = {
                labels: [],
                budgeted: [],
                actual: []
            };

            if (budgetStatsData && Array.isArray(budgetStatsData)) {
                budgetStatsData.forEach(stat => {
                    processedData.labels.push(stat.category || 'Uncategorized');
                    processedData.budgeted.push(stat.budgetAmount || 0);
                    processedData.actual.push(stat.actualSpent || 0);
                });
            }
            
            setBudgetData(processedData);
            setError(null);
        } catch (error) {
            console.error('Error refreshing data:', error);
            setError('Failed to refresh data');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="chart-loading">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <p>Loading budget data...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="chart-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <p>{error}</p>
                    <button className="refresh-button" onClick={handleRefresh}>
                        <FontAwesomeIcon icon={faRotate} /> Try Again
                    </button>
                </div>
            );
        }
        
        if (!budgetData || budgetData.labels.length === 0 || 
            (budgetData.budgeted.every(val => val === 0) && budgetData.actual.every(val => val === 0))) {
            return (
                <div className="no-data">
                    <FontAwesomeIcon icon={faChartColumn} />
                    <p>No budget data available</p>
                    <span>Create budgets to see your spending compared to your budget</span>
                </div>
            );
        }
        
        return (
            <div className="chart-container">
                <canvas ref={chartRef} height="300"></canvas>
            </div>
        );
    };

    return (
        <motion.div 
            className="dashboard-chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="chart-header">
                <h3 className="chart-title">
                    Budget vs Actual Spending
                </h3>
                <div className="chart-actions">
                    <button 
                        className="chart-action-button" 
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={loading ? faSpinner : faRotate} spin={loading} />
                    </button>
                    <button className="chart-action-button">
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <button className="chart-action-button">
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                    </button>
                </div>
            </div>
            
            {renderContent()}
        </motion.div>
    );
};

export default DashboardBarChart;