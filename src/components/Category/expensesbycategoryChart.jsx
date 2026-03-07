import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { PieChart, Loader2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';


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
            const catId = transaction.category?._id || transaction.category;
            const category = categories.find(c => String(c._id) === String(catId));
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
                        family: "'Manrope', sans-serif"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <GlassCard className="border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-5 dark:from-white/10 dark:via-white/5">
                <div className="mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Expenses by Category</h3>
                </div>

                <div className="min-h-[320px]">
                    {loading ? (
                        <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm">Loading chart data...</p>
                        </div>
                    ) : !chartData ? (
                        <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
                            <PieChart className="h-8 w-8 opacity-60" />
                            <p className="text-sm">No expense data available</p>
                        </div>
                    ) : (
                        <div className="h-[320px] rounded-xl border border-white/10 bg-background/40 p-3">
                            <Pie data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default ExpensesByCategoryChart;
