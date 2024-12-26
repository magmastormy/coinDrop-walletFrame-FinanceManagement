import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTrash, faEdit, faArrowRight, faWallet } from '@fortawesome/free-solid-svg-icons';
import EditWalletModal from './editWallet';
import WalletTransfer from './walletTransfer';
import './styles/walletCardStyles.css';

const WalletCard = ({ wallet, wallets, onUpdate, onDelete, onTransfer }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const getWalletIcon = () => {
        return faWallet; // Default wallet icon
    };

    const handleOptionsToggle = () => {
        setShowOptions(prev => !prev);
    };

    const handleOutsideClick = (e) => {
        if (showOptions && !e.target.closest('.options-menu') && !e.target.closest('.options-btn')) {
            setShowOptions(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [showOptions]);

    return (
        <div className="wallet-card">
            <div className="wallet-card-header">
                <FontAwesomeIcon icon={getWalletIcon()} className="wallet-icon" />
                <button type="button" className="options-btn" onClick={handleOptionsToggle} title="Options">
                    <FontAwesomeIcon icon={faEllipsisV} />
                </button>
            </div>
            <div className="wallet-card-content">
                <h3 className="wallet-name">{wallet.name}</h3>
                <div className="wallet-type">{wallet.type}</div>
                <div className={`wallet-balance ${wallet.balance >= 0 ? 'positive' : 'negative'}`}>
                    ${wallet.balance.toFixed(2)}
                </div>
            </div>

            {showOptions && (
                <div className="options-menu">
                    <button onClick={() => {
                        setShowEditModal(true);
                        setShowOptions(false);
                    }}>
                        <FontAwesomeIcon icon={faEdit} />
                        <span>Edit</span>
                    </button>
                    <button onClick={() => {
                        onDelete(wallet._id);
                        setShowOptions(false);
                    }}>
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Delete</span>
                    </button>
                    <button onClick={() => {
                        setShowTransferModal(true);
                        setShowOptions(false);
                    }}>
                        <FontAwesomeIcon icon={faArrowRight} />
                        <span>Transfer</span>
                    </button>
                </div>
            )}

            {/* Modals */}
            {showEditModal && (
                <EditWalletModal
                    wallet={wallet}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={onUpdate}
                />
            )}

            {showTransferModal && (
                <WalletTransfer
                    sourceWallet={wallet}
                    wallets={wallets}
                    onClose={() => setShowTransferModal(false)}
                    onUpdate={onUpdate}
                    onTransfer={onTransfer}
                />
            )}
        </div>
    );
};

export default WalletCard;