// src/components/Transaction/transactionList.jsx
import React from 'react';
import { useTable, useSortBy } from 'react-table';
import './styles/transactionListStyles.css';

const TransactionList = ({ transactions = [], onEdit, onDelete, wallets = [], savingsAccounts = [] }) => {
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

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable(
        {
            columns,
            data,
            initialState: {
                sortBy: [{ id: 'date', desc: true }]
            }
        },
        useSortBy
    );

    if (rows.length === 0) {
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
        </div>
    );
};

export default TransactionList;