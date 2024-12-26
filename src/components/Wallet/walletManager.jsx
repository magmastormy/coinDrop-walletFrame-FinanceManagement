import React, { useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import walletService from '../../services/walletService';
import { setWallets, setLoading, setError, updateWallet } from '../../slices/walletSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faChartLine,faArrowLeft  } from '@fortawesome/free-solid-svg-icons';
import CreateNewWallet from './newWallet';
import WalletList from './walletList';
import WalletBudgetList from './walletBudgetList';
import TransactionList from '../Transaction/transactionList';
import WalletChart from './walletCharts';
import './styles/walletManagerStyles.css';

const WalletManager = () => {
    const dispatch = useDispatch();
    const { wallets, loading, error } = useSelector(state => state.wallet);
    const { user } = useSelector(state => state.auth);
    const [activeView, setActiveView] = useState('wallets');
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [walletBudgets, setWalletBudgets] = useState([]);

    useEffect(() => {
        if (user && user.id) {
            fetchWallets();
        }
    }, [user]);

    const fetchWallets = async () => {        
        dispatch(setLoading(true));
        try {
            if (!user || !user.id) {
                throw new Error('User not authenticated');
            }

            const data = await walletService.getAllWallets(user.id);
            dispatch(setWallets(data.wallets || []));
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleWalletSelect = async (wallet) => {
        try {
            const data = await walletService.getWalletBudgets(wallet._id);
            setWalletBudgets(data.budgets);
            setSelectedWallet(wallet);
            setActiveView('budgets');
        } catch (err) {
          console.error(err);
        }
      };

    const handleDeleteWallet = async (walletId) => {
        try {
            await walletService.deleteWallet(walletId);
            fetchWallets();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleWalletUpdate = async (walletId, updatedData) => {
        try {
            await walletService.updateWallet(walletId, updatedData);
            dispatch(updateWallet({ id: walletId, ...updatedData }));
            fetchWallets(); // Refresh the wallets list
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    if (loading) {
        return <div>Loading your wallets...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="wallet-manager">
            <h2>My Wallets</h2>
            <div className="wallet-chart-container">
                <FontAwesomeIcon icon={faWallet} size="lg" />
                <WalletChart wallets={wallets} />
            </div>
            {!selectedWallet ? (
                <div>
                    <CreateNewWallet onWalletCreated={fetchWallets} />
                    <WalletList 
                        wallets={wallets}
                        onWalletSelect={handleWalletSelect}
                        onDelete={handleDeleteWallet}
                        onWalletUpdate={handleWalletUpdate}
                    />
                </div>
            ) : (
                <div>
                    <button className="back-button">
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span onClick={() => setSelectedWallet(null)}>Back to Wallets</span>
                    </button>
                    <div>
                        <h3>{selectedWallet.name}</h3>
                        <WalletBudgetList budgets={walletBudgets} />
                        <TransactionList walletId={selectedWallet._id} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletManager;