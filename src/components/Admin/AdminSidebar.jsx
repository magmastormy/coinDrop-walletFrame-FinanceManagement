import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: 'dashboard', label: 'Admin Dashboard' },
    { path: '/admin/users', icon: 'group', label: 'User Management' },
    { path: '/admin/transactions', icon: 'account_balance_wallet', label: 'Transactions Audit' },
    { path: '/admin/disaster-recovery', icon: 'backup', label: 'Disaster Recovery' },
    { path: '/admin/audit-trail', icon: 'history', label: 'Audit Trail' },
    { path: '/admin/access-controls', icon: 'lock', label: 'Access Controls' },
    { path: '/admin/performance', icon: 'speed', label: 'Performance' },
    { path: '/admin/integrations', icon: 'settings_system_daydream', label: 'Third-Party Integrations' },
    { path: '/admin/settings', icon: 'settings', label: 'System Settings' },
    { path: '/admin/security', icon: 'shield', label: 'Security Logs' }
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 z-50 bg-[#131b2e] flex flex-col py-8 gap-2 shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      <div className="px-8 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
          </div>
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-[#b6c4ff] to-[#4d76ff] bg-clip-text text-transparent font-headline tracking-tighter">
              Financial Curator
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-on-tertiary-container font-bold">
              Admin Terminal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-200 ease-out font-headline text-sm font-medium tracking-wide ${
                isActive
                  ? 'bg-gradient-to-r from-[#222a3d] to-transparent text-[#b6c4ff] border-l-4 border-[#b6c4ff] shadow-inner'
                  : 'text-[#738296] hover:text-[#c6c6cd] hover:bg-[#171f33]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-auto">
        <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          <span className="text-xs font-bold text-on-surface-variant tracking-tight uppercase">
            System Status: Operational
          </span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
