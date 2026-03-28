import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setLoading, setError } from '../../slices/transactionSlice';
import savingsAccountService from '../../services/savingsAccountService';
import EditTransactionModal from './editTransactionModal';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import {
    Edit2, ArrowDownLeft, ArrowUpRight, ArrowRightLeft,
    Calendar, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
    Filter
} from 'lucide-react';

const SavingsAccountTransactionTable = ({ accountId, wallets = [], savingsAccounts = [], budgets = [], categories = [] }) => {
    const dispatch = useDispatch();
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState({
        type: 'all',
        dateRange: 'all'
    });

    useEffect(() => {
        const fetchTransactions = async () => {
            if (accountId) {
                dispatch(setLoading(true));
                try {
                    const account = await savingsAccountService.getSavingsAccount(accountId);
                    setTransactions(account.transactions || []);
                } catch (err) {
                    console.error('Error fetching transactions:', err);
                    dispatch(setError('Unable to fetch transactions. Please try again later.'));
                } finally {
                    dispatch(setLoading(false));
                }
            }
        };

        fetchTransactions();
    }, [accountId, dispatch]);

    const handleEditClick = (transaction) => {
        setSelectedTransaction(transaction);
        setEditModalOpen(true);
    };

    const handleUpdateTransaction = async (updatedTransaction) => {
        try {
            dispatch(setLoading(true));
            await savingsAccountService.updateTransaction(updatedTransaction._id, updatedTransaction);
            setTransactions(prev => prev.map(t =>
                t._id === updatedTransaction._id ? updatedTransaction : t
            ));
            setEditModalOpen(false);
        } catch (err) {
            console.error('Error updating transaction:', err);
            dispatch(setError('Failed to update transaction. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions];

        // Filter by search term
        if (searchTerm) {
            result = result.filter(t =>
                t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.amount?.toString().includes(searchTerm)
            );
        }

        // Filter by type
        if (filters.type !== 'all') {
            result = result.filter(t => t.type === filters.type);
        }

        // Filter by date range
        if (filters.dateRange !== 'all') {
            const now = new Date();
            let startDate;

            switch (filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                result = result.filter(t => new Date(t.date) >= startDate);
            }
        }

        // Sort
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return result;
    }, [transactions, searchTerm, filters, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredAndSortedTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'income': return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
            case 'expense': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
            case 'transfer': return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
            default: return <div className="w-4 h-4" />;
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
    };

    const handleFilterChange = (filter, value) => {
        setFilters(prev => ({ ...prev, [filter]: value }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when items per page changes
    };

    const generatePageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    if (!accountId) {
        return <div className="text-center text-muted-foreground p-8">No account selected</div>;
    }

    return (
        <div
            className="space-y-4"
            style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-1)',
                padding: '24px',
            }}
        >
            <h3 className="text-lg font-semibold">Transaction History</h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            height: '40px',
                            paddingLeft: '36px',
                            paddingRight: '12px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-2)',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                            fontSize: '14px',
                            fontFamily: 'var(--font-body)',
                        }}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            style={{
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                fontSize: '14px',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            style={{
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                fontSize: '14px',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            style={{
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                fontSize: '14px',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
                Showing {paginatedTransactions.length} of {filteredAndSortedTransactions.length} transactions
            </div>

            <div
                className="overflow-hidden"
                style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-1)',
                }}
            >
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-muted-foreground" style={{ background: 'var(--color-surface-2)' }}>
                        <tr>
                            <th 
                                className="px-6 py-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => requestSort('date')}
                            >
                                <div className="flex items-center gap-1">
                                    Date
                                    {getSortIcon('date')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => requestSort('description')}
                            >
                                <div className="flex items-center gap-1">
                                    Description
                                    {getSortIcon('description')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => requestSort('type')}
                            >
                                <div className="flex items-center gap-1">
                                    Type
                                    {getSortIcon('type')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => requestSort('amount')}
                            >
                                <div className="flex items-center gap-1">
                                    Amount
                                    {getSortIcon('amount')}
                                </div>
                            </th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid var(--color-border)' }}>
                        {paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map((transaction) => (
                                <tr
                                    key={transaction._id}
                                    className="transition-colors group"
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    style={{ borderTop: '1px solid var(--color-border)' }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(transaction.date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg bg-opacity-10",
                                                transaction.type === 'income' ? "bg-emerald-500" :
                                                    transaction.type === 'expense' ? "bg-red-500" : "bg-blue-500"
                                            )}>
                                                {getTypeIcon(transaction.type)}
                                            </div>
                                            <span className="font-medium text-foreground">
                                                {transaction.description || 'No description'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground capitalize">
                                        {transaction.type}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <span className={cn(
                                            transaction.type === 'income' ? "text-emerald-500" :
                                                transaction.type === 'expense' ? "text-red-500" : "text-blue-500"
                                        )}>
                                            {transaction.type === 'expense' ? '-' : '+'}
                                            {formatCurrency(transaction.amount)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEditClick(transaction)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                    No transactions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {generatePageNumbers().map(pageNumber => (
                        <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="h-8 w-8 p-0"
                        >
                            {pageNumber}
                        </Button>
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                transaction={selectedTransaction}
                onUpdate={handleUpdateTransaction}
                wallets={wallets}
                savingsAccounts={savingsAccounts}
                budgets={budgets}
                categories={categories}
            />
        </div>
    );
};

export default SavingsAccountTransactionTable;
