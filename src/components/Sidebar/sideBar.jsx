import { logError } from '../../utils/logger';

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
    CircleHelp,
    Plus
} from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/authContext';
import { logout } from '../../services/authService';
import { cn } from '../../lib/utils';

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
            logError('Logout failed:', error);
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

    return (
        <>
            {isMobile && isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar overlay"
                    onClick={closeSidebar}
                    className="fixed inset-0 z-30"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                />
            )}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
                style={{
                    width: '256px',
                    background: '#131b2e',
                    borderRight: '1px solid rgba(144, 144, 151, 0.1)'
                }}
                role="navigation"
                aria-label="Main Navigation"
            >
                <div className="flex h-full flex-col py-8">
                    <div className="px-8 mb-8">
                        <h1 className="font-['Manrope'] font-black text-[#b6c4ff] text-2xl">Curator Pro</h1>
                        <p className="text-[#738296] text-xs font-medium uppercase tracking-widest mt-1">Elite Tier</p>
                    </div>

                    <nav className="flex-1 flex flex-col space-y-1 px-4">
                        <Link 
                            to="/dashboard"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/dashboard') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </Link>
                        
                        <Link 
                            to="/wallet"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/wallet') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <Wallet size={20} />
                            <span>Wallets</span>
                        </Link>
                        
                        <Link 
                            to="/transaction"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/transaction') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <ArrowLeftRight size={20} />
                            <span>Transactions</span>
                        </Link>
                        
                        <Link 
                            to="/budget"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/budget') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <CreditCard size={20} />
                            <span>Budgets</span>
                        </Link>
                        
                        <Link 
                            to="/saving-goal"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/saving-goal') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <PiggyBank size={20} />
                            <span>Saving Goals</span>
                        </Link>
                        
                        <Link 
                            to="/saving-account"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/saving-account') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <PiggyBank size={20} />
                            <span>Saving Accounts</span>
                        </Link>
                        
                        <Link 
                            to="/user-management"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/user-management') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <User size={20} />
                            <span>User Management</span>
                        </Link>
                        
                        <Link 
                            to="/education"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/education') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <BookOpen size={20} />
                            <span>Education</span>
                        </Link>
                        
                        <Link 
                            to="/user-education"
                            onClick={handleNavClick}
                            className={`text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] hover:translate-x-1 ${isActiveRoute('/user-education') ? 'bg-[#222a3d] text-[#b6c4ff] rounded-r-full mr-4 border-l-4 border-[#4d76ff] font-semibold' : ''}`}
                        >
                            <BookOpen size={20} />
                            <span>User Education</span>
                        </Link>
                    </nav>

                    <div className="px-6 mt-auto">
                        <button className="w-full bg-gradient-to-r from-primary to-on-primary-container text-on-primary py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20">
                            <Plus size={18} />
                            <span>New Transaction</span>
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-outline-variant/10 flex flex-col space-y-1 px-4">
                        <Link 
                            to="/chatbot"
                            onClick={handleNavClick}
                            className="text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33]"
                        >
                            <Bot size={20} />
                            <span>Chatbot</span>
                        </Link>
                        
                        <button 
                            onClick={handleLogout}
                            className="text-[#738296] pl-6 py-3 hover:text-[#c6c6cd] flex items-center gap-3 transition-all duration-300 hover:bg-[#171f33] w-full text-left"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

