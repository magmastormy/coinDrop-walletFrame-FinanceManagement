import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { useSidebar } from './SidebarContext';
import './styles/sidebarToggle.css';

const SidebarToggle = () => {
  const { toggleSidebar, isOpen, isMobile } = useSidebar();

  return (
    <button 
      className={`sidebar-toggle ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}
      onClick={toggleSidebar}
      aria-label="Toggle Sidebar"
    >
      <FontAwesomeIcon icon={faBars} />
    </button>
  );
};

export default SidebarToggle;
