import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    User,
    PieChart,
    BookOpen,
    ArrowLeftRight,
    PiggyBank,
    Building2,
    LogOut,
    Bot,
    Settings
} from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';
import { useTheme } from '../../theme/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { cn } from '../../lib/utils';

const Sidebar = () => {
    const { isOpen, isMobile, toggleSidebar } = useSidebar();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setIsVisible(!!user);
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login');
        }
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    if (!isVisible) {
        return null;
    }

    const menuItems = [
        { name: 'Dashboard', link: '/dashboard', icon: LayoutDashboard },
        { name: 'Wallet', link: '/wallet', icon: Wallet },
        { name: 'Budget', link: '/budget', icon: CreditCard },
        { name: 'Transaction', link: '/transaction', icon: ArrowLeftRight },
        { name: 'Savings Goals', link: '/saving-goal', icon: PiggyBank },
        { name: 'Savings Accounts', link: '/saving-account', icon: Building2 },

        { name: 'My Education Posts', link: '/user-education', icon: BookOpen },
        { name: 'Education', link: '/education', icon: BookOpen },
        { name: 'Chatbot', link: '/chatbot', icon: Bot },
        { name: 'Settings', link: '/settings', icon: Settings },
        { name: 'Profile', link: '/profile', icon: User },
    ];

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen transition-all duration-300 z-40",
                "bg-background/80 backdrop-blur-xl border-r border-white/10",
                "flex flex-col",
                isOpen ? "w-64" : "w-0 -translate-x-full",
                isMobile && "shadow-2xl"
            )}
            role="navigation"
            aria-label="Main Navigation"
        >
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold text-foreground">WalletFrame</h1>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                {menuItems.map(item => {
                    const Icon = item.icon;
                    const active = isActiveRoute(item.link);

                    return (
                        <Link
                            key={item.link}
                            to={item.link}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 transition-all",
                                "text-muted-foreground hover:text-foreground hover:bg-white/5",
                                active && "bg-primary/20 text-primary border-r-2 border-primary"
                            )}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center gap-3 px-6 py-3 w-full transition-all",
                        "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    )}
                    type="button"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Logout</span>
                </button>
            </nav>

            <div className="p-4 border-t border-white/10 flex justify-center">
                <ThemeToggle />
            </div>
        </aside>
    );
};

export default Sidebar;