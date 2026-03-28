import React, { useState, useMemo, useCallback } from 'react';
import {
    Edit2, Trash2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft,
    Calendar, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
    Filter, Check, Receipt, X
} from 'lucide-react';
import { cn } from '../../lib/utils';

const TransactionTable = ({ 
    transactions = [], 
    onEdit, 
    onDelete, 
    wallets = [], 
    savingsAccounts = [],
    bulkEditMode = false,
    selectedTransactions = [],
    onSelectTransaction,
    onSelectAll,
    onAddTransaction,
    onImportCsv
}) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions];

        // Filter by search term
        if (searchTerm) {
            result = result.filter(t =>
                t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.amount?.toString().includes(searchTerm)
            );
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
    }, [transactions, searchTerm, sortConfig]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
    }, [filteredAndSortedTransactions.length, itemsPerPage]);

    const paginatedTransactions = useMemo(() => {
        return filteredAndSortedTransactions.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredAndSortedTransactions, currentPage, itemsPerPage]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }, []);

    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    const getSourceLabel = useCallback((transaction) => {
        if (transaction.walletId) {
            const wallet = wallets.find(w => w._id === transaction.walletId || w._id === transaction.walletId?._id);
            return wallet?.name || 'Unknown Wallet';
        }
        if (transaction.savingsAccountId) {
            const account = savingsAccounts.find(s => s._id === transaction.savingsAccountId || s._id === transaction.savingsAccountId?._id);
            return account?.name || 'Savings Account';
        }
        return 'Unknown Source';
    }, [wallets, savingsAccounts]);

    const getTypeIcon = useCallback((type) => {
        switch (type) {
            case 'income': return <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--fc-secondary)' }} />;
            case 'expense': return <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--fc-error)' }} />;
            case 'transfer': return <ArrowRightLeft className="w-4 h-4" style={{ color: 'var(--fc-primary)' }} />;
            default: return <div className="w-4 h-4" />;
        }
    }, []);

    const getTypeColor = useCallback((type) => {
        switch (type) {
            case 'income': return 'var(--fc-secondary)';
            case 'expense': return 'var(--fc-error)';
            case 'transfer': return 'var(--fc-primary)';
            default: return 'var(--fc-on-surface)';
        }
    }, []);

    const requestSort = useCallback((key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    const getSortIcon = useCallback((key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
    }, [sortConfig]);

    const handleItemsPerPageChange = useCallback((e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    }, []);

    const generatePageNumbers = useCallback(() => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    }, [currentPage, totalPages]);

    const isAllSelected = paginatedTransactions.length > 0 && 
        paginatedTransactions.every(t => selectedTransactions.includes(t._id));

    return (
        <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div 
                    className="relative flex-1 flex items-center rounded-full px-4 py-1.5"
                    style={{ 
                        backgroundColor: 'var(--fc-surface-container-high)',
                        border: '1px solid var(--fc-outline-variant)'
                    }}
                >
                    <Search className="mr-3 text-xl flex-shrink-0" style={{ color: 'var(--fc-on-surface-variant)' }} />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm w-full"
                        style={{ color: 'var(--fc-on-surface)' }}
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--fc-on-tertiary-container)' }}>Show:</span>
                    <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="h-10 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
                        style={{ 
                            backgroundColor: 'var(--fc-surface-container-low)',
                            border: '1px solid var(--fc-outline-variant)',
                            color: 'var(--fc-on-surface)'
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="text-sm mb-2" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                Showing {paginatedTransactions.length} of {filteredAndSortedTransactions.length} transactions
            </div>

            {/* Main Data Table Container */}
            <section 
                className="glass-card overflow-hidden min-h-[400px] flex flex-col"
                style={{ borderRadius: '2.5rem' }}
            >
                {isMobile ? (
                    <div className="space-y-4 p-6">
                        {paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map((transaction) => (
                                <div 
                                    key={transaction._id}
                                    className="p-4 transition-colors"
                                    style={{ 
                                        backgroundColor: 'var(--fc-surface-container)',
                                        borderRadius: '1rem',
                                        border: '1px solid var(--fc-outline-variant)'
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {bulkEditMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTransactions.includes(transaction._id)}
                                                    onChange={(e) => onSelectTransaction(transaction._id, e.target.checked)}
                                                    className="w-4 h-4 rounded"
                                                />
                                            )}
                                            <div 
                                                className="p-2 rounded-lg"
                                                style={{ backgroundColor: `${getTypeColor(transaction.type)}20` }}
                                            >
                                                {getTypeIcon(transaction.type)}
                                            </div>
                                            <div>
                                                <h4 className="font-medium truncate" style={{ color: 'var(--fc-on-surface)' }}>
                                                    {transaction.description || 'No description'}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(transaction.date)}
                                                </div>
                                                <div className="mt-1 text-sm" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                                                    {getSourceLabel(transaction)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-medium" style={{ color: getTypeColor(transaction.type) }}>
                                                {transaction.type === 'expense' ? '-' : '+'}
                                                {formatCurrency(transaction.amount)}
                                            </span>
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => onEdit(transaction)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                                                    style={{ 
                                                        backgroundColor: 'var(--fc-surface-container-high)',
                                                        color: 'var(--fc-on-surface-variant)'
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this transaction?')) {
                                                            onDelete(transaction._id);
                                                        }
                                                    }}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                                                    style={{ 
                                                        backgroundColor: 'var(--fc-error-container)',
                                                        color: 'var(--fc-error)'
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            /* Empty State */
                            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                                <div className="relative mb-8">
                                    <div 
                                        className="absolute inset-0 blur-3xl rounded-full scale-150"
                                        style={{ backgroundColor: 'rgba(182, 196, 255, 0.2)' }}
                                    />
                                    <div 
                                        className="relative w-32 h-32 flex items-center justify-center"
                                        style={{ 
                                            backgroundColor: 'var(--fc-surface-container-high)',
                                            borderRadius: '2.5rem',
                                            border: '1px solid var(--fc-outline-variant)'
                                        }}
                                    >
                                        <Receipt className="w-16 h-16" style={{ color: 'var(--fc-on-primary-container)' }} />
                                        <div 
                                            className="absolute -bottom-2 -right-2 w-12 h-12 flex items-center justify-center"
                                            style={{ 
                                                backgroundColor: 'var(--fc-surface-container-highest)',
                                                borderRadius: '1rem',
                                                border: '1px solid var(--fc-outline-variant)'
                                            }}
                                        >
                                            <X className="w-6 h-6" style={{ color: 'var(--fc-error)' }} />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-headline font-bold mb-3 tracking-tight" style={{ color: 'var(--fc-on-surface)' }}>
                                    No Transactions Found
                                </h3>
                                <p className="max-w-sm mb-10 text-sm leading-relaxed" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                                    We couldn't find any financial records matching your current filter criteria. Try adjusting your search or add a new entry.
                                </p>
                                <div className="flex space-x-4">
                                    <button 
                                        onClick={onAddTransaction}
                                        className="cta-gradient px-8 py-3.5 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95"
                                        style={{ boxShadow: '0 0 30px rgba(77, 118, 255, 0.2)' }}
                                    >
                                        Add First Transaction
                                    </button>
                                    <button 
                                        onClick={onImportCsv}
                                        className="px-8 py-3.5 rounded-2xl font-semibold border transition-colors hover:bg-surface-container-highest"
                                        style={{ 
                                            backgroundColor: 'rgba(34, 42, 61, 0.5)',
                                            color: 'var(--fc-on-surface)',
                                            border: '1px solid var(--fc-outline-variant)'
                                        }}
                                    >
                                        Import CSV Data
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div 
                            className="grid grid-cols-5 px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold"
                            style={{ 
                                backgroundColor: 'rgba(23, 31, 51, 0.5)',
                                color: 'var(--fc-on-tertiary-container)'
                            }}
                        >
                            <div className="cursor-pointer flex items-center gap-1" onClick={() => requestSort('date')}>
                                Date {getSortIcon('date')}
                            </div>
                            <div className="cursor-pointer flex items-center gap-1" onClick={() => requestSort('description')}>
                                Description {getSortIcon('description')}
                            </div>
                            <div className="cursor-pointer flex items-center gap-1" onClick={() => requestSort('type')}>
                                Source {getSortIcon('type')}
                            </div>
                            <div className="cursor-pointer flex items-center gap-1 text-right" onClick={() => requestSort('amount')}>
                                Amount {getSortIcon('amount')}
                            </div>
                            <div className="text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="flex-1">
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((transaction, index) => (
                                    <div
                                        key={transaction._id}
                                        className="grid grid-cols-5 px-10 py-4"
                                        style={{ 
                                            borderTop: index === 0 ? 'none' : '1px solid var(--fc-outline-variant)',
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        {/* Date */}
                                        <div className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                                            {bulkEditMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTransactions.includes(transaction._id)}
                                                    onChange={(e) => onSelectTransaction(transaction._id, e.target.checked)}
                                                    className="w-4 h-4 rounded mr-2"
                                                />
                                            )}
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(transaction.date)}
                                        </div>

                                        {/* Description */}
                                        <div className="flex items-center gap-2 sm:gap-3 max-w-[150px] sm:max-w-none">
                                            <div 
                                                className="p-1.5 sm:p-2 rounded-lg"
                                                style={{ backgroundColor: `${getTypeColor(transaction.type)}20` }}
                                            >
                                                {getTypeIcon(transaction.type)}
                                            </div>
                                            <span className="font-medium truncate text-xs sm:text-sm" style={{ color: 'var(--fc-on-surface)' }}>
                                                {transaction.description || 'No description'}
                                            </span>
                                        </div>

                                        {/* Source */}
                                        <div className="text-muted-foreground hidden md:flex items-center text-xs sm:text-sm" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                                            {getSourceLabel(transaction)}
                                        </div>

                                        {/* Amount */}
                                        <div className="font-medium whitespace-nowrap text-xs sm:text-sm text-right" style={{ color: getTypeColor(transaction.type) }}>
                                            {transaction.type === 'expense' ? '-' : '+'}
                                            {formatCurrency(transaction.amount)}
                                        </div>

                                        {/* Actions */}
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => onEdit(transaction)}
                                                    className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg transition-colors"
                                                    style={{ 
                                                        backgroundColor: 'var(--fc-surface-container-high)',
                                                        color: 'var(--fc-on-surface-variant)'
                                                    }}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this transaction?')) {
                                                            onDelete(transaction._id);
                                                        }
                                                    }}
                                                    className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg transition-colors"
                                                    style={{ 
                                                        backgroundColor: 'var(--fc-error-container)',
                                                        color: 'var(--fc-error)'
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* Empty State for Desktop */
                                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                                    <div className="relative mb-8">
                                        <div 
                                            className="absolute inset-0 blur-3xl rounded-full scale-150"
                                            style={{ backgroundColor: 'rgba(182, 196, 255, 0.2)' }}
                                        />
                                        <div 
                                            className="relative w-32 h-32 flex items-center justify-center"
                                            style={{ 
                                                backgroundColor: 'var(--fc-surface-container-high)',
                                                borderRadius: '2.5rem',
                                                border: '1px solid var(--fc-outline-variant)'
                                            }}
                                        >
                                            <Receipt className="w-16 h-16" style={{ color: 'var(--fc-on-primary-container)' }} />
                                            <div
                                                className="absolute -bottom-2 -right-2 w-12 h-12 flex items-center justify-center"
                                                style={{
                                                    backgroundColor: 'var(--fc-surface-container-highest)',
                                                    borderRadius: '1rem',
                                                    border: '1px solid var(--fc-outline-variant)'
                                                }}
                                            >
                                                <X className="w-6 h-6" style={{ color: 'var(--fc-error)' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-headline font-bold mb-3 tracking-tight" style={{ color: 'var(--fc-on-surface)' }}>
                                        No Transactions Found
                                    </h3>
                                    <p className="max-w-sm mb-10 text-sm leading-relaxed" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                                        We couldn't find any financial records matching your current filter criteria. Try adjusting your search or add a new entry.
                                    </p>
                                    <div className="flex space-x-4">
                                        <button 
                                            onClick={onAddTransaction}
                                            className="cta-gradient px-8 py-3.5 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95"
                                            style={{ boxShadow: '0 0 30px rgba(77, 118, 255, 0.2)' }}
                                        >
                                            Add First Transaction
                                        </button>
                                        <button 
                                            onClick={onImportCsv}
                                            className="px-8 py-3.5 rounded-2xl font-semibold border transition-colors hover:bg-surface-container-highest"
                                            style={{ 
                                                backgroundColor: 'rgba(34, 42, 61, 0.5)',
                                                color: 'var(--fc-on-surface)',
                                                border: '1px solid var(--fc-outline-variant)'
                                            }}
                                        >
                                            Import CSV Data
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 flex items-center justify-center rounded-lg transition-colors"
                        style={{ 
                            backgroundColor: currentPage === 1 ? 'var(--fc-surface-container-low)' : 'var(--fc-surface-container)',
                            border: '1px solid var(--fc-outline-variant)',
                            color: currentPage === 1 ? 'var(--fc-on-tertiary-container)' : 'var(--fc-on-surface)',
                            opacity: currentPage === 1 ? 0.5 : 1
                        }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {generatePageNumbers().map(pageNumber => (
                        <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className="h-8 w-8 p-0 flex items-center justify-center rounded-lg transition-colors text-sm font-medium"
                            style={{ 
                                backgroundColor: currentPage === pageNumber ? 'var(--fc-primary)' : 'var(--fc-surface-container)',
                                border: '1px solid var(--fc-outline-variant)',
                                color: currentPage === pageNumber ? 'var(--fc-on-primary)' : 'var(--fc-on-surface)'
                            }}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 flex items-center justify-center rounded-lg transition-colors"
                        style={{ 
                            backgroundColor: currentPage === totalPages ? 'var(--fc-surface-container-low)' : 'var(--fc-surface-container)',
                            border: '1px solid var(--fc-outline-variant)',
                            color: currentPage === totalPages ? 'var(--fc-on-tertiary-container)' : 'var(--fc-on-surface)',
                            opacity: currentPage === totalPages ? 0.5 : 1
                        }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(TransactionTable);
