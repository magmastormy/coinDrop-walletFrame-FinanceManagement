import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/authContext';
import { useTheme } from '../../theme/ThemeContext';
import SavingsAccountCard from './savingsAccountCard';
import SavingsOperations from './SavingsOperations';
import SavingsAccountEditDialog from './savingsAccountEditDialog';
import { SavingsAccountTransferDialog } from './savingsAccountTransferDialog';
import SavingsAccountTransactionTable from './savingsAccountTransactionTable';
import SavingsAnalytics from './SavingsAnalytics';
import savingsAccountService from '../../services/savingsAccountService';
import walletService from '../../services/walletService';
import { motion, AnimatePresence } from 'framer-motion';
import ReportSection from '../Common/ReportSection';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';

const SavingsAccountManager = () => {
    const { user } = useAuth();
    const { theme, isDarkMode } = useTheme();
    const [accounts, setAccounts] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactionAmount, setTransactionAmount] = useState(0);
    const [selectedWallet, setSelectedWallet] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createAccountOpen, setCreateAccountOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [transferWalletId, setTransferWalletId] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const [modalState, setModalState] = useState({
        deposit: { open: false },
        withdraw: { open: false },
        edit: { open: false },
        transfer: { open: false }
    });

    useEffect(() => {
        if (user?.id) {
            fetchAccounts();
            fetchWallets();
        }
    }, [user]);

    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const response = await savingsAccountService.getUserSavingsAccounts(user.id);
            setAccounts(response || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            setError('Failed to load savings accounts. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWallets = async () => {
        try {
            const response = await walletService.getAllWallets(user.id);
            setWallets(response || []);
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
            setError('Failed to load wallets. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = () => {
        setCreateAccountOpen(true);
    };

    const handleDeposit = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            deposit: { open: true }
        }));
    };

    const handleWithdraw = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            withdraw: { open: true }
        }));
    };

    const handleEdit = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            edit: { open: true }
        }));
    };

    const handleTransfer = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            transfer: { open: true }
        }));
    };

    const handleDelete = (accountId) => {
        const account = accounts.find(acc => acc._id === accountId);
        setAccountToDelete(account);

        setTransferWalletId(wallets.length > 0 ? wallets[0]._id : '');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;
        try {
            setIsDeleting(true);
            setDeleteError('');
            const hasBalance = accountToDelete.balance > 0;
            if (hasBalance && !transferWalletId) {
                setDeleteError('Please select a wallet to transfer the remaining balance');
                setIsDeleting(false);
                return;
            }
            const walletIdToUse = hasBalance ? transferWalletId : null;
            try {
                const result = await savingsAccountService.deleteSavingsAccount(
                    accountToDelete._id,
                    walletIdToUse
                );
                if (result.success) {
                    setAccounts(prevAccounts => prevAccounts.filter(account => account._id !== accountToDelete._id));
                    if (result.transferredAmount > 0) {
                        await fetchWallets();
                    }
                    setDeleteModalOpen(false);
                    setAccountToDelete(null);
                    setTransferWalletId('');
                    setDeleteError('');
                } else {
                    setDeleteError(result.message || 'Failed to delete account');
                }
            } catch (error) {
                let errorMessage = error.message || error.details || 'Failed to delete the account.';
                if (error.statusCode === 404) {
                    errorMessage = 'Account not found or already deleted';
                    setAccounts(prevAccounts => prevAccounts.filter(account => account._id !== accountToDelete._id));
                } else if (error.statusCode === 400) {
                    errorMessage = 'Invalid account or wallet ID format';
                }
                setDeleteError(errorMessage);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTransaction = async (type, accountId, amount, walletId) => {
        try {
            if (type === 'deposit') {
                await savingsAccountService.depositToSavings({
                    accountId,
                    walletId,
                    amount: Number(amount)
                });
            } else {
                await savingsAccountService.withdrawFromSavings({
                    accountId,
                    walletId,
                    amount: Number(amount)
                });
            }

            await Promise.all([fetchAccounts(), fetchWallets()]);
            setModalState(prev => ({
                ...prev,
                [type]: { open: false }
            }));
        } catch (error) {
            console.error('Transaction failed:', error);
            setError('Transaction failed. Please try again later.');
        }
    };

    const handleCardSelect = (accountId) => {
        setSelectedAccount(prev => prev === accountId ? null : accountId);
    };

    const renderDeleteModal = () => {
        if (!accountToDelete) return null;

        return (
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Savings Account"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Are you sure you want to delete the savings account &quot;{accountToDelete.name}&quot;?
                    </p>

                    {accountToDelete.balance > 0 && (
                        <>
                            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 text-sm border border-amber-500/20">
                                This account has a balance of ${accountToDelete.balance.toFixed(2)}.
                                Please select a wallet to transfer this amount to:
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Transfer Balance to Wallet</label>
                                <select
                                    value={transferWalletId}
                                    onChange={(e) => setTransferWalletId(e.target.value)}
                                    required
                                    className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                                >
                                    <option value="">Select a wallet</option>
                                    {wallets.map(wallet => (
                                        <option key={wallet._id} value={wallet._id}>
                                            {wallet.name} (${wallet.balance.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {deleteError && (
                        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm border border-red-500/20">
                            {deleteError}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting || (accountToDelete.balance > 0 && !transferWalletId)}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            <ReportSection
                title="Savings Accounts Report"
                accountId={selectedAccount || user?.id}
                reportType="savings-report"
            />

            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-foreground">
                    Your Savings Accounts
                </h2>
                <Button
                    onClick={handleCreateAccount}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" /> Create Account
                </Button>
            </div>

            <SavingsAnalytics accounts={accounts} />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 2xl:grid-cols-3 items-stretch">
                <AnimatePresence>
                    {accounts.map(account => (
                        <motion.div
                            key={account._id}
                            className="h-full"
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <SavingsAccountCard
                                account={account}
                                onDeposit={handleDeposit}
                                onWithdraw={handleWithdraw}
                                onEdit={handleEdit}
                                onTransfer={handleTransfer}
                                onDelete={handleDelete}
                                onSelect={handleCardSelect}
                                isSelected={selectedAccount === account._id}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedAccount && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <SavingsAccountTransactionTable
                            accountId={selectedAccount}
                            wallets={wallets}
                            savingsAccounts={accounts}
                            budgets={[]}
                            categories={[]}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <SavingsOperations
                modalState={modalState}
                setModalState={setModalState}
                handleTransaction={handleTransaction}
                selectedAccount={selectedAccount}
                transactionAmount={transactionAmount}
                setTransactionAmount={setTransactionAmount}
                wallets={wallets}
                selectedWallet={selectedWallet}
                setSelectedWallet={setSelectedWallet}
            />

            <SavingsAccountEditDialog
                open={modalState.edit.open}
                account={accounts.find(a => a._id === selectedAccount)}
                onClose={() => setModalState(prev => ({ ...prev, edit: { open: false } }))}
                onSave={async (updatedAccount) => {
                    try {
                        await savingsAccountService.updateSavingsAccount(selectedAccount, updatedAccount);
                        await fetchAccounts();
                        setModalState(prev => ({ ...prev, edit: { open: false } }));
                    } catch (error) {
                        console.error('Failed to update account:', error);
                        setError('Failed to update the account. Please try again later.');
                    }
                }}
            />

            <SavingsAccountTransferDialog
                open={modalState.transfer.open}
                accounts={accounts.filter(a => a._id !== selectedAccount)}
                sourceAccount={accounts.find(a => a._id === selectedAccount)}
                onClose={() => setModalState(prev => ({ ...prev, transfer: { open: false } }))}
                onTransfer={async (targetAccountId, amount) => {
                    try {
                        await savingsAccountService.transferBetweenSavings({
                            fromAccountId: selectedAccount,
                            toAccountId: targetAccountId,
                            amount: Number(amount)
                        });

                        await fetchAccounts();
                        setModalState(prev => ({ ...prev, transfer: { open: false } }));
                    } catch (error) {
                        console.error('Transfer failed:', error);
                        setError('Transfer failed. Please try again later.');
                    }
                }}
            />

            <SavingsAccountEditDialog
                open={createAccountOpen}
                account={null}
                onClose={() => setCreateAccountOpen(false)}
                onSave={async (newAccount) => {
                    try {
                        await savingsAccountService.createSavingsAccount(newAccount);
                        await fetchAccounts();
                        setCreateAccountOpen(false);
                    } catch (error) {
                        console.error('Failed to create account:', error);
                        setError('Failed to create the account. Please try again later.');
                    }
                }}
                isNewAccount={true}
            />

            {renderDeleteModal()}
        </div>
    );
};

export default SavingsAccountManager;

