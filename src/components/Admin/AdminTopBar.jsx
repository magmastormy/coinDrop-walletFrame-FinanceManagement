import React from 'react';
import { useSelector } from 'react-redux';

const AdminTopBar = ({ title }) => {
  const { user } = useSelector(state => state.auth);

  return (
    <header className="flex justify-between items-center w-full px-8 h-20 sticky top-0 bg-[#0b1326]/80 backdrop-blur-xl z-40 shadow-2xl shadow-[#0b1326]/50">
      <div className="flex items-center gap-8">
        <h2 className="font-headline font-semibold tracking-tight text-[#b6c4ff] text-xl">
          {title}
        </h2>
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-tertiary-container text-sm">search</span>
          <input 
            className="bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary transition-all text-on-surface placeholder:text-on-tertiary-container"
            placeholder="Global search..."
            type="text"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex gap-4 items-center">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-tertiary-container hover:bg-[#222a3d]/50 transition-all duration-300">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-tertiary-container hover:bg-[#222a3d]/50 transition-all duration-300">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
        
        <div className="h-8 w-px bg-outline-variant/30"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold font-headline text-on-surface">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.username || 'Admin'}
            </p>
            <p className="text-[10px] text-secondary font-bold tracking-widest uppercase">
              {user?.role || 'Admin'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-on-primary-container flex items-center justify-center ring-2 ring-primary/20">
            <span className="text-on-primary font-bold">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 bg-gradient-to-b from-[#131b2e] to-transparent h-px w-full"></div>
    </header>
  );
};

export default AdminTopBar;
