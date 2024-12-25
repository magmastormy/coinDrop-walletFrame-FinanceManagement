import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import CreateNewWallet from './newWallet';
import WalletCard from './WalletCard';
import EmptyState from '../../pages/emptyState';
import '../Transaction/styles/transactionStyles.css';

const WalletList = ({ wallets, onWalletSelect, onDelete }) => {
    if (!wallets.length) {
        return (
            <EmptyState
                icon={<FontAwesomeIcon icon={faWallet} size="3x" />}
                title="No Wallets Yet"
                description="Create your first wallet to start tracking your finances"
                action={<CreateNewWallet onWalletCreated={onWalletSelect} />}
            />
        );
    }

    return (
        <div className="wallet-container">
            <div className="wallet-header">
                <h2>My Wallets</h2>
                <CreateNewWallet onWalletCreated={onWalletSelect} />
            </div>
            <motion.div 
                className="wallet-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {wallets.map(wallet => (
                    <WalletCard 
                        key={wallet._id} 
                        wallet={wallet} 
                        onUpdate={onWalletSelect}
                        onDelete={onDelete}
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default WalletList;
