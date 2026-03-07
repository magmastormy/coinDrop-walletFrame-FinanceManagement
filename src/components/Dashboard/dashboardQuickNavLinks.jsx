import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, PieChart, ArrowLeftRight, Settings, GraduationCap, TrendingUp } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

const DashboardQuickNavLinks = () => {
    const navLinks = [
        {
            to: '/wallet',
            icon: Wallet,
            title: 'Wallets',
            description: 'Manage your wallets and accounts',
            gradient: 'from-blue-500 to-blue-400'
        },
        {
            to: '/budget',
            icon: PieChart,
            title: 'Budget',
            description: 'Manage budgets and categories',
            gradient: 'from-purple-500 to-purple-400'
        },
        {
            to: '/transaction',
            icon: ArrowLeftRight,
            title: 'Transactions',
            description: 'Track income and expenses',
            gradient: 'from-green-500 to-green-400'
        },
        {
            to: '/investments',
            icon: TrendingUp,
            title: 'Investments',
            description: 'Monitor your portfolio',
            gradient: 'from-amber-500 to-amber-400'
        },
        {
            to: '/education',
            icon: GraduationCap,
            title: 'Learn',
            description: 'Financial education resources',
            gradient: 'from-red-500 to-red-400'
        },
        {
            to: '/settings',
            icon: Settings,
            title: 'Settings',
            description: 'Configure your preferences',
            gradient: 'from-gray-600 to-gray-500'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <GlassCard className="border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-5 dark:from-white/10 dark:via-white/5">
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
                                    className="group block h-full rounded-2xl border border-white/10 bg-background/45 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/10"
                                >
                                    <motion.div
                                        className={`mb-3 inline-flex rounded-xl bg-gradient-to-br p-3 ${link.gradient}`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Icon className="w-5 h-5 text-white" />
                                    </motion.div>
                                    <h4 className="mb-1 text-base font-semibold text-foreground">{link.title}</h4>
                                    <p className="text-xs leading-relaxed text-muted-foreground">{link.description}</p>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default DashboardQuickNavLinks;
