import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faPlus } from '@fortawesome/free-solid-svg-icons';
import walletService from '../../services/walletService';
import { setWallets, setLoading, setError } from '../../slices/walletSlice';
import CreateNewWallet from './newWallet';
import WalletCard from './WalletCard';
import EmptyState from '../common/EmptyState';
import './styles/transactionStyles.css';

const WalletList = () => {
    const dispatch = useDispatch();
    const { wallets, loading, error } = useSelector(state => state.wallet);

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            dispatch(setLoading(true));
            const data = await walletService.getAllWallets();
            dispatch(setWallets(data.wallets));
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!wallets.length) {
        return (
            <EmptyState
                icon={<FontAwesomeIcon icon={faWallet} size="3x" />}
                title="No Wallets Yet"
                description="Create your first wallet to start tracking your finances"
                action={<CreateNewWallet onWalletCreated={fetchWallets} />}
            />
        );
    }

    return (
        <div className="wallet-container">
            <div className="wallet-header">
                <h2>My Wallets</h2>
                <CreateNewWallet onWalletCreated={fetchWallets} />
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
                        onUpdate={fetchWallets}
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default WalletList;