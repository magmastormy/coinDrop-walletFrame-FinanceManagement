import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const SidebarToggle = () => {
  const { toggleSidebar, isOpen, isMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn(
        "transition-all",
        isOpen && "rotate-90",
        isMobile && "fixed top-4 left-4 z-50"
      )}
      aria-label="Toggle Sidebar"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
};

export default SidebarToggle;
