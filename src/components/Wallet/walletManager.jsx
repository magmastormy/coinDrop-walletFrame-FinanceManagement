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
import ReportSection from '../Common/ReportSection';
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
            const walletdata = await walletService.getAllWallets(user.id);
            dispatch(setWallets(walletdata || []));
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

    const handleDeleteWallet = async (walletId, transferToWalletId = null) => {
        try {
            dispatch(setLoading(true));
            const result = await walletService.deleteWallet(walletId, transferToWalletId);
            
            // Show success toast if money was transferred
            if (result.transferredAmount > 0) {
                // If you have a toast notification system, you can use it here
                console.log(`Successfully transferred $${result.transferredAmount} to ${transferToWalletId ? 'selected wallet' : 'system wallet'}`);
            }
            
            await fetchWallets();
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
        } catch (err) {
            dispatch(setError(err.response?.data?.error || err.message));
        } finally {
            dispatch(setLoading(false));
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
                <ReportSection 
                    title="Wallet Report" 
                    accountId={selectedWallet?._id || user?.id} 
                    reportType="wallet-summary"
                />
            </div>
            {!selectedWallet ? (
                <div>
                    <CreateNewWallet onWalletCreated={fetchWallets} />
                    <WalletList 
                        wallets={wallets}
                        onWalletSelect={handleWalletSelect}
                        onWalletDelete={handleDeleteWallet} /* Changed from onDelete to match WalletList's expected prop name */
                        onWalletUpdate={handleWalletUpdate}
                        onTransfer={handleTransfer} 
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