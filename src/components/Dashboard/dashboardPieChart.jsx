import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEllipsisVertical, 
    faDownload,
    faRotate
} from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js/auto';

const DashboardPieChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Mock data - replace with real data from props
    const mockData = {
        labels: ['Bitcoin', 'Ethereum', 'Cardano', 'Solana', 'Others'],
        datasets: [{
            data: [40, 25, 15, 12, 8],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1,
            hoverOffset: 4
        }]
    };

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: mockData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
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
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateScale: true,
                    animateRotate: true,
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
        link.download = 'portfolio-distribution.png';
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
                <h3 className="chart-title">Portfolio Distribution</h3>
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
            <div className="chart-footer">
                <div className="total-value">
                    <span className="label">Total Value</span>
                    <span className="value">$15,420.50</span>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardPieChart;