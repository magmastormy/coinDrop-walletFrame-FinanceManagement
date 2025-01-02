import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faArrowTrendDown,
    faEllipsisVertical,
    faRotate,
    faFilter
} from '@fortawesome/free-solid-svg-icons';

const DashboardTables = () => {
    // Mock data - replace with real API data
    const mockTransactions = [
        {
            id: 1,
            type: 'buy',
            asset: 'BTC',
            amount: 0.5,
            price: 45230.50,
            total: 22615.25,
            date: '2024-01-01T10:30:00',
            status: 'completed'
        },
        {
            id: 2,
            type: 'sell',
            asset: 'ETH',
            amount: 2.5,
            price: 2350.75,
            total: 5876.88,
            date: '2024-01-01T09:15:00',
            status: 'completed'
        },
        {
            id: 3,
            type: 'buy',
            asset: 'ADA',
            amount: 1000,
            price: 1.25,
            total: 1250.00,
            date: '2024-01-01T08:45:00',
            status: 'pending'
        }
    ];

    const [transactions, setTransactions] = useState(mockTransactions);
    const [filter, setFilter] = useState('all'); // all, buy, sell

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const rowVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.3
            }
        }
    };

    const handleRefresh = () => {
        // Add refresh logic here
        console.log('Refreshing transactions...');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <motion.div 
            className="table-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="table-header">
                <h3 className="table-title">Recent Transactions</h3>
                <div className="table-actions">
                    <div className="filter-buttons">
                        <button 
                            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`filter-button ${filter === 'buy' ? 'active' : ''}`}
                            onClick={() => setFilter('buy')}
                        >
                            Buy
                        </button>
                        <button 
                            className={`filter-button ${filter === 'sell' ? 'active' : ''}`}
                            onClick={() => setFilter('sell')}
                        >
                            Sell
                        </button>
                    </div>
                    <button 
                        className="table-action-button"
                        onClick={handleRefresh}
                        title="Refresh"
                    >
                        <FontAwesomeIcon icon={faRotate} />
                    </button>
                    <button 
                        className="table-action-button"
                        title="More options"
                    >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                    </button>
                </div>
            </div>
            <div className="table-responsive">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Asset</th>
                            <th>Amount</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((tx) => (
                            <motion.tr 
                                key={tx.id}
                                variants={rowVariants}
                            >
                                <td>
                                    <span className={`transaction-type ${tx.type}`}>
                                        {tx.type === 'buy' ? 'Buy' : 'Sell'}
                                    </span>
                                </td>
                                <td>
                                    <div className="asset-cell">
                                        <span className="asset-symbol">{tx.asset}</span>
                                    </div>
                                </td>
                                <td>{tx.amount.toLocaleString()}</td>
                                <td>${tx.price.toLocaleString()}</td>
                                <td>${tx.total.toLocaleString()}</td>
                                <td>{formatDate(tx.date)}</td>
                                <td>
                                    <span className={`status-badge ${tx.status}`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td>
                                    <button className="action-button">
                                        <FontAwesomeIcon icon={faEllipsisVertical} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredTransactions.length === 0 && (
                <div className="empty-state">
                    <p>No transactions found</p>
                </div>
            )}
        </motion.div>
    );
};

export default DashboardTables;