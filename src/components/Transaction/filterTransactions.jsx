import React from 'react';
import WalletCard from './transactionWalletCard';
import './styles/transactionFilterStyles.css';

const FilterTransactions = ({ filters, setFilters, wallets = [], onWalletSelect, categories = [], onCategorySelect }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            minAmount: '',
            maxAmount: '',
            category: '',
            startDate: '',
            endDate: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    return (
        <div className="filter-transactions" role="search" aria-label="Transaction filters">
            <div className="filter-header">
                <h3>Filter Transactions</h3>
                {hasActiveFilters && (
                    <button 
                        className="clear-filters-btn"
                        onClick={handleClearFilters}
                        aria-label="Clear all filters"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="filter-section">
                <h4>Wallets</h4>
                <div className="wallet-filter" role="group" aria-label="Filter by wallet">
                    {Array.isArray(wallets) && wallets.map(wallet => (
                        <WalletCard
                            key={wallet._id}
                            wallet={wallet}
                            onSelect={onWalletSelect}
                        />
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h4>Category</h4>
                <div className="category-filter">
                    <select
                        name="category"
                        value={filters.category}
                        onChange={handleChange}
                        aria-label="Filter by category"
                    >
                        <option value="">All Categories</option>
                        {Array.isArray(categories) && categories.map(category => (
                            <option
                                key={category._id}
                                value={category.name}
                            >
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="filter-section">
                <h4>Amount Range</h4>
                <div className="amount-filters">
                    <div className="filter-group">
                        <label htmlFor="minAmount">Min Amount</label>
                        <input
                            id="minAmount"
                            type="number"
                            name="minAmount"
                            placeholder="0.00"
                            value={filters.minAmount}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="maxAmount">Max Amount</label>
                        <input
                            id="maxAmount"
                            type="number"
                            name="maxAmount"
                            placeholder="0.00"
                            value={filters.maxAmount}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>
            </div>

            <div className="filter-section">
                <h4>Date Range</h4>
                <div className="date-filters">
                    <div className="filter-group">
                        <label htmlFor="startDate">Start Date</label>
                        <input
                            id="startDate"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="endDate">End Date</label>
                        <input
                            id="endDate"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleChange}
                            min={filters.startDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterTransactions;