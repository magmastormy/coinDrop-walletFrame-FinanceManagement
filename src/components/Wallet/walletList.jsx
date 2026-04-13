import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LayoutGrid, List, SearchX } from 'lucide-react';
import CreateNewWallet from './newWallet';
import WalletCard from './walletCard';
import MaterialIcon from '../ui/MaterialIcon';

const WalletList = React.memo(({ 
    wallets = [], 
    allWallets = [],
    onWalletUpdate, 
    onWalletDelete, 
    onTransfer, 
    onWalletSelect,
    viewMode = 'grid',
    setViewMode,
    searchQuery = ''
}) => {
    WalletList.displayName = 'WalletList';

    // Empty state when no wallets exist at all
    if (!allWallets?.length) {
        return (
            <section>
                <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/5">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <MaterialIcon name="account_balance_wallet" className="text-4xl" filled />
                    </div>
                    <h3 className="text-xl font-medium text-on-surface mb-2">No Wallets Found</h3>
                    <p className="text-sm text-on-tertiary-container mb-6 max-w-md">
                        Get started by creating your first wallet to track finances and manage budgets.
                    </p>
                    <CreateNewWallet onWalletCreated={onWalletUpdate} />
                </div>
            </section>
        );
    }

    // Empty state when search returns no results
    if (searchQuery && !wallets?.length) {
        return (
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold font-headline text-on-surface">Active Wallets</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'grid' 
                                    ? 'bg-surface-container-high text-on-surface' 
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'list' 
                                    ? 'bg-surface-container-high text-on-surface' 
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-low rounded-2xl border border-outline-variant/5">
                    <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-4 text-on-tertiary-container">
                        <SearchX className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-medium text-on-surface mb-2">No Wallets Match Your Search</h3>
                    <p className="text-sm text-on-tertiary-container mb-2 max-w-md">
                        No wallets found matching &quot;<span className="text-primary">{searchQuery}</span>&quot;
                    </p>
                    <p className="text-xs text-on-tertiary-container/70 mb-6">
                        Try searching by wallet name or type (e.g., &quot;savings&quot;, &quot;checking&quot;)
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Active Wallets</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'grid' 
                                ? 'bg-surface-container-high text-on-surface' 
                                : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'list' 
                                ? 'bg-surface-container-high text-on-surface' 
                                : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <AnimatePresence mode="popLayout">
                <div className={`
                    ${viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' 
                        : 'flex flex-col gap-4'
                    }
                `}>
                    {wallets.map((wallet, index) => (
                        <motion.div
                            key={wallet._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.03, duration: 0.3 }}
                            onClick={() => onWalletSelect?.(wallet)}
                            className={viewMode === 'list' ? 'cursor-pointer' : ''}
                        >
                            <WalletCard
                                wallet={wallet}
                                wallets={allWallets}
                                onUpdate={onWalletUpdate}
                                onDelete={onWalletDelete}
                                onTransfer={onTransfer}
                                viewMode={viewMode}
                            />
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>
        </section>
    );
});

export default WalletList;
