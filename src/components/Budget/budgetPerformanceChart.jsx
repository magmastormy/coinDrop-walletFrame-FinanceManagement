import React from 'react';
import { Bar } from 'react-chartjs-2';

const BudgetPerformanceChart = ({ performanceData }) => {
    const data = {
        labels: performanceData.map(b => b.name),
        datasets: [
            {
                label: 'Total Spent',
                data: performanceData.map(b => b.totalSpent),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
            {
                label: 'Budget Amount',
                data: performanceData.map(b => b.amount),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div>
            <h3>Budget Performance</h3>
            <Bar data={data} />
        </div>
    );
};

export default BudgetPerformanceChart;