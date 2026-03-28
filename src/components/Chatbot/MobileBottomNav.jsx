import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './chatbotStyles.css';

const MobileBottomNav = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Home', icon: 'dashboard', path: '/dashboard' },
        { name: 'Activity', icon: 'receipt_long', path: '/transaction' },
        { name: 'Chat', icon: 'smart_toy', path: '/chatbot', active: true },
        { name: 'Wallets', icon: 'account_balance_wallet', path: '/wallet' },
        { name: 'Account', icon: 'person', path: '/user-management' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low border-t border-outline-variant/20 flex justify-around items-center h-16 px-2 z-50">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path || item.active;
                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                            isActive ? 'text-primary-curator' : 'text-tertiary'
                        }`}
                    >
                        <span className={`material-symbols-outlined text-xl ${isActive ? 'filled' : ''}`}>
                            {item.icon}
                        </span>
                        <span className={`text-[10px] ${isActive ? 'font-bold' : ''}`}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default MobileBottomNav;
