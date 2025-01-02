import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEllipsisVertical, 
    faDownload,
    faRotate
} from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js/auto';

const DashboardBarChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Mock data - replace with real data from props
    const mockData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Portfolio Value',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                borderRadius: 5,
                tension: 0.4
            },
            {
                label: 'Profit/Loss',
                data: [5000, 7000, 6000, 9000, 8000, 11000],
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                borderRadius: 5,
                tension: 0.4
            }
        ]
    };

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: mockData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        displayColors: true,
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
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    const handleRefresh = () => {
        // Add refresh logic here
        console.log('Refreshing chart data...');
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = 'portfolio-chart.png';
        link.href = chartRef.current.toDataURL('image/png');
        link.click();
    };

    return (
        <motion.div 
            className="chart-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="chart-header">
                <h3 className="chart-title">Portfolio Performance</h3>
                <div className="chart-actions">
                    <button 
                        className="chart-action-button"
                        onClick={handleRefresh}
                        title="Refresh data"
                    >
                        <FontAwesomeIcon icon={faRotate} />
                    </button>
                    <button 
                        className="chart-action-button"
                        onClick={handleDownload}
                        title="Download chart"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <button 
                        className="chart-action-button"
                        title="More options"
                    >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                    </button>
                </div>
            </div>
            <div className="chart-content" style={{ height: '400px' }}>
                <canvas ref={chartRef}></canvas>
            </div>
        </motion.div>
    );
};

export default DashboardBarChart;