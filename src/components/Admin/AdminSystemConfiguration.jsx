import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSystemHealth, fetchSystemMetrics } from '../../slices/adminSlice';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const AdminSystemConfiguration = () => {
  const dispatch = useDispatch();
  const { health, metrics, loading, error } = useSelector(state => state.admin.system);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchSystemHealth());
    dispatch(fetchSystemMetrics());
    
    // Fetch current system settings
    const loadSettings = async () => {
      try {
        const currentSettings = await adminService.getSystemSettings();
        setSettings(currentSettings);
      } catch (err) {
        console.error('Failed to load system settings:', err);
      }
    };
    
    loadSettings();
  }, [dispatch]);

  const [settings, setSettings] = useState({
    maintenanceMode: false,
    betaFeatures: true,
    apiAccess: true
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await adminService.updateSystemSettings(settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-error">Error loading system info: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      {/* System Health Stats */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-secondary">check_circle</span>
            </div>
            <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">Status</p>
            <h2 className="text-2xl font-headline font-extrabold text-secondary">
              {health.status?.toUpperCase() || 'OPERATIONAL'}
            </h2>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-on-surface">timer</span>
            </div>
            <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">Uptime</p>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface">
              {formatUptime(health.uptime || 0)}
            </h2>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-primary">memory</span>
            </div>
            <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">Memory Usage</p>
            <h2 className="text-2xl font-headline font-extrabold text-primary">
              {formatBytes(health.memory?.used || 0)}
            </h2>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-warning">storage</span>
            </div>
            <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">Database</p>
            <h2 className="text-2xl font-headline font-extrabold text-warning">
              {health.database?.status?.toUpperCase() || 'CONNECTED'}
            </h2>
          </div>
        </div>
      )}

      <section>
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h3 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">
              Platform Settings
            </h3>
            <p className="text-on-tertiary-container max-w-2xl">
              Manage critical engine parameters and feature flags. Changes here take immediate effect across the entire infrastructure.
            </p>
          </div>
          <button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-primary to-on-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4 bg-surface-container-low p-6 rounded-2xl relative overflow-hidden group border border-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-surface-container-high text-primary">
                <span className="material-symbols-outlined">engineering</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={() => handleToggle('maintenanceMode')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <h4 className="text-lg font-headline font-bold mb-2 text-on-surface">Maintenance Mode</h4>
            <p className="text-sm text-on-surface-variant">
              Restrict platform access to administrative personnel only during scheduled updates.
            </p>
          </div>

          <div className="col-span-12 md:col-span-4 bg-surface-container-low p-6 rounded-2xl relative overflow-hidden group border border-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-surface-container-high text-secondary">
                <span className="material-symbols-outlined">experiment</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.betaFeatures}
                  onChange={() => handleToggle('betaFeatures')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
            <h4 className="text-lg font-headline font-bold mb-2 text-on-surface">Beta Features</h4>
            <p className="text-sm text-on-surface-variant">
              Enable early access to experimental financial modeling tools for selected tier accounts.
            </p>
          </div>

          <div className="col-span-12 md:col-span-4 bg-surface-container-low p-6 rounded-2xl relative overflow-hidden group border border-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-surface-container-high text-primary">
                <span className="material-symbols-outlined">api</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.apiAccess}
                  onChange={() => handleToggle('apiAccess')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <h4 className="text-lg font-headline font-bold mb-2 text-on-surface">API Access</h4>
            <p className="text-sm text-on-surface-variant">
              Control global connectivity for third-party institutional integrations and data feeds.
            </p>
          </div>
        </div>
      </section>

      {/* System Metrics */}
      {metrics && (
        <section className="space-y-6">
          <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
            System Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl p-6 border border-outline-variant/5 bg-surface-container-low">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined">speed</span>
                </div>
                <span className="text-sm font-semibold text-on-surface-variant">Response Time</span>
              </div>
              <p className="text-3xl font-headline font-bold text-on-surface">
                {metrics.responseTime?.toFixed(2) || '0'} <span className="text-sm text-on-tertiary-container">ms</span>
              </p>
            </div>

            <div className="rounded-2xl p-6 border border-outline-variant/5 bg-surface-container-low">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-surface-container-high text-secondary">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <span className="text-sm font-semibold text-on-surface-variant">Requests/min</span>
              </div>
              <p className="text-3xl font-headline font-bold text-on-surface">
                {metrics.requestsPerMinute || '0'}
              </p>
            </div>

            <div className="rounded-2xl p-6 border border-outline-variant/5 bg-surface-container-low">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-surface-container-high text-warning">
                  <span className="material-symbols-outlined">error</span>
                </div>
                <span className="text-sm font-semibold text-on-surface-variant">Error Rate</span>
              </div>
              <p className="text-3xl font-headline font-bold text-on-surface">
                {metrics.errorRate?.toFixed(2) || '0'}<span className="text-sm text-on-tertiary-container">%</span>
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
              Security Audit Log
            </h3>
            <span className="px-3 py-1 bg-surface-container-highest text-primary text-xs font-bold rounded-full">
              Real-time Feed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-tertiary-container text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Filter audit trail..."
                className="w-64 rounded-xl border-none bg-surface-container-low pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-tertiary-container focus:ring-1 focus:ring-primary"
              />
            </div>
            <button className="rounded-xl p-2 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="rounded-xl p-2 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-xl bg-surface-container-low">
          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-surface-container text-[10px] font-bold uppercase tracking-widest text-on-tertiary-container">
            <div className="col-span-3">Timestamp</div>
            <div className="col-span-3">Event Type</div>
            <div className="col-span-3">Admin User</div>
            <div className="col-span-3 text-right">IP Address</div>
          </div>
          <div className="divide-y divide-outline-variant/5">
            <div className="group grid grid-cols-12 gap-4 px-8 py-6 items-center transition-colors hover:bg-surface-container/50">
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(255,180,171,0.6)]"></div>
                <span className="text-on-surface font-medium">Oct 24, 2023 · 14:22:08</span>
              </div>
              <div className="col-span-3">
                <span className="px-3 py-1 bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-wider rounded-md border border-error/20">
                  Failed Auth
                </span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold">
                  U
                </div>
                <span className="text-on-surface-variant">Unknown (System)</span>
              </div>
              <div className="col-span-3 text-right font-mono text-xs text-on-tertiary-container group-hover:text-primary transition-colors">
                192.168.4.122
              </div>
            </div>

            <div className="group grid grid-cols-12 gap-4 px-8 py-6 items-center transition-colors hover:bg-surface-container/50">
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                <span className="text-on-surface font-medium">Oct 24, 2023 · 13:45:12</span>
              </div>
              <div className="col-span-3">
                <span className="px-3 py-1 bg-surface-container-high text-primary text-[10px] font-black uppercase tracking-wider rounded-md">
                  Config Change
                </span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold">
                  S
                </div>
                <span className="text-on-surface-variant">Sarah Chen</span>
              </div>
              <div className="col-span-3 text-right font-mono text-xs text-on-tertiary-container group-hover:text-primary transition-colors">
                45.12.88.201
              </div>
            </div>

            <div className="group grid grid-cols-12 gap-4 px-8 py-6 items-center transition-colors hover:bg-surface-container/50 bg-error/5">
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                <span className="text-on-surface font-medium">Oct 23, 2023 · 23:59:01</span>
              </div>
              <div className="col-span-3">
                <span className="px-3 py-1 bg-error/20 text-error text-[10px] font-black uppercase tracking-wider rounded-md border border-error/10">
                  Security Alert
                </span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold">
                  A
                </div>
                <span className="text-on-surface-variant">Auth_Service_Bot</span>
              </div>
              <div className="col-span-3 text-right font-mono text-xs text-on-tertiary-container group-hover:text-primary transition-colors">
                Localhost:8080
              </div>
            </div>
          </div>
          <div className="bg-surface-container-high p-4 flex justify-between items-center px-8">
            <p className="text-xs text-on-tertiary-container font-medium">
              Showing 3 of 1,284 logged events
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-surface-container rounded-lg text-xs font-bold hover:bg-surface-bright transition-all text-on-surface-variant">
                Previous
              </button>
              <button className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-110 transition-all">
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSystemConfiguration;
