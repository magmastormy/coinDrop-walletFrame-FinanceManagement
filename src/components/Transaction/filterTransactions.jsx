import React from 'react';
import WalletCard from './transactionWalletCard';
import './styles/transactionFilterStyles.css';

const FilterTransactions = ({ filters, setFilters, wallets, onWalletSelect, categories, onCategorySelect }) => {

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
            <div className="wallet-filter">
                {wallets.map(wallet => (
                    <WalletCard key={wallet._id} wallet={wallet} onSelect={onWalletSelect} />
                ))}
            </div>
            <div className="category-filter">
                <select name="category" value={filters.category} onChange={handleChange}>
                    <option value="">All Categories</option>
                    {categories.map(category => (
                        <option key={category._id} value={category.name}>{category.name}</option>
                    ))}
                </select>
            </div>
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
            <button onClick={() => setFilters({ minAmount: '', maxAmount: '', category: '', startDate: '', endDate: '' })}>
                Clear Filters
            </button>
        </div>
    );
};

export default FilterTransactions;