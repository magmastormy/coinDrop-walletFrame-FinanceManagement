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
import { LineChart, Loader2 } from 'lucide-react';


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
                        family: "'Manrope', sans-serif"
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
                        family: "'Manrope', sans-serif"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div
                style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface-1)',
                    padding: '24px',
                }}
            >
                <div className="mb-4 flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Expenses Over Time</h3>
                </div>

                <div className="min-h-[320px]">
                    {loading ? (
                        <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm">Loading chart data...</p>
                        </div>
                    ) : !chartData ? (
                        <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
                            <LineChart className="h-8 w-8 opacity-60" />
                            <p className="text-sm">No expense data available</p>
                        </div>
                    ) : (
                        <div
                            className="h-[320px]"
                            style={{
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                padding: '12px',
                            }}
                        >
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ExpensesOverTimeLineChart;
