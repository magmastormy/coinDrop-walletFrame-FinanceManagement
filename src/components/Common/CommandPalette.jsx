import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { 
    Search, 
    LayoutDashboard, 
    Wallet, 
    CreditCard, 
    ArrowLeftRight,
    PiggyBank,
    Building2,
    BookOpen,
    Bot,
    User,
    Settings,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const navigationItems = [
        {
            category: 'Core',
            items: [
                { name: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', keywords: ['home', 'overview', 'analytics'] },
                { name: 'Wallets', icon: Wallet, route: '/wallet', keywords: ['money', 'accounts', 'balance'] },
                { name: 'Budgets', icon: CreditCard, route: '/budget', keywords: ['spending', 'limit', 'plan'] },
                { name: 'Transactions', icon: ArrowLeftRight, route: '/transaction', keywords: ['history', 'payments', 'records'] }
            ]
        },
        {
            category: 'Growth',
            items: [
                { name: 'Savings Goals', icon: PiggyBank, route: '/saving-goal', keywords: ['save', 'target', 'dream'] },
                { name: 'Savings Accounts', icon: Building2, route: '/saving-account', keywords: ['bank', 'interest', 'deposit'] },
                { name: 'Education', icon: BookOpen, route: '/education', keywords: ['learn', 'articles', 'finance'] },
                { name: 'My Posts', icon: BookOpen, route: '/user-education', keywords: ['my content', 'articles'] },
                { name: 'Chatbot', icon: Bot, route: '/chatbot', keywords: ['ai', 'assistant', 'help'] }
            ]
        },
        {
            category: 'Account',
            items: [
                { name: 'User Management', icon: User, route: '/user-management', keywords: ['profile', 'settings', 'account'] },
                { name: 'Settings', icon: Settings, route: '/settings', keywords: ['preferences', 'configuration'] }
            ]
        }
    ];

    const handleSelect = (route) => {
        navigate(route);
        onClose();
        setSearchTerm('');
    };

    const filteredItems = navigationItems.map(category => ({
        ...category,
        items: category.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    })).filter(category => category.items.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50"
                        style={{ background: 'rgba(0,0,0,0.60)' }}
                    />
                    
                    {/* Command Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
                    >
                        <Command
                            className="shadow-2xl overflow-hidden"
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--color-surface-1)',
                            }}
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <Search className="w-[18px] h-[18px] text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                                <input
                                    type="text"
                                    placeholder="Search pages..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                                    autoFocus
                                />
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-lg transition-colors"
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    aria-label="Close"
                                >
                                    <X className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                </button>
                            </div>
                            
                            {/* Results */}
                            <Command.List className="max-h-[400px] overflow-y-auto p-2">
                                {filteredItems.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        No results found for &quot;{searchTerm}&quot;
                                    </div>
                                ) : (
                                    filteredItems.map((category) => (
                                        <Command.Group 
                                            key={category.category}
                                            className="mb-3 last:mb-0"
                                        >
                                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                {category.category}
                                            </div>
                                            {category.items.map((item) => (
                                                <Command.Item
                                                    key={item.route}
                                                    onSelect={() => handleSelect(item.route)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group"
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <div
                                                        className="p-2 rounded-lg transition-colors"
                                                        style={{
                                                            border: '1px solid var(--color-border)',
                                                            background: 'var(--color-surface-1)',
                                                        }}
                                                    >
                                                        <item.icon className="w-[18px] h-[18px] text-foreground" strokeWidth={1.5} />
                                                    </div>
                                                    <span className="font-medium">{item.name}</span>
                                                </Command.Item>
                                            ))}
                                        </Command.Group>
                                    ))
                                )}
                            </Command.List>
                        </Command>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
