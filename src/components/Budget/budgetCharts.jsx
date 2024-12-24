import React from 'react';
import { Pie } from 'react-chartjs-2';

const BudgetChart = ({ budgets }) => {
    const data = {
        labels: budgets.map(b => b.category),
        datasets: [
            {
                data: budgets.map(b => b.amount),
                backgroundColor: budgets.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
                hoverBackgroundColor: budgets.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
            },
        ],
    };

    return (
        <div>
            <h3>Budget Distribution</h3>
            <Pie data={data} />
        </div>
    );
};

export default BudgetChart;