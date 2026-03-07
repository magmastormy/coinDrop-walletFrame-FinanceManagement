// src/components/Wallet/WalletBudgetList.jsx
import React from 'react';

import BudgetCard from '../Budget/budgetCard';

const WalletBudgetList = ({ budgets }) => {
    return (
        <div className="wallet-budgets">
            <div className="budgets-container">
                {budgets.map(budget => (
                    <BudgetCard
                        key={budget._id}
                        budget={budget}
                    />
                ))}
            </div>
        </div>
    );
};

export default WalletBudgetList;
