import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    Wallet,
    PieChart,
    ArrowRightLeft,
    User,
    Settings,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: PieChart, label: 'Budget', path: '/budget' },
        { icon: ArrowRightLeft, label: 'Transactions', path: '/transaction' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
            <div className="glass-panel rounded-2xl p-3 flex flex-col gap-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "p-3 rounded-xl transition-all duration-300 group relative flex items-center justify-center",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-glow"
                                : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        )}
                    >
                        <item.icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />

                        {/* Tooltip */}
                        <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {item.label}
                        </span>
                    </NavLink>
                ))}

                <div className="h-px w-full bg-border my-1" />

                <button className="p-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group relative flex items-center justify-center">
                    <LogOut className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                    <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
