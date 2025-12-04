import React from 'react';
import Sidebar from '../ui/Sidebar';
import { cn } from '../../lib/utils';

const MainLayout = ({ children, className }) => {
    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/20">
            {/* Background Ambient Glow */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <Sidebar />

            <main className={cn(
                "relative z-10 min-h-screen transition-all duration-300",
                "lg:pl-28 lg:pr-8 py-8 px-4", // Desktop padding for sidebar
                className
            )}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
