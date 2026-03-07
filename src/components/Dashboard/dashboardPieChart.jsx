import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, AlertCircle, PieChart } from 'lucide-react';
import Chart from 'chart.js/auto';
import { getUserTransactions } from '../../services/transactionService';
import { getUserCategories } from '../../services/categoryService';

const DashboardPieChart = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);
    const [chartData, setChartData] = useState(null);

    const generateColors = (count) => {
        const baseColors = [
            '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
            '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
        ];
        return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
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

                    const transactionsData = transactionsResponse.transactions || [];
                    const expensesByCategory = {};

                    if (Array.isArray(transactionsData)) {
                        transactionsData.forEach(transaction => {
                            const txCategoryId = transaction.category?._id || transaction.category;
                            const category = categoriesData.find(c => c._id === txCategoryId);
                            if (category && transaction.type === 'expense') {
                                expensesByCategory[category.name] = (expensesByCategory[category.name] || 0) + transaction.amount;
                            }
                        });
                    }

                    if (Object.keys(expensesByCategory).length === 0) {
                        setChartData(null);
                    } else {
                        const labels = Object.keys(expensesByCategory);
                        const data = Object.values(expensesByCategory);
                        const backgroundColor = generateColors(labels.length);

                        setChartData({ labels, data, backgroundColor });
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    setChartData(null);
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
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { family: "'Inter', sans-serif", size: 11 },
                            color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const value = context.raw || 0;
                                return ` $${value.toLocaleString()}`;
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <PieChart className="w-12 h-12 mb-2 opacity-20" />
                <p>No expense data yet</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[250px] relative">
            <canvas ref={chartRef} />
        </div>
    );
};

export default DashboardPieChart;
