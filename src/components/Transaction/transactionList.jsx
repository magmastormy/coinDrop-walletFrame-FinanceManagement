// src/components/Transaction/transactionList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useTable, useSortBy } from 'react-table';
import './styles/transactionListStyles.css';

const TransactionList = ({ transactions = [], onEdit, onDelete, wallets = [], savingsAccounts = [] }) => {
    // Set to display 10 transactions per page
    const [pageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [displayedTransactions, setDisplayedTransactions] = useState([]);
    
    // Log the number of transactions for debugging
    console.log(`TransactionList received ${transactions.length} transactions`);
    const data = React.useMemo(() => 
        Array.isArray(transactions) ? transactions.map(t => ({
            ...t,
            date: t.date ? new Date(t.date) : new Date() // Ensure date is Date object
        })) : [],
        [transactions]
    );

    const columns = React.useMemo(
        () => [
            {
                Header: 'Source',
                accessor: 'source',
                Cell: ({ row }) => {
                    const transaction = row.original;
                    const sourceName = transaction.walletId ? 
                        (wallets.find(w => w._id === transaction.walletId)?.name || 'Wallet') :
                        (savingsAccounts.find(s => s._id === transaction.savingsAccountId)?.name || 'Savings Account');
                    
                    return (
                        <div className="transaction-source">
                            {sourceName}
                        </div>
                    );
                }
            },
            {
                Header: 'Description',
                accessor: 'description',
                Cell: ({ value }) => (
                    <div className="transaction-description">
                        {value || 'No description'}
                    </div>
                )
            },
            {
                Header: 'Amount',
                accessor: 'amount',
                Cell: ({ value, row }) => (
                    <div className={`transaction-amount ${row.original.type}`}>
                        {row.original.type === 'expense' ? '-' : '+'}${Math.abs(Number(value)).toFixed(2)}
                    </div>
                )
            },
            {
                Header: 'Type',
                accessor: 'type',
                Cell: ({ value }) => (
                    <div className={`transaction-type-badge ${value}`}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                    </div>
                )
            },
            {
                Header: 'Date',
                accessor: 'date',
                Cell: ({ value }) => {
                    const dateObj = new Date(value);
                    return (
                        <div className="transaction-date">
                            {isNaN(dateObj) ? 'Invalid date' : dateObj.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                    );
                },
                sortType: (a, b) => {
                    const dateA = new Date(a.values.date);
                    const dateB = new Date(b.values.date);
                    return isNaN(dateA) ? 1 : isNaN(dateB) ? -1 : dateB - dateA;
                }
            },
            {
                Header: 'Actions',
                accessor: 'actions',
                Cell: ({ row }) => (
                    <div className="transaction-actions">
                        <button
                            className="action-btn edit"
                            onClick={() => onEdit(row.original)}
                            aria-label={`Edit transaction: ${row.original.description || 'No description'}`}
                        >
                            <span className="action-icon">✎</span>
                            <span className="action-text">Edit</span>
                        </button>
                        <button
                            className="action-btn delete"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this transaction?')) {
                                    onDelete(row.original._id);
                                }
                            }}
                            aria-label={`Delete transaction: ${row.original.description || 'No description'}`}
                        >
                            <span className="action-icon">×</span>
                            <span className="action-text">Delete</span>
                        </button>
                    </div>
                ),
            },
        ],
        [onEdit, onDelete, wallets, savingsAccounts]
    );

    // Calculate total pages based on data length and page size
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    
    // Reset to first page when data changes (e.g., when filters are applied)
    useEffect(() => {
        setCurrentPage(0);
    }, [data.length]);
    
    // Update displayed transactions when data or pagination changes
    useEffect(() => {
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        const slicedData = data.slice(startIndex, endIndex);
        setDisplayedTransactions(slicedData);
        
        console.log(`Pagination: Page ${currentPage + 1} of ${totalPages}, Showing items ${startIndex + 1}-${Math.min(endIndex, data.length)} of ${data.length}`);
    }, [data, currentPage, pageSize, totalPages]);
    
    // Log when transactions change (for debugging)
    useEffect(() => {
        console.log(`TransactionList: Transactions changed, now have ${transactions.length} transactions`);
    }, [transactions.length]);
    
    // Pagination control functions
    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };
    
    const goToPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    const goToPage = (pageNumber) => {
        if (pageNumber >= 0 && pageNumber < totalPages) {
            setCurrentPage(pageNumber);
        }
    };
    
    // Check if we can navigate to previous or next pages
    const canGoToPreviousPage = currentPage > 0;
    const canGoToNextPage = currentPage < totalPages - 1;
    
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable(
        {
            columns,
            data: displayedTransactions, // Use the paginated data
            initialState: {
                sortBy: [{ id: 'date', desc: true }]
            }
        },
        useSortBy
    );

    // Show empty state if there are no transactions
    if (data.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Transactions Yet</h3>
                <p>Start by creating your first transaction!</p>
            </div>
        );
    }

    return (
        <div className="transaction-table-container" role="region" aria-label="Transactions list">
            <table className="transaction-table" {...getTableProps()}>
                <thead>
                    {headerGroups.map(headerGroup => {
                        const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                        return (
                            <tr key={key} {...headerGroupProps}>
                                {headerGroup.headers.map(column => {
                                    const { key, ...columnProps } = column.getHeaderProps(column.getSortByToggleProps());
                                    return (
                                        <th key={key} {...columnProps}>
                                            {column.render('Header')}
                                            <span className="sort-indicator">
                                                {column.isSorted ? (column.isSortedDesc ? ' ▼' : ' ▲') : ''}
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map(row => {
                        prepareRow(row);
                        const { key, ...rowProps } = row.getRowProps();
                        return (
                            <tr key={key} {...rowProps}>
                                {row.cells.map(cell => {
                                    const { key, ...cellProps } = cell.getCellProps();
                                    return (
                                        <td key={key} {...cellProps}>
                                            {cell.render('Cell')}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {/* Custom Pagination Controls - Always show them */}
            <div className="pagination-controls">
                <div className="pagination-info">
                    Page{' '}
                    <strong>
                        {currentPage + 1} of {totalPages}
                    </strong>
                    {data.length > 0 && (
                        <span className="pagination-summary">
                            {' '}(Showing {displayedTransactions.length} of {data.length} transactions)
                        </span>
                    )}
                </div>
                <div className="pagination-buttons">
                    <button 
                        onClick={goToPreviousPage} 
                        disabled={!canGoToPreviousPage}
                        className="pagination-button"
                        aria-label="Previous page"
                    >
                        ← Previous
                    </button>
                    <button 
                        onClick={goToNextPage} 
                        disabled={!canGoToNextPage}
                        className="pagination-button"
                        aria-label="Next page"
                    >
                        Next →
                    </button>
                </div>
                {/* Page number buttons for direct navigation */}
                <div className="pagination-page-numbers">
                    {Array.from(
                        { length: totalPages },
                        (_, i) => (
                            <button
                                key={i}
                                className={`pagination-page-button ${currentPage === i ? 'active' : ''}`}
                                onClick={() => goToPage(i)}
                            >
                                {i + 1}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionList;