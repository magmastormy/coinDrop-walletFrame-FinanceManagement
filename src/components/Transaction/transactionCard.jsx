import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Button from '../ui/Button';
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
        <Card 
            variant="default" 
            elevation={1}
            className="group p-3"
            hover={true}
        >
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-1.5 rounded-full border", 
                        amountColor,
                        isExpense ? "border-error/20 bg-error/10" : "border-success/20 bg-success/10"
                    )}>
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-primary">
                            {transaction.description || 'No Description'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={cn(
                        "font-bold",
                        isExpense ? "text-error" : "text-success"
                    )}>
                        {formatAmount(transaction.amount, transaction.type)}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => onEdit(transaction)}
                            >
                                <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 text-error hover:text-error hover:bg-error/10"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this transaction?')) {
                                        onDelete(transaction._id);
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </Card>
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
