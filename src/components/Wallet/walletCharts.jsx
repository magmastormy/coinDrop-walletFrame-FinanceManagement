import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { GlassCard } from '../ui/GlassCard';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const WalletChart = ({ wallets = [] }) => {
    if (!Array.isArray(wallets)) {
        console.warn('WalletChart: wallets prop is not an array');
        return null;
    }

    const chartData = {
        labels: wallets.map(w => w.name),
        datasets: [{
            label: 'Balance',
            data: wallets.map(w => w.balance || 0),
            backgroundColor: wallets.map((w, i) => {
                const colors = [
                    'rgba(59, 130, 246, 0.8)',   // Blue
                    'rgba(16, 185, 129, 0.8)',   // Green
                    'rgba(249, 115, 22, 0.8)',   // Orange
                    'rgba(139, 92, 246, 0.8)',   // Purple
                    'rgba(239, 68, 68, 0.8)',    // Red
                ];
                return colors[i % colors.length];
            }),
            borderRadius: 8,
            borderSkipped: false,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8,
                titleFont: { family: "'Inter', sans-serif" },
                bodyFont: { family: "'Inter', sans-serif" },
                callbacks: {
                    label: (context) => {
                        return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(context.raw);
                    }
                }
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
                    font: { family: "'Inter', sans-serif" },
                    color: '#9CA3AF',
                    callback: function (value) {
                        return '$' + value;
                    }
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { family: "'Inter', sans-serif" },
                    color: '#9CA3AF'
                }
            }
        }
    };

    return (
        <GlassCard className="p-6 h-[350px]">
            <h3 className="text-lg font-display font-bold mb-4">Wallet Balances</h3>
            <div className="h-[250px] w-full">
                <Bar data={chartData} options={options} />
            </div>
        </GlassCard>
    );
};

export default WalletChart;
