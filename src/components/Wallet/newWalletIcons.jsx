import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWallet,
    faCreditCard,
    faMoneyBillWave,
    faCoins,
    faPiggyBank,
    faUniversity,
    faHandHoldingUsd,
    faMoneyCheckAlt,
    faChartLine,
    faDollarSign
} from '@fortawesome/free-solid-svg-icons';
import './styles/walletIconStyles.css';

const icons = [
    { icon: faWallet, name: 'Wallet' },
    { icon: faCreditCard, name: 'Credit Card' },
    { icon: faMoneyBillWave, name: 'Cash' },
    { icon: faCoins, name: 'Coins' },
    { icon: faPiggyBank, name: 'Savings' },
    { icon: faUniversity, name: 'Bank' },
    { icon: faHandHoldingUsd, name: 'Investment' },
    { icon: faMoneyCheckAlt, name: 'Check' },
    { icon: faChartLine, name: 'Stocks' },
    { icon: faDollarSign, name: 'Dollar' }
];

const CreateNewWalletIconOptions = ({ selectedIcon, onSelect }) => {
    return (
        <div className="icon-options-grid">
            {icons.map((item, index) => (
                <button
                    key={index}
                    className={`icon-option ${selectedIcon === item.icon ? 'selected' : ''}`}
                    onClick={() => onSelect(item.icon)}
                    type="button"
                    aria-label={`Select ${item.name} icon`}
                >
                    <FontAwesomeIcon icon={item.icon} />
                    <span className="icon-name">{item.name}</span>
                </button>
            ))}
        </div>
    );
};

export default CreateNewWalletIconOptions;
