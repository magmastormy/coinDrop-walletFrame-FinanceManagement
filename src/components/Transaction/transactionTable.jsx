import React, { useState, useMemo } from 'react';
import {
    Edit2, Trash2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft,
    Calendar, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

const TransactionTable = ({ transactions = [], onEdit, onDelete, wallets = [], savingsAccounts = [] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 10;

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.amount?.toString().includes(searchTerm)
        );
    }, [transactions, searchTerm]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
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

    const getSourceLabel = (transaction) => {
        if (transaction.walletId) {
            const wallet = wallets.find(w => w._id === transaction.walletId || w._id === transaction.walletId?._id);
            return wallet?.name || 'Unknown Wallet';
        }
        if (transaction.savingsAccountId) {
            const account = savingsAccounts.find(s => s._id === transaction.savingsAccountId || s._id === transaction.savingsAccountId?._id);
            return account?.name || 'Savings Account';
        }
        return 'Unknown Source';
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'income': return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
            case 'expense': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
            case 'transfer': return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
            default: return <div className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedTransactions.length} of {filteredTransactions.length}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-white/5 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Description</th>
                            <th className="px-6 py-4 font-medium">Source</th>
                            <th className="px-6 py-4 font-medium">Amount</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map((transaction) => (
                                <tr
                                    key={transaction._id}
                                    className="hover:bg-white/5 transition-colors group"
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
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {getSourceLabel(transaction)}
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
                                                onClick={() => onEdit(transaction)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this transaction?')) {
                                                        onDelete(transaction._id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
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
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default TransactionTable;
