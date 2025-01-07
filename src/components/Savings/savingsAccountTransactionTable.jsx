import React, { useState } from 'react';
import EditTransactionModal from './editTransactionModal';
import './styles/savingsManagerStyles.css';

const SavingsAccountTransactionTable = ({ transactions, onUpdateTransaction }) => {
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    const handleEditClick = (transaction) => {
        setSelectedTransaction(transaction);
        setEditModalOpen(true);
    };

    const handleUpdateTransaction = (updatedTransaction) => {
        onUpdateTransaction(updatedTransaction);
        setEditModalOpen(false);
    };

    return (
        <>
            <table className="savings-account-transaction-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction._id}>
                            <td>{new Date(transaction.date).toLocaleDateString()}</td>
                            <td>${transaction.amount.toFixed(2)}</td>
                            <td>{transaction.type}</td>
                            <td>{transaction.description}</td>
                            <td>
                                <button onClick={() => handleEditClick(transaction)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                transaction={selectedTransaction}
                onUpdate={handleUpdateTransaction}
            />
        </>
    );
};

export default SavingsAccountTransactionTable;