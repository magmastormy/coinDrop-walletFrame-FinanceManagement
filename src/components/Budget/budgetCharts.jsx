// src/components/Budget/budgetCharts.jsx
import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BudgetChart = ({ budgets }) => {
    const data = {
        labels: budgets.map(b => b.category),
        datasets: [
            {
                data: budgets.map(b => b.amount),
                backgroundColor: budgets.map(() => 
                    `hsl(${Math.random() * 360}, 70%, 50%)`
                ),
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right'
            },
            title: {
                display: true,
                text: 'Budget Distribution'
            }
        }
    };

    return (
        <div style={{ height: '300px', width: '100%', padding: '20px' }}>
            <Pie data={data} options={options} />
        </div>
    );
};

export default BudgetChart;