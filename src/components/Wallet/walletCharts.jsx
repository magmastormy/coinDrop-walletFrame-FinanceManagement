import React from 'react';
import { Bar } from 'react-chartjs-2';

const WalletChart = ({ wallets }) => {
    const data = {
        labels: wallets.map(w => w.name),
        datasets: [
            {
                label: 'Wallet Balances',
                data: wallets.map(w => w.balance),
                backgroundColor: wallets.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div>
            <h3>Wallet Balances</h3>
            <Bar data={data} />
        </div>
    );
};

export default WalletChart;