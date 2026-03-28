import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

const SidebarToggle = () => {
  const { toggleSidebar, isSidebarOpen, isMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn(
        "h-11 w-11 rounded-2xl border transition-all duration-300",
        "hover:-translate-y-0.5",
        isSidebarOpen && "rotate-90",
        isMobile && "fixed top-4 left-4 z-50"
      )}
      style={{
        background: 'var(--color-surface-1)',
        borderColor: 'var(--color-border)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-1)'; }}
      aria-label="Toggle Sidebar"
    >
      <Menu className="w-[18px] h-[18px]" strokeWidth={1.5} />
    </Button>
  );
};

export default SidebarToggle;
