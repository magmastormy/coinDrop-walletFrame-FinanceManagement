import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, RefreshCw, Download, MoreVertical, BarChart3 } from 'lucide-react';
import Chart from 'chart.js/auto';
import { getBudgetStats } from '../../services/budgetService';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

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

                    await new Promise(resolve => setTimeout(resolve, 300));
                    const budgetStatsResponse = await getBudgetStats();

                    const processedData = {
                        labels: [],
                        budgeted: [],
                        actual: []
                    };

                    if (budgetStatsResponse.error) {
                        throw new Error(budgetStatsResponse.message || 'Failed to load budget data');
                    }

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
                        setBudgetData({
                            labels: ['No Budget Data'],
                            budgeted: [0],
                            actual: [0]
                        });
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    setError('Failed to load budget data.');
                    setBudgetData({
                        labels: ['Error'],
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

            if (budgetData.labels.length > 0) {
                const ctx = chartRef.current.getContext('2d');
                const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
                gradient1.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
                gradient1.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

                const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
                gradient2.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
                gradient2.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: budgetData.labels,
                        datasets: [
                            {
                                label: 'Budgeted',
                                data: budgetData.budgeted,
                                backgroundColor: gradient1,
                                borderColor: '#3B82F6',
                                borderWidth: 2,
                                borderRadius: 4,
                                borderSkipped: false,
                            },
                            {
                                label: 'Actual',
                                data: budgetData.actual,
                                backgroundColor: gradient2,
                                borderColor: '#EF4444',
                                borderWidth: 2,
                                borderRadius: 4,
                                borderSkipped: false,
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    font: { family: "'Inter', sans-serif" },
                                    color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                padding: 12,
                                cornerRadius: 8,
                                usePointStyle: true,
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)',
                                    drawBorder: false,
                                },
                                ticks: {
                                    color: '#9CA3AF',
                                    callback: (value) => `$${value}`
                                }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#9CA3AF' }
                            }
                        }
                    }
                });
            }
        }
    }, [budgetData]);

    const handleRefresh = async () => {
        setLoading(true);
        // Re-fetch logic would go here, simplified for now to just toggle loading
        setTimeout(() => setLoading(false), 1000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <p>Loading data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mb-2 text-red-500" />
                <p>{error}</p>
                <Button variant="ghost" size="sm" onClick={handleRefresh} className="mt-2">
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    if (!budgetData || (budgetData.budgeted.every(v => v === 0) && budgetData.actual.every(v => v === 0))) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                <p>No budget data available</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[250px]">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export default DashboardBarChart;