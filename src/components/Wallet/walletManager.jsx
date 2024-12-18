import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import walletService from '../../services/walletService';
import { setWallets, setLoading, setError } from '../../slices/walletSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import CreateNewWallet from './newWallet';
import EmptyState from '../../pages/emptyState';
import WalletCard from './WalletCard';
c


const WalletManager = () => {
    const dispatch = useDispatch();
    const { wallets, loading, error } = useSelector(state => state.wallet);
    const {user} = useSelector(state => state.auth);
    const [showTransferModal, setShowTransferModal] = useState(false);

    useEffect(() => {
        fetchWallets();
    }, [dispatch]);

    const fetchWallets = async () => {   
        dispatch(setLoading(true));
        try {
            if (!user || !user.id) {
                throw new Error('User not authenticated');
            }

            const data = await walletService.getAllWallets(user.id);
            console.log('Wallet Manager - Fetched data:', data);
            console.log('Wallet Manager - Fetched data.wallets:', data.wallets);

            if (data && Array.isArray(data.wallets)) 
                {
                dispatch(setWallets(data.wallets));
            } 
            else {
                dispatch(setWallets([]));
            }
        } catch (error) {
            console.log('Wallet Manager - Error fetching wallet:', error.message);
            dispatch(setError(error.message));
        }finally{
            dispatch(setLoading(false));
        }
    };

    if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
        return <div>No wallets available.</div>; // Handle undefined wallets
    }

    if (loading) {
        return (
            <div className="loading-container">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <FontAwesomeIcon icon={faWallet} size="3x" />
                </motion.div>
                <p>Loading your wallets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <FontAwesomeIcon icon={faWallet} size="3x" />
                <p className="error-message">{error}</p>
                <button onClick={()=>fetchWallets(user.id.toString())} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="wallet-manager">
            <div className="wallet-header">
                <h2>My Wallets</h2>
                <CreateNewWallet onWalletCreated={()=>fetchWallets(user.id.toString())} />
            </div>

            <AnimatePresence>
                {wallets.length === 0 ? (
                    <EmptyState
                        icon={<FontAwesomeIcon icon={faWallet} size="3x" />}
                        title="No Wallets Yet"
                        description="Create your first wallet to start managing your finances"
                        action={<CreateNewWallet onWalletCreated={()=>fetchWallets(user.id.toString())} />}
                    />
                ) : (
                    <motion.div 
                        className="wallets-grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {wallets.map(wallet => (
                            <WalletCard
                                key={wallet._id}
                                wallet={wallet}
                                onUpdate={()=>fetchWallets(user.id.toString())}
                                onTransfer={() => setShowTransferModal(true)}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalletManager;