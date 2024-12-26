import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import CreateNewWallet from './newWallet';
import WalletCard from './walletCard';
import EmptyState from '../../pages/emptyState';
import './styles/walletListStyles.css';

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
            <motion.div 
                className="wallets-placement-container"
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
