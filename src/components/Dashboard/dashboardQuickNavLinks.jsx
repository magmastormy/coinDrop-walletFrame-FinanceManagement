import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, PieChart, ArrowLeftRight, Settings, GraduationCap, TrendingUp } from 'lucide-react';

const DashboardQuickNavLinks = () => {
    const navLinks = [
        {
            to: '/wallet',
            icon: Wallet,
            title: 'Wallets',
            description: 'Manage your wallets and accounts',
        },
        {
            to: '/budget',
            icon: PieChart,
            title: 'Budget',
            description: 'Manage budgets and categories',
        },
        {
            to: '/transaction',
            icon: ArrowLeftRight,
            title: 'Transactions',
            description: 'Track income and expenses',
        },
        {
            to: '/investments',
            icon: TrendingUp,
            title: 'Investments',
            description: 'Monitor your portfolio',
        },
        {
            to: '/education',
            icon: GraduationCap,
            title: 'Learn',
            description: 'Financial education resources',
        },
        {
            to: '/user-management',
            icon: Settings,
            title: 'User Management',
            description: 'Manage profile and settings',
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div
                style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface-1)',
                    padding: '24px',
                }}
            >
                <h3 className="mb-4 text-xl font-bold text-foreground">Quick Navigation</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
                    {navLinks.map((link, index) => {
                        const Icon = link.icon;
                        return (
                            <motion.div
                                key={link.to}
                                className="h-full"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.1,
                                    ease: "easeOut"
                                }}
                            >
                                <Link
                                    to={link.to}
                                    className="group block h-full p-4"
                                    style={{
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface-1)',
                                        transition: 'background 150ms ease',
                                        textDecoration: 'none',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-1)'; }}
                                >
                                    <div className="mb-3 flex items-center justify-between" style={{ gap: '12px' }}>
                                        <h4 className="text-base font-semibold text-foreground">{link.title}</h4>
                                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />
                                    </div>
                                    <p className="text-xs leading-relaxed text-muted-foreground">{link.description}</p>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardQuickNavLinks;
