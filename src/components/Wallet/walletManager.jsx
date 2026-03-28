import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Loader2, Search, Bell, Settings, X } from 'lucide-react';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import { setWallets, setLoading, setError, updateWallet } from '../../slices/walletSlice';
import WalletList from './walletList';
import WalletBudgetList from './walletBudgetList';
import TransactionTable from '../Transaction/transactionTable';
import WalletChart from './walletCharts';
import CreateTransactionModal from '../Transaction/createTransactionModal';
import Button from '../ui/Button';
import CreateNewWallet from './newWallet';

// Material Symbols Icon component
const MaterialIcon = ({ name, className = '', filled = false }) => (
    <span 
        className={`material-symbols-outlined ${className}`}
        style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
        {name}
    </span>
);

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

    useEffect(() => {
        if (user && user.id) {
            fetchWallets();
        }
    }, [user]);

    const fetchWallets = async () => {
        dispatch(setLoading(true));
        try {
            if (!user || !user.id) throw new Error('User not authenticated');
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
            console.error('Error fetching wallet details:', err);
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
                console.log(`Transferred $${result.transferredAmount}`);
            }
            await fetchWallets();
            if (selectedWallet?._id === walletId) {
                setSelectedWallet(null);
            }
        } catch (err) {
            console.error('Error deleting wallet:', err);
            dispatch(setError(err.response?.data?.error || err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleWalletUpdate = async (walletId, updatedData) => {
        // Guard against undefined walletId (happens when called from wallet creation)
        if (!walletId) {
            console.log('handleWalletUpdate called with undefined walletId, refreshing wallets instead');
            await fetchWallets();
            return;
        }

        try {
            await walletService.updateWallet(walletId, updatedData);
            dispatch(updateWallet({ _id: walletId, ...updatedData }));
            fetchWallets();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleTransfer = async (fromWalletId, toWalletId, amount) => {
        try {
            dispatch(setLoading(true));
            await walletService.transferBetweenWallets(fromWalletId, toWalletId, amount);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (loading && !wallets.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-500 rounded-lg border border-red-100">
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
                        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full">
                            <Bell className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full">
                            <Settings className="w-5 h-5" />
                        </button>
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
                                        {formatCurrency(totalBalance)}
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
                                    <button className="bg-gradient-to-r from-primary-fixed-dim to-on-primary-container text-on-primary px-8 py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                                        <MaterialIcon name="add_card" className="text-xl" />
                                        Add Wallet
                                    </button>
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
                                <p className="text-on-tertiary-container text-sm">{formatCurrency(selectedWallet.balance)}</p>
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
