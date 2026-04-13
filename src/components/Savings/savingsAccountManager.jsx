import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useState, useEffect } from 'react';
import { Plus, Repeat, Target, TrendingUp, Brain, Calendar, PiggyBank } from 'lucide-react';
import { useAuth } from '../../contexts/authContext';
import SavingsAccountCard from './savingsAccountCard';
import SavingsOperations from './SavingsOperations';
import SavingsAccountEditDialog from './savingsAccountEditDialog';
import { SavingsAccountTransferDialog } from './savingsAccountTransferDialog';
import SavingsAccountTransactionTable from './savingsAccountTransactionTable';
import SavingsAnalytics from './SavingsAnalytics';
import AutomatedSavingsRules from './AutomatedSavingsRules';
import savingsAccountService from '../../services/savingsAccountService';
import savingsGoalService from '../../services/savingsGoalService';
import savingsRuleService from '../../services/savingsRuleService';
import walletService from '../../services/walletService';
import { motion, AnimatePresence } from 'framer-motion';
import ReportSection from '../Common/ReportSection';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { toast } from 'react-toastify';
import PageHeader from '../Common/PageHeader';

const SavingsAccountManager = () => {
    const { user } = useAuth();
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
    const [goals, setGoals] = useState([]);
    const [activeTab, setActiveTab] = useState('accounts');
    const [autoTransferEnabled, setAutoTransferEnabled] = useState(false);
    const [savingsRulesEnabled, setSavingsRulesEnabled] = useState(false);
    const [goalBasedSavingsEnabled, setGoalBasedSavingsEnabled] = useState(false);

    const [modalState, setModalState] = useState({
        deposit: { open: false },
        withdraw: { open: false },
        edit: { open: false },
        transfer: { open: false },
        autoTransfer: { open: false }
    });

    const [autoTransferForm, setAutoTransferForm] = useState({
        sourceWalletId: '',
        targetAccountId: '',
        amount: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (user?.id) {
            fetchAccounts();
            fetchWallets();
            fetchGoals();
        }
    }, [user]);

    // Cleanup effect for memory management
    useEffect(() => {
        return () => {
            // Cancel any ongoing operations when component unmounts
            setError(null);
            setIsLoading(false);
        };
    }, []);

    const fetchAccounts = async () => {
        if (!user?.id) return;
        
        // Set loading state at the beginning
        setIsLoading(true);
        
        try {
            const response = await savingsAccountService.getUserSavingsAccounts(user.id);
            setAccounts(response || []);
        } catch (error) {
            logError('Failed to fetch accounts:', error);
            setError('Failed to load savings accounts. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWallets = async () => {
        // Don't set loading state here - let the main fetch handle it
        try {
            if (!user || !user.id) {
                throw new Error('User not authenticated');
            }
            const response = await walletService.getAllWallets(user.id);
            setWallets(response || []);
        } catch (error) {
            logError('Failed to fetch wallets:', error);
            setError('Failed to load wallets. Please try again later.');
        }
    };

    const fetchGoals = async () => {
        try {
            const response = await savingsGoalService.getSavingsGoals();
            setGoals(response || []);
        } catch (error) {
            logError('Failed to fetch savings goals:', error);
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
            logError('Transaction failed:', error);
            setError('Transaction failed. Please try again later.');
        }
    };

    const handleCardSelect = (accountId) => {
        setSelectedAccount(prev => prev === accountId ? null : accountId);
    };

    const handleSetupAutoTransfer = async () => {
        try {
            setIsLoading(true);
            await savingsAccountService.setupAutomaticSavings(user.id, autoTransferForm);
            toast.success('Auto-transfer setup successfully');
            setModalState(prev => ({ ...prev, autoTransfer: { open: false } }));
            setAutoTransferForm({
                sourceWalletId: '',
                targetAccountId: '',
                amount: '',
                frequency: 'monthly',
                startDate: new Date().toISOString().split('T')[0]
            });
            fetchAccounts();
        } catch (error) {
            logError('Failed to setup auto-transfer:', error);
            toast.error('Failed to setup auto-transfer. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteSavingsRules = async () => {
        try {
            setIsLoading(true);
            const result = await savingsRuleService.executeRules({ userId: user.id });
            toast.success(`Savings rules executed: ${result.executedRules || 0} rules applied`);
            fetchAccounts();
            fetchGoals();
        } catch (error) {
            logError('Failed to execute savings rules:', error);
            toast.error('Failed to execute savings rules. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateGoalProgress = async () => {
        try {
            setIsLoading(true);
            // Update all goals progress
            for (const goal of goals) {
                if (goal.savingsAccountId) {
                    const account = accounts.find(a => a._id === goal.savingsAccountId);
                    if (account) {
                        await savingsGoalService.updateSavingsGoal(goal._id, {
                            currentAmount: account.balance
                        });
                    }
                }
            }
            toast.success('Savings goal progress updated successfully');
            fetchGoals();
        } catch (error) {
            logError('Failed to update goal progress:', error);
            toast.error('Failed to update goal progress. Please try again later.');
        } finally {
            setIsLoading(false);
        }
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
                                    style={{
                                        width: '100%',
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

                    <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} className="space-y-8 pb-8">
            <PageHeader
                title="Savings"
                actions={(
                    <div className="flex items-center gap-2">
                        <ReportSection
                            title="Savings Accounts Report"
                            accountId={selectedAccount || user?.id}
                            reportType="savings-report"
                        />
                        {activeTab === 'accounts' && (
                            <Button
                                onClick={handleCreateAccount}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" strokeWidth={1.5} /> Create Account
                            </Button>
                        )}
                    </div>
                )}
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'accounts'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Accounts
                </button>
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'goals'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Goals
                </button>
                <button
                    onClick={() => setActiveTab('automation')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'automation'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Automation
                </button>
            </div>

            {/* Content based on active tab */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 'accounts' && (
                    <>
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
                </>
            )}

            {activeTab === 'goals' && (
                <div className="space-y-6">
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-surface-1)',
                            padding: '24px',
                        }}
                    >
                        <h3 className="text-xl font-bold mb-4">Savings Goals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goals.map(goal => (
                                <div key={goal._id} className="p-4 rounded-lg bg-background border border-border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium">{goal.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Target: ${goal.targetAmount.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Current: ${(goal.currentAmount || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">
                                                {Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100)}% Complete
                                            </div>
                                            <div className="w-24 h-2 bg-muted rounded-full mt-1">
                                                <div 
                                                    className="h-full bg-primary rounded-full" 
                                                    style={{ width: `${Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            className="mt-6 gap-2"
                            onClick={handleUpdateGoalProgress}
                            disabled={isLoading}
                        >
                            <Target className="w-4 h-4" />
                            Update Goal Progress
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'automation' && (
                <div className="space-y-6">
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-surface-1)',
                            padding: '24px',
                        }}
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary" />
                            Savings Automation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Auto-Transfers */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }} />
                                    <div>
                                        <h4 className="font-medium">Auto-Transfers</h4>
                                        <p className="text-sm text-muted-foreground">Automatically transfer funds to savings</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        onClick={() => setModalState(prev => ({ ...prev, autoTransfer: { open: true } }))}
                                        disabled={isLoading}
                                        className="gap-1"
                                    >
                                        <Calendar className="w-3 h-3" />
                                        Setup
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setAutoTransferEnabled(v => !v)}
                                        aria-pressed={autoTransferEnabled}
                                        aria-label={autoTransferEnabled ? 'Disable auto-transfers' : 'Enable auto-transfers'}
                                        style={{
                                            width: '44px',
                                            height: '24px',
                                            borderRadius: '9999px',
                                            border: '1px solid var(--color-border)',
                                            background: autoTransferEnabled ? 'rgba(255, 209, 102, 0.35)' : 'var(--color-surface-2)',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'background 150ms ease',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                position: 'absolute',
                                                top: '2px',
                                                left: autoTransferEnabled ? '22px' : '2px',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '9999px',
                                                background: autoTransferEnabled ? 'var(--color-gold)' : 'var(--color-surface-3)',
                                                border: '1px solid var(--color-border)',
                                                transition: 'left 150ms ease',
                                            }}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Savings Rules */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                                <div className="flex items-center gap-3">
                                    <PiggyBank className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }} />
                                    <div>
                                        <h4 className="font-medium">Savings Rules</h4>
                                        <p className="text-sm text-muted-foreground">Round-up and percentage rules</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        onClick={handleExecuteSavingsRules}
                                        disabled={isLoading}
                                        className="gap-1"
                                    >
                                        <PiggyBank className="w-3 h-3" />
                                        Execute
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setSavingsRulesEnabled(v => !v)}
                                        aria-pressed={savingsRulesEnabled}
                                        aria-label={savingsRulesEnabled ? 'Disable savings rules' : 'Enable savings rules'}
                                        style={{
                                            width: '44px',
                                            height: '24px',
                                            borderRadius: '9999px',
                                            border: '1px solid var(--color-border)',
                                            background: savingsRulesEnabled ? 'rgba(255, 209, 102, 0.35)' : 'var(--color-surface-2)',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'background 150ms ease',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                position: 'absolute',
                                                top: '2px',
                                                left: savingsRulesEnabled ? '22px' : '2px',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '9999px',
                                                background: savingsRulesEnabled ? 'var(--color-gold)' : 'var(--color-surface-3)',
                                                border: '1px solid var(--color-border)',
                                                transition: 'left 150ms ease',
                                            }}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Goal-Based Savings */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }} />
                                    <div>
                                        <h4 className="font-medium">Goal-Based Savings</h4>
                                        <p className="text-sm text-muted-foreground">Automatically save for goals</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        onClick={handleUpdateGoalProgress}
                                        disabled={isLoading}
                                        className="gap-1"
                                    >
                                        <Target className="w-3 h-3" />
                                        Update
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setGoalBasedSavingsEnabled(v => !v)}
                                        aria-pressed={goalBasedSavingsEnabled}
                                        aria-label={goalBasedSavingsEnabled ? 'Disable goal-based savings' : 'Enable goal-based savings'}
                                        style={{
                                            width: '44px',
                                            height: '24px',
                                            borderRadius: '9999px',
                                            border: '1px solid var(--color-border)',
                                            background: goalBasedSavingsEnabled ? 'rgba(255, 209, 102, 0.35)' : 'var(--color-surface-2)',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'background 150ms ease',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                position: 'absolute',
                                                top: '2px',
                                                left: goalBasedSavingsEnabled ? '22px' : '2px',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '9999px',
                                                background: goalBasedSavingsEnabled ? 'var(--color-gold)' : 'var(--color-surface-3)',
                                                border: '1px solid var(--color-border)',
                                                transition: 'left 150ms ease',
                                            }}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h4 className="font-medium mb-4">Automated Savings Rules</h4>
                            <AutomatedSavingsRules 
                                goalId={goals.length > 0 ? goals[0]._id : null}
                                onRuleChange={fetchAccounts}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Close the content div */}
            </div>

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
                        logError('Failed to update account:', error);
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
                        logError('Transfer failed:', error);
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
                        logError('Failed to create account:', error);
                        setError('Failed to create the account. Please try again later.');
                    }
                }}
                isNewAccount={true}
            />

            {renderDeleteModal()}

            {/* Auto-Transfer Setup Modal */}
            <Modal
                isOpen={modalState.autoTransfer.open}
                onClose={() => setModalState(prev => ({ ...prev, autoTransfer: { open: false } }))}
                title="Setup Auto-Transfer"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Source Wallet</label>
                        <select
                            value={autoTransferForm.sourceWalletId}
                            onChange={(e) => setAutoTransferForm(prev => ({ ...prev, sourceWalletId: e.target.value }))}
                            style={{
                                width: '100%',
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
                            <option value="">Select a wallet</option>
                            {wallets.map(wallet => (
                                <option key={wallet._id} value={wallet._id}>
                                    {wallet.name} (${wallet.balance.toFixed(2)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Target Savings Account</label>
                        <select
                            value={autoTransferForm.targetAccountId}
                            onChange={(e) => setAutoTransferForm(prev => ({ ...prev, targetAccountId: e.target.value }))}
                            style={{
                                width: '100%',
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
                            <option value="">Select a savings account</option>
                            {accounts.map(account => (
                                <option key={account._id} value={account._id}>
                                    {account.name} (${account.balance.toFixed(2)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Amount</label>
                        <input
                            type="number"
                            placeholder="Enter amount"
                            value={autoTransferForm.amount}
                            onChange={(e) => setAutoTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                            style={{
                                width: '100%',
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
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                        <select
                            value={autoTransferForm.frequency}
                            onChange={(e) => setAutoTransferForm(prev => ({ ...prev, frequency: e.target.value }))}
                            style={{
                                width: '100%',
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
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                        <input
                            type="date"
                            value={autoTransferForm.startDate}
                            onChange={(e) => setAutoTransferForm(prev => ({ ...prev, startDate: e.target.value }))}
                            style={{
                                width: '100%',
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
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <Button
                            variant="ghost"
                            onClick={() => setModalState(prev => ({ ...prev, autoTransfer: { open: false } }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSetupAutoTransfer}
                            disabled={isLoading || !autoTransferForm.sourceWalletId || !autoTransferForm.targetAccountId || !autoTransferForm.amount}
                        >
                            {isLoading ? 'Setting up...' : 'Setup Auto-Transfer'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SavingsAccountManager;

