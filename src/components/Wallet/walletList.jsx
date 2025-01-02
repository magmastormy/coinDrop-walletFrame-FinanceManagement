import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import CreateNewWallet from './newWallet';
import WalletCard from './walletCard';
import EmptyState from '../../pages/emptyState';
import './styles/walletListStyles.css';

const WalletList = ({ wallets, onWalletUpdate, onWalletDelete, onTransfer }) => {
    const totalBalance = useMemo(() => {
        return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    }, [wallets]);

    const formatTotalBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(balance);
    };

    if (!wallets.length) {
        return (
            <div role="main" aria-label="Wallets section">
                <EmptyState
                    icon={<FontAwesomeIcon icon={faWallet} size="3x" aria-hidden="true" />}
                    title="No Wallets Yet"
                    description="Create your first wallet to start tracking your finances"
                    action={<CreateNewWallet onWalletCreated={onWalletUpdate} />}
                />
            </div>
        );
    }

    return (
        <div 
            className="wallet-container"
            role="main"
            aria-label="Wallets section"
        >
            <div className="wallet-summary">
                <div className="summary-header">
                    <h2>Your Wallets</h2>
                    <CreateNewWallet onWalletCreated={onWalletUpdate} />
                </div>
                <div 
                    className="total-balance"
                    aria-label={`Total balance: ${formatTotalBalance(totalBalance)}`}
                >
                    <span className="balance-label">Total Balance</span>
                    <span className={`balance-amount ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
                        {formatTotalBalance(totalBalance)}
                    </span>
                </div>
            </div>

            <AnimatePresence>
                <motion.div 
                    className="wallets-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    role="list"
                    aria-label="List of wallets"
                >
                    {wallets.map(wallet => (
                        <motion.div
                            key={wallet._id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            role="listitem"
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

export default WalletList;
