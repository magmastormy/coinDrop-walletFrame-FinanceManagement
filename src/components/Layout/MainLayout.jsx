import Sidebar from '../Sidebar/SideBar';
import SidebarToggle from '../Sidebar/SidebarToggle';
import { useSidebar } from '../Sidebar/SidebarContext';
import { Search, Bell, Settings } from 'lucide-react';
import { useSelector } from 'react-redux';

const MainLayout = ({ children, className }) => {
    const { isMobile, isSidebarOpen } = useSidebar();
    const { user } = useSelector(state => state.auth);

    return (
        <div
            style={{
                display: 'flex',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                background: 'var(--color-bg-primary)'
            }}
            className={className}
        >
            <Sidebar />

            <main
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    marginLeft: !isMobile && isSidebarOpen ? '240px' : 0,
                    transition: 'margin-left 0.3s ease'
                }}
            >
                {isMobile && (
                    <div className="fixed left-4 top-4 z-50">
                        <SidebarToggle />
                    </div>
                )}

                {/* Top Navigation Bar */}
                <header className="flex justify-between items-center px-8 w-full sticky top-0 z-40 bg-[#0b1326] h-16">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#131b2e] rounded-xl flex items-center px-4 py-2 gap-3 w-80">
                            <Search className="text-on-tertiary-container" size={18} />
                            <input 
                                className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface" 
                                placeholder="Search curated insights..." 
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative text-[#b6c4ff] hover:bg-[#222a3d] p-2 rounded-full transition-colors duration-200">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
                        </button>
                        <button className="text-[#b6c4ff] hover:bg-[#222a3d] p-2 rounded-full transition-colors duration-200">
                            <Settings size={20} />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
                            <img 
                                alt="User profile avatar" 
                                className="w-8 h-8 rounded-full object-cover" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCg2DCxtBRnZNiFHXKQ5j-8q5y5xbq1y723YRVlFdnbADrCxgIx8WuaNK7vXpCBXqt2TJWU9MSjRfDNSLLsPyYAerb1_OsbIT7FQA1enSEK8majsp5CWspuiGhaPhuQhnanHB56WWbfg5cqUdvvnBwD_mlid059xsXsMgDnxQGNivswZBbEvOq_zn9Q4GhNTVXWTIcuDiCiZL3nIeheXNUlkAGi0XAR6eY97gftmyABVwjVhyCwikjMdbDhVFK6_vAtrHK7PEcQx6aI"
                            />
                            <span className="text-sm font-medium text-on-surface">{user?.name || 'User'}</span>
                        </div>
                    </div>
                </header>

                <div style={{ padding: '32px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
