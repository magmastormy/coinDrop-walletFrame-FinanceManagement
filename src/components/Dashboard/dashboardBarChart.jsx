import { logError } from '../../utils/logger';

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, BarChart3 } from 'lucide-react';
import Chart from 'chart.js/auto';
import { getUserTransactions } from '../../services/transactionService';

const DashboardBarChart = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user && user.id) {
                try {
                    setLoading(true);
                    const transactionsResponse = await getUserTransactions(user.id);
                    const transactionsData = transactionsResponse.transactions || [];

                    // Process data by month for the last 6 months
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    const monthlyData = months.map((month, index) => {
                        const monthIndex = (currentMonth - 5 + index) % 12;
                        const monthYear = monthIndex < 0 ? currentYear - 1 : currentYear;
                        const adjustedMonthIndex = monthIndex < 0 ? monthIndex + 12 : monthIndex;

                        const monthTransactions = transactionsData.filter(t => {
                            const txDate = new Date(t.date);
                            return txDate.getMonth() === adjustedMonthIndex && txDate.getFullYear() === monthYear;
                        });

                        const income = monthTransactions
                            .filter(t => t.type === 'income')
                            .reduce((sum, t) => sum + (t.amount || 0), 0);

                        const expense = monthTransactions
                            .filter(t => t.type === 'expense')
                            .reduce((sum, t) => sum + (t.amount || 0), 0);

                        return { month, income, expense };
                    });

                    setChartData({
                        labels: months,
                        income: monthlyData.map(d => d.income),
                        expense: monthlyData.map(d => d.expense)
                    });
                } catch (error) {
                    logError('Error fetching data:', error);
                    setChartData({
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        income: [0, 0, 0, 0, 0, 0],
                        expense: [0, 0, 0, 0, 0, 0]
                    });
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        if (chartRef.current && chartData) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient1.addColorStop(0, 'rgba(182, 196, 255, 0.8)');
            gradient1.addColorStop(1, 'rgba(182, 196, 255, 0.0)');

            const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient2.addColorStop(0, 'rgba(78, 222, 163, 0.3)');
            gradient2.addColorStop(1, 'rgba(78, 222, 163, 0.0)');

            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: 'Income',
                            data: chartData.income,
                            backgroundColor: gradient1,
                            borderColor: '#b6c4ff',
                            borderWidth: 1,
                            borderRadius: 4,
                            borderSkipped: false,
                        },
                        {
                            label: 'Expense',
                            data: chartData.expense,
                            backgroundColor: gradient2,
                            borderColor: '#dae2fd',
                            borderWidth: 1,
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
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(11, 19, 38, 0.8)',
                            padding: 12,
                            cornerRadius: 8,
                            usePointStyle: true,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false,
                            },
                            ticks: {
                                color: '#738296',
                                callback: (value) => `$${value}`
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#738296',
                                font: {
                                    size: 10,
                                    weight: 'bold'
                                },
                                callback: function(value) {
                                    return this.getLabelForValue(value);
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
        }
    }, [chartData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-on-tertiary-container">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <p>Loading data...</p>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-on-tertiary-container">
                <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                <p>No data available</p>
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
