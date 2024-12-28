// src/components/Wallet/walletCharts.jsx
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const WalletChart = ({ wallets =[] }) => {
    if (!Array.isArray(wallets)) {
        console.warn('WalletChart: wallets prop is not an array');
        return null;
    }
    const chartData = {
        labels: wallets.map(w => w.name),
        datasets: [{
            label: 'Wallet Balance',
            data: wallets.map(w => w.balance || 0),
            backgroundColor: wallets.map(() => `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.6)`),
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Wallet Balances'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Balance ($)'
                }
            }
        }
    };

    return (
        <div style={{ height: '300px', width: '100%', padding: '20px' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default WalletChart;