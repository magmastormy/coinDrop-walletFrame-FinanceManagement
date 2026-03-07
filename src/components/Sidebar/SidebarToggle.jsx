import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const SidebarToggle = () => {
  const { toggleSidebar, isSidebarOpen, isMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn(
        "h-11 w-11 rounded-2xl border border-white/20 bg-background/80 shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300",
        "hover:-translate-y-0.5 hover:bg-white/20",
        isSidebarOpen && "rotate-90",
        isMobile && "fixed top-4 left-4 z-50"
      )}
      aria-label="Toggle Sidebar"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
};

export default SidebarToggle;
