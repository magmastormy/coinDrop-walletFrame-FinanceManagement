import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { setSavingsAccount, setLoading, setError } from '../../slices/savingsAccountSlice';
import { savingsAccountService } from '../../services/savingsAccountService';
import SavingsCard from './savingsCard';
import TransferDialog from './TransferDialog';
import SavingsGoalList from './savingsGoalList';
import SavingGoalManager from './savingsGoalManager';
import './styles/savingsManagerStyles.css';

const SavingsManager = () => {
    const dispatch = useDispatch();
    const { account, loading, error } = useSelector((state) => state.savingsAccount);
    const { user } = useSelector((state) => state.auth);
    const [showTransferDialog, setShowTransferDialog] = useState(false);

    useEffect(() => {
        const fetchSavingsAccount = async () => {
            try {
                dispatch(setLoading(true));
                const data = await savingsAccountService.getSavingsAccount(user._id);
                dispatch(setSavingsAccount(data));
            } catch (err) {
                dispatch(setError(err.message));
            }
        };

        if (user) {
            fetchSavingsAccount();
        }
    }, [dispatch, user]);

    const handleTransfer = () => {
        setShowTransferDialog(true);
    };

    const handleTransferComplete = () => {
        setShowTransferDialog(false);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <motion.div 
            className="savings-manager-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="savings-header">
                <h2>Savings Account</h2>
            </div>
            
            {account ? (
                <>
                    <SavingsCard 
                        account={account}
                        onTransfer={handleTransfer}
                    />
                    <SavingsGoalList />
                </>
            ) : (
                <div>No savings account found.</div>
            )}

            {showTransferDialog && (
                <TransferDialog
                    open={showTransferDialog}
                    onClose={() => setShowTransferDialog(false)}
                    onComplete={handleTransferComplete}
                />
            )}
        </motion.div>
    );
};

export default SavingsManager;
