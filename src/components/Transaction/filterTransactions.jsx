import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faWallet, faPiggyBank } from '@fortawesome/free-solid-svg-icons';
import TransactionWalletCard from './transactionWalletCard';
import TransactionSavingsAccountCard from './transactionSavingsAccountCard';
import './styles/filterTransactionsStyles.css';

const FilterTransactions = ({ 
    filters, 
    setFilters, 
    wallets = [], 
    savingsAccounts = [],
    onWalletSelect,
    onSavingsSelect,
    categories = [], 
    onCategorySelect 
}) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            minAmount: undefined,
            maxAmount: undefined,
            category: undefined,
            startDate: undefined,
            endDate: undefined,
            walletId: undefined,
            source: undefined,
            savingsAccountId: undefined
        });
    };

    console.log('Savings Accounts:', savingsAccounts);

    return (
        <div className="filter-container">
            <div className="filter-header">
                <FontAwesomeIcon icon={faFilter} />
                <h3>Filters</h3>
                <button 
                    onClick={() => setFilters({})}
                    disabled={Object.keys(filters).length === 0}
                >
                    Clear Filters
                </button>
            </div>

            <div className="filter-section">
                <h4>Sources</h4>
                <div className="source-buttons-scroll">
                    {wallets.map(wallet => (
                        <TransactionWalletCard 
                            key={wallet._id} 
                            wallet={wallet} 
                            onSelect={onWalletSelect} 
                        />
                    ))}
                    {savingsAccounts.map(account => (
                        <TransactionSavingsAccountCard 
                            key={account._id} 
                            savingsAccount={account} 
                            onSelect={onSavingsSelect}
                            selectedId={filters.savingsAccountId}
                        />
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h4>Month Range</h4>
                <div className="date-inputs">
                    <input
                        type="month"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleInputChange}
                    />
                    <span>to</span>
                    <input
                        type="month"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            <div className="filter-section">
                <h4>Category</h4>
                <select
                    name="category"
                    value={filters.category}
                    onChange={(e) => onCategorySelect(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                        <option key={category._id} value={category._id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default FilterTransactions;