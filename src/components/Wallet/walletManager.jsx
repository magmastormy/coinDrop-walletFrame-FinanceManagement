import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Loader2, Search, Bell, Settings, X } from 'lucide-react';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import ValidationUtils from '../../utils/validationUtils';
import { setWallets, setLoading, setError, updateWallet } from '../../slices/walletSlice';
import WalletList from './walletList';
import WalletBudgetList from './walletBudgetList';
import TransactionTable from '../Transaction/transactionTable';
import WalletChart from './walletCharts';
import CreateTransactionModal from '../Transaction/createTransactionModal';
import CreateNewWallet from './newWallet';
import LoadingState from '../ui/LoadingState';
import MaterialIcon from '../ui/MaterialIcon';
import useCurrencyFormatter from '../../hooks/useCurrencyFormatter';
import Button from '../ui/Button';

const WalletManager = () => {
    const dispatch = useDispatch();
    const { wallets, loading, error } = useSelector(state => state.wallet);
    const { user } = useSelector(state => state.auth);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [walletBudgets, setWalletBudgets] = useState([]);
    const [walletTransactions, setWalletTransactions] = useState([]);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    
    const formatCurrency = useCurrencyFormatter();

    useEffect(() => {
        if (user?.id) {
            fetchWallets();
        }
    }, [user]);

    const fetchWallets = async () => {
        dispatch(setLoading(true));
        try {
            if (!user?.id) {
                throw new Error('User not authenticated or missing user ID');
            }
            const walletdata = await walletService.getAllWallets(user.id);
            dispatch(setWallets(walletdata || []));
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const fetchWalletDetails = async (walletId) => {
        try {
            const [budgetData, transactionData] = await Promise.all([
                walletService.getWalletBudgets(walletId),
                transactionService.getUserTransactions(user.id, { walletId: walletId })
            ]);

            setWalletBudgets(budgetData || []);
            const txs = Array.isArray(transactionData?.transactions) ? transactionData.transactions : [];

            setWalletTransactions(txs);
        } catch (err) {
            logError('Error fetching wallet details:', err);
        }
    };

    const handleWalletSelect = async (wallet) => {
        setSelectedWallet(wallet);
        await fetchWalletDetails(wallet._id);
    };

    const handleDeleteWallet = async (walletId, transferToWalletId = null) => {
        try {
            dispatch(setLoading(true));
            const result = await walletService.deleteWallet(walletId, transferToWalletId);
            if (result.transferredAmount > 0) {
                logInfo(`Transferred $${result.transferredAmount}`);
            }
            await fetchWallets();
            if (selectedWallet?._id === walletId) {
                setSelectedWallet(null);
            }
        } catch (err) {
            logError('Error deleting wallet:', err);
            dispatch(setError(err.response?.data?.error || err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleWalletUpdate = async (walletId, updatedData) => {
        // Guard against undefined walletId (happens when called from wallet creation)
        if (!walletId) {
            logInfo('handleWalletUpdate called with undefined walletId, refreshing wallets instead');
            await fetchWallets();
            return;
        }

        // Validate walletId format
        if (typeof walletId !== 'string' && typeof walletId !== 'number') {
            logError('Invalid walletId format:', walletId);
            return;
        }

        try {
            dispatch(setLoading(true));
            const result = await walletService.updateWallet(walletId, updatedData);
            
            // Update local state if the updated wallet is currently selected
            if (selectedWallet?._id === walletId) {
                setSelectedWallet(result);
            }
            
            toast.success('Wallet updated successfully');
        } catch (err) {
            logError('Error updating wallet:', err);
            toast.error('Failed to update wallet');
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleTransfer = async (fromWalletId, toWalletId, amount) => {
        // Validate inputs
        const fromWalletValidation = ValidationUtils.validateId(fromWalletId, 'Source wallet');
        const toWalletValidation = ValidationUtils.validateId(toWalletId, 'Destination wallet');
        const amountValidation = ValidationUtils.validateAmount(amount, false);
        
        if (!fromWalletValidation.isValid) {
            dispatch(setError(fromWalletValidation.error));
            return;
        }
        
        if (!toWalletValidation.isValid) {
            dispatch(setError(toWalletValidation.error));
            return;
        }
        
        if (!amountValidation.isValid) {
            dispatch(setError(amountValidation.error));
            return;
        }
        
        // Check if source and destination are different
        if (fromWalletId === toWalletId) {
            dispatch(setError('Source and destination wallets must be different'));
            return;
        }

        try {
            dispatch(setLoading(true));
            await ValidationUtils.withTimeout(
                ValidationUtils.withRetry(
                    () => walletService.transferBetweenWallets(fromWalletId, toWalletId, parseFloat(amount)),
                    'transferBetweenWallets',
                    3,
                    1000
                ),
                30000
            );
            await fetchWallets();
            if (selectedWallet) {
                fetchWalletDetails(selectedWallet._id);
            }
        } catch (err) {
            dispatch(setError(err.response?.data?.error || err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleTransactionUpdate = async () => {
        if (selectedWallet) {
            await fetchWalletDetails(selectedWallet._id);
            await fetchWallets(); // Update wallet balances
        }
    };

    // Filter wallets based on search query
    const filteredWallets = useMemo(() => {
        if (!searchQuery.trim()) return wallets;
        
        const query = searchQuery.toLowerCase().trim();
        return wallets.filter(wallet => {
            const nameMatch = wallet.name?.toLowerCase().includes(query);
            const typeMatch = wallet.type?.toLowerCase().includes(query);
            return nameMatch || typeMatch;
        });
    }, [wallets, searchQuery]);

    // Calculate total balance of filtered wallets
    const totalBalance = filteredWallets?.reduce((sum, wallet) => sum + (wallet?.balance || 0), 0) || 0;

    if (loading && !wallets.length) {
        return <LoadingState loading={loading} height="md" />;
    }

    if (error) {
        return (
            <div className="p-4 bg-error/10 text-error rounded-lg border border-error/20">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface text-on-surface">
            {/* Load Material Symbols font */}
            <link 
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
                rel="stylesheet" 
            />
            
            {/* TopAppBar */}
            {!selectedWallet && (
                <header className="flex justify-between items-center px-8 w-full sticky top-0 z-40 bg-surface h-16 font-headline antialiased border-b border-outline-variant/10">
                    <div className="flex items-center gap-6">
                        <span className="text-xl font-bold tracking-tight text-primary-fixed-dim">Financial Curator</span>
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-tertiary-container text-sm w-4 h-4 pointer-events-none" />
                            <input 
                                className="bg-surface-container-low border-none rounded-full py-1.5 pl-10 pr-10 text-sm focus:ring-1 focus:ring-primary w-64 text-on-surface placeholder-on-tertiary-container/50 transition-all" 
                                placeholder="Search wallets..." 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-tertiary-container hover:text-on-surface transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button 
                        variant="ghost"
                        className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"
                    >
                        <Bell className="w-5 h-5" />
                    </Button>
                    <Button 
                        variant="ghost"
                        className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                        <div className="w-8 h-8 rounded-full overflow-hidden ml-2 ring-1 ring-outline-variant/20">
                            <img 
                                alt="User profile avatar" 
                                src={user?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name || 'User') + "&background=random"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>
            )}

            <main className="p-8 max-w-7xl mx-auto space-y-12">
                {!selectedWallet ? (
                    <>
                        {/* Hero Section: Total Balance */}
                        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-2">
                                <p className="text-on-tertiary-container font-medium tracking-wide uppercase text-xs">
                                    {searchQuery ? 'Filtered Assets' : 'Consolidated Assets'}
                                </p>
                                <div className="flex items-baseline gap-4">
                                    <h2 className="text-6xl font-extrabold font-headline tracking-tight text-on-surface">
                                        {formatCurrencyHook(totalBalance)}
                                    </h2>
                                    {!searchQuery && (
                                        <span className="bg-secondary/10 text-secondary text-sm px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                                            <MaterialIcon name="trending_up" className="text-xs" />
                                            2.4%
                                        </span>
                                    )}
                                    {searchQuery && (
                                        <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-semibold">
                                            {filteredWallets.length} of {wallets.length} wallets
                                        </span>
                                    )}
                                </div>
                            </div>
                            <CreateNewWallet 
                                onWalletCreated={fetchWallets}
                                triggerButton={
                                    <Button className="px-8 py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                                        <MaterialIcon name="add_card" className="text-xl" />
                                        Add Wallet
                                    </Button>
                                }
                            />
                        </section>

                        {/* Wallets Grid */}
                        <WalletList 
                            wallets={filteredWallets}
                            allWallets={wallets}
                            onWalletSelect={handleWalletSelect}
                            onWalletUpdate={handleWalletUpdate}
                            onWalletDelete={handleDeleteWallet}
                            onTransfer={handleTransfer}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            searchQuery={searchQuery}
                        />

                        {/* Wallet Balances Chart - only show when not searching */}
                        {!searchQuery && <WalletChart wallets={wallets} />}
                    </>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedWallet(null)}
                                className="gap-2 pl-0 hover:pl-2 transition-all text-on-surface hover:text-primary"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Wallets
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <MaterialIcon name="account_balance_wallet" filled className="text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-bold text-on-surface">{selectedWallet.name}</h2>
                                <p className="text-on-tertiary-container text-sm">{formatCurrencyHook(selectedWallet.balance)}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="border border-outline-variant/10 rounded-lg bg-surface-container p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-on-surface">Transactions</h3>
                                </div>
                                <TransactionTable
                                    transactions={walletTransactions}
                                    wallets={wallets}
                                    onEdit={(t) => {
                                        setEditingTransaction(t);
                                        setIsTransactionModalOpen(true);
                                    }}
                                    onDelete={async (id) => {
                                        await transactionService.deleteTransaction(id);
                                        handleTransactionUpdate();
                                    }}
                                />
                            </div>
                            <div className="border border-outline-variant/10 rounded-lg bg-surface-container p-6">
                                <h3 className="text-base font-bold mb-3 text-on-surface">Budget Overview</h3>
                                <WalletBudgetList budgets={walletBudgets} />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Decorative background elements */}
            <div className="fixed top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

            <CreateTransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => {
                    setIsTransactionModalOpen(false);
                    setEditingTransaction(null);
                }}
                onTransactionCreated={handleTransactionUpdate}
                initialData={editingTransaction}
                wallets={wallets}
            />
        </div>
    );
};

export default WalletManager;
