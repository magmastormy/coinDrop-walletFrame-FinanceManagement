import React from 'react';
import './styles/transactionStyles.css';
const FilterTransactions = ({ filters, setFilters }) => {
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
            <div className="form-group">
                <label htmlFor="walletId">Wallet ID</label>
                <input
                    id="walletId"
                    name="walletId"
                    type="text"
                    value={filters.walletId}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                    id="amount"
                    name="amount"
                    type="number"
                    value={filters.amount}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                    id="type"
                    name="type"
                    value={filters.type}
                    onChange={handleChange}
                >
                    <option value="">All</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={handleChange}
                />
            </div>
            <button onClick={() => setFilters({ walletId: '', amount: '', type: '', startDate: '', endDate: '' })}>Clear Filters</button>
        </div>
    );
};

export default FilterTransactions;