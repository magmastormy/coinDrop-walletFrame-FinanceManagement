import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
    const isExpense = transaction.type === 'expense';
    const amountColor = isExpense ? 'text-red-500' : 'text-emerald-500';
    const Icon = isExpense ? ArrowDownLeft : ArrowUpRight;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatAmount = (amount, type) => {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Math.abs(amount));
        return type === 'expense' ? `-${formattedAmount}` : `+${formattedAmount}`;
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="group relative flex items-center justify-between p-4 mb-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-full bg-white/5", amountColor)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-medium text-foreground">{transaction.description || 'No Description'}</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className={cn("font-bold", amountColor)}>
                    {formatAmount(transaction.amount, transaction.type)}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onEdit(transaction)}
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this transaction?')) {
                                    onDelete(transaction._id);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

TransactionCard.propTypes = {
    transaction: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        description: PropTypes.string,
        amount: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired
    }).isRequired,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func
};

export default TransactionCard;