import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Wallet, Loader2 } from 'lucide-react';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import { setWallets, setLoading, setError, updateWallet } from '../../slices/walletSlice';
import WalletList from './walletList';
import WalletBudgetList from './walletBudgetList';
import TransactionTable from '../Transaction/transactionTable';
import WalletChart from './walletCharts';
import ReportSection from '../Common/ReportSection';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import CreateTransactionModal from '../Transaction/createTransactionModal';

const WalletManager = () => {
    const dispatch = useDispatch();
    const { wallets, loading, error } = useSelector(state => state.wallet);
    const { user } = useSelector(state => state.auth);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [walletBudgets, setWalletBudgets] = useState([]);
    const [walletTransactions, setWalletTransactions] = useState([]);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

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

            setWalletBudgets(budgetData.budgets || []);

            let txs = [];
            if (transactionData?.data?.transactions) txs = transactionData.data.transactions;
            else if (Array.isArray(transactionData?.data)) txs = transactionData.data;
            else if (Array.isArray(transactionData?.transactions)) txs = transactionData.transactions;

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
        try {
            await walletService.updateWallet(walletId, updatedData);
            dispatch(updateWallet({ id: walletId, ...updatedData }));
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
        <div className="space-y-8 pb-8">
            {!selectedWallet ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <WalletList
                                wallets={wallets}
                                onWalletSelect={handleWalletSelect}
                                onWalletDelete={handleDeleteWallet}
                                onWalletUpdate={handleWalletUpdate}
                                onTransfer={handleTransfer}
                            />
                        </div>
                        <div className="space-y-6">
                            <WalletChart wallets={wallets} />
                            <GlassCard className="p-6">
                                <ReportSection
                                    title="Wallet Report"
                                    accountId={user?.id}
                                    reportType="wallet-summary"
                                />
                            </GlassCard>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedWallet(null)}
                            className="gap-2 pl-0 hover:pl-2 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Wallets
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold text-foreground">{selectedWallet.name}</h2>
                            <p className="text-muted-foreground capitalize">{selectedWallet.type}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold">Transactions</h3>
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
                            </GlassCard>
                        </div>
                        <div className="space-y-6">
                            <GlassCard className="p-6">
                                <h3 className="text-lg font-bold mb-4">Budget Overview</h3>
                                <WalletBudgetList budgets={walletBudgets} />
                            </GlassCard>
                        </div>
                    </div>
                </div>
            )}

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