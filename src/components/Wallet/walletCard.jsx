import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import walletService from '../../services/walletService';
import { deleteWallet, updateWallet } from '../../slices/walletSlice';
import './styles/walletStyles.css';
const WalletCard = ({ wallet, onUpdate, onTransfer }) => {
    const [showOptions, setShowOptions] = useState(false);
    const dispatch = useDispatch();

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this wallet?')) {
            try {
                await walletService.deleteWallet(wallet._id);
                dispatch(deleteWallet(wallet._id));
            } catch (error) {
                console.error('Failed to delete wallet:', error);
            }
        }
    };

    return (
        <div className="wallet-card">
            <div className="wallet-card-header">
                <FontAwesomeIcon icon={wallet.metadata.icon} className="wallet-icon" />
                <button 
                    className="options-btn"
                    onClick={() => setShowOptions(!showOptions)}
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </button>
                {showOptions && (
                    <div className="options-menu">
                        <button onClick={() => {onUpdate}}>
                            <FontAwesomeIcon icon={faEdit} /> Edit
                        </button>
                        <button onClick={handleDelete}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                        <button onClick={onTransfer}>
                            <FontAwesomeIcon icon={faArrowRight} /> Transfer
                        </button>
                    </div>
                )}
            </div>
            <div className="wallet-card-content">
                <h3>{wallet.name}</h3>
                <div className={`balance ${wallet.balance >= 0 ? 'positive' : 'negative'}`}>
                    ${wallet.balance.toFixed(2)}
                </div>
                <div className="wallet-type">{wallet.type}</div>
            </div>
        </div>
    );
};

export default WalletCard;