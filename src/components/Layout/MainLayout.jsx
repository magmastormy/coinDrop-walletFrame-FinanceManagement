import Sidebar from '../Sidebar/sideBar';
import SidebarToggle from '../Sidebar/SidebarToggle';
import { useSidebar } from '../Sidebar/SidebarContext';
import { cn } from '../../lib/utils';

const MainLayout = ({ children, className }) => {
    const { isSidebarOpen, isMobile } = useSidebar();

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(6,182,212,0.14),transparent_38%),radial-gradient(circle_at_88%_82%,rgba(16,185,129,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
            <div className="pointer-events-none fixed inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,rgba(148,163,184,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.4)_1px,transparent_1px)] [background-size:36px_36px]" />

            <Sidebar />
            <div className={cn(
                "fixed top-4 z-50 transition-[left] duration-300",
                !isMobile && isSidebarOpen ? "left-[17.5rem]" : "left-4"
            )}>
                <SidebarToggle />
            </div>

            <main className={cn(
                "relative z-10 min-h-screen pt-20 transition-[padding] duration-300 ease-out",
                "px-4 pb-8 md:px-6 lg:pr-10",
                !isMobile && isSidebarOpen ? "lg:pl-80" : "lg:pl-8",
                className
            )}>
                <div className="mx-auto max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
