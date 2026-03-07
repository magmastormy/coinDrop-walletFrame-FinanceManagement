import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    User,
    BookOpen,
    ArrowLeftRight,
    PiggyBank,
    Building2,
    LogOut,
    Bot,
    Settings
} from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/authContext';
import { logout } from '../../services/authService';
import ThemeToggle from './ThemeToggle';
import { cn } from '../../lib/utils';

const MENU_SECTIONS = [
    {
        title: 'Core',
        items: [
            { name: 'Dashboard', link: '/dashboard', icon: LayoutDashboard },
            { name: 'Wallets', link: '/wallet', icon: Wallet },
            { name: 'Budgets', link: '/budget', icon: CreditCard },
            { name: 'Transactions', link: '/transaction', icon: ArrowLeftRight }
        ]
    },
    {
        title: 'Growth',
        items: [
            { name: 'Savings Goals', link: '/saving-goal', icon: PiggyBank },
            { name: 'Savings Accounts', link: '/saving-account', icon: Building2 },
            { name: 'Education', link: '/education', icon: BookOpen },
            { name: 'My Posts', link: '/user-education', icon: BookOpen },
            { name: 'Chatbot', link: '/chatbot', icon: Bot }
        ]
    },
    {
        title: 'Account',
        items: [
            { name: 'Profile', link: '/profile', icon: User },
            { name: 'Settings', link: '/settings', icon: Settings }
        ]
    }
];

const Sidebar = () => {
    const { isSidebarOpen, isMobile, closeSidebar } = useSidebar();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(!!user);
    }, [user]);

    useEffect(() => {
        if (isMobile) {
            closeSidebar();
        }
    }, [closeSidebar, isMobile, location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            closeSidebar();
            navigate('/login');
        }
    };

    const isActiveRoute = (path) => {
        return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(`${path}/`));
    };

    const handleNavClick = () => {
        if (isMobile) {
            closeSidebar();
        }
    };

    if (!isVisible) {
        return null;
    }

    const userName = user?.name || user?.username || 'CoinDrop User';
    const userEmail = user?.email || 'Signed in';

    return (
        <>
            {isMobile && isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar overlay"
                    onClick={closeSidebar}
                    className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[1px]"
                />
            )}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/15 bg-background/90 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
                role="navigation"
                aria-label="Main Navigation"
            >
                <div className="flex h-full flex-col">
                    <div className="border-b border-white/10 px-5 pb-4 pt-6">
                        <Link to="/dashboard" className="group inline-flex items-center gap-3" onClick={handleNavClick}>
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 font-display text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-transform duration-300 group-hover:scale-105">
                                CD
                            </span>
                            <div>
                                <h1 className="font-display text-xl font-bold tracking-tight text-foreground">CoinDrop</h1>
                                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Money OS</p>
                            </div>
                        </Link>
                        <p className="mt-4 text-xs text-muted-foreground">Track spending, automate savings, and move faster.</p>
                    </div>

                    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                        {MENU_SECTIONS.map(section => (
                            <section key={section.title} className="space-y-1.5">
                                <p className="px-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
                                    {section.title}
                                </p>
                                {section.items.map(item => {
                                    const Icon = item.icon;
                                    const active = isActiveRoute(item.link);

                                    return (
                                        <Link
                                            key={item.link}
                                            to={item.link}
                                            onClick={handleNavClick}
                                            aria-current={active ? 'page' : undefined}
                                            className={cn(
                                                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                                                "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                                                active && "bg-gradient-to-r from-primary/20 via-primary/15 to-transparent text-foreground shadow-inner"
                                            )}
                                        >
                                            <span className={cn(
                                                "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors",
                                                active && "border-primary/40 bg-primary/15 text-primary"
                                            )}>
                                                <Icon className="h-4 w-4 flex-shrink-0" />
                                            </span>
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </section>
                        ))}
                    </nav>

                    <div className="border-t border-white/10 p-4">
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                                "text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                            )}
                            type="button"
                        >
                            <LogOut className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Log out</span>
                        </button>

                        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

