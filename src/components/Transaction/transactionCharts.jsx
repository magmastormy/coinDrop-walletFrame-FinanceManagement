import React from 'react';
import { Line } from 'react-chartjs-2';

const TransactionChart = ({ transactions }) => {
    const data = {
        labels: transactions.map(t => new Date(t.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Transaction Amount',
                data: transactions.map(t => t.amount),
                fill: false,
                backgroundColor: 'rgba(75,192,192,0.4)',
                borderColor: 'rgba(75,192,192,1)',
            },
        ],
    };

    return (
        <div>
            <h3>Transaction Trends</h3>
            <Line data={data} />
        </div>
    );
};

export default TransactionChart;