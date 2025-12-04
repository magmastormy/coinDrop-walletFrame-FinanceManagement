import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet } from 'lucide-react';
import CreateNewWallet from './newWallet';
import WalletCard from './walletCard';
import { GlassCard } from '../ui/GlassCard';

const WalletList = ({ wallets = [], onWalletUpdate, onWalletDelete, onTransfer }) => {
    const totalBalance = useMemo(() => {
        return Array.isArray(wallets) ? wallets.reduce((sum, wallet) => sum + (wallet?.balance || 0), 0) : 0;
    }, [wallets]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (!wallets.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                    <Wallet className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">No Wallets Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Create your first wallet to start tracking your finances and managing your budget effectively.
                </p>
                <CreateNewWallet onWalletCreated={onWalletUpdate} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Your Wallets</h2>
                    <p className="text-muted-foreground">Manage your accounts and balances</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
                    <p className="text-3xl font-display font-bold text-primary">
                        {formatCurrency(totalBalance)}
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                <CreateNewWallet onWalletCreated={onWalletUpdate} />
            </div>

            <AnimatePresence mode="popLayout">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {wallets.map((wallet, index) => (
                        <motion.div
                            key={wallet._id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <WalletCard
                                wallet={wallet}
                                wallets={wallets}
                                onUpdate={onWalletUpdate}
                                onDelete={onWalletDelete}
                                onTransfer={onTransfer}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

WalletList.propTypes = {
    wallets: PropTypes.array,
    onWalletUpdate: PropTypes.func.isRequired,
    onWalletDelete: PropTypes.func.isRequired,
    onTransfer: PropTypes.func
};

export default React.memo(WalletList);


