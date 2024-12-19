import React from 'react';
import WalletCard from './transactionWalletCard';
import './styles/transactionStyles.css';


const FilterTransactions = ({ filters, setFilters, wallets, onWalletSelect }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    return (
        <div className="filter-transactions">
            <h3>Filter Transactions</h3>
            <div className="horizontal-filters">
                <input
                    type="number"
                    name="minAmount"
                    placeholder="Min Amount"
                    value={filters.minAmount}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="maxAmount"
                    placeholder="Max Amount"
                    value={filters.maxAmount}
                    onChange={handleChange}
                />
                <select
                    name="category"
                    value={filters.category}
                    onChange={handleChange}
                >
                    <option value="">All Categories</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                </select>
                <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleChange}
                />
                <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleChange}
                />
            </div>
            <div className="wallet-cards-container">
                {wallets.map(wallet => (
                    <WalletCard key={wallet._id} wallet={wallet} onSelect={onWalletSelect} />
                ))}
            </div>
            <button onClick={() => setFilters({ minAmount: '', maxAmount: '', category: '', startDate: '', endDate: '' })}>
                Clear Filters
            </button>
        </div>
    );
};

export default FilterTransactions;