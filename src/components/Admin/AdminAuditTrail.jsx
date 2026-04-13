import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import adminService from '../../services/adminService';

const AdminAuditTrail = () => {
  const dispatch = useDispatch();
  const [auditLogs, setAuditLogs] = useState([]);
  const [integrityStatus, setIntegrityStatus] = useState({ status: '', lastVerification: '', hash: '', tamperDetected: false });
  const [filterParams, setFilterParams] = useState({
    startDate: '',
    endDate: '',
    action: '',
    user: '',
    status: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivityData, setRecentActivityData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const loadAuditStatistics = async () => {
      try {
        const stats = await adminService.getAuditStatistics();
        setRecentActivityData(stats.activityBreakdown || [
          { name: 'User Actions', value: 65 },
          { name: 'Admin Actions', value: 25 },
          { name: 'System Events', value: 10 }
        ]);
      } catch (err) {
        console.error('Failed to load audit statistics:', err);
      }
    };

    loadAuditStatistics();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logs, integrity] = await Promise.all([
        adminService.getAuditLogs(),
        adminService.getIntegrityStatus()
      ]);
      setAuditLogs(logs);
      setIntegrityStatus(integrity);
    } catch (err) {
      setError(err);
      logError('Error fetching audit trail data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const data = await adminService.exportAuditLogs(filterParams);
      // Create download link for the exported file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err);
      alert('Failed to export audit logs: ' + err);
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      const result = await adminService.verifyIntegrity();
      setIntegrityStatus(result);
      alert('Integrity verification completed');
    } catch (err) {
      setError(err);
      alert('Failed to verify integrity: ' + err);
    }
  };

  const statusMap = {
    success: { label: 'Success', color: 'bg-secondary' },
    failed: { label: 'Failed', color: 'bg-error' }
  };

  const actionTypes = [
    'User created',
    'User updated',
    'User deleted',
    'Role created',
    'Role updated',
    'Role deleted',
    'Transaction created',
    'Transaction updated',
    'System settings updated',
    'Login attempted',
    'Logout'
  ];

  const COLORS = ['#b6c4ff', '#4d76ff', '#2a3b8f'];

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
        <div className="text-error">Error loading audit trail data: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Audit Trail</h1>
          <p className="text-on-tertiary-container mt-2">Monitor system activities and verify audit log integrity</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleVerifyIntegrity}
            className="px-6 py-3 border border-outline-variant/30 rounded-xl font-bold hover:bg-surface-container transition-colors"
          >
            Verify Integrity
          </button>
          <button 
            onClick={handleExportLogs}
            className="px-6 py-3 bg-secondary text-on-secondary-container rounded-xl font-bold hover:bg-secondary/90 transition-colors"
          >
            Export Logs
          </button>
        </div>
      </div>

      {/* Integrity Status */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
              Log Integrity Status
            </p>
            <h2 className="text-2xl font-headline font-bold text-on-surface">
              {integrityStatus.status}
            </h2>
            <p className="text-sm text-on-tertiary-container mt-2">
              Last verified: {new Date(integrityStatus.lastVerification).toLocaleString()}
            </p>
            <p className="text-xs font-mono text-on-tertiary-container mt-1">
              Hash: {integrityStatus.hash}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_check
            </span>
          </div>
        </div>
        {integrityStatus.tamperDetected && (
          <div className="mt-4 p-4 bg-error/10 rounded-lg border border-error/20">
            <p className="text-sm font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              Tampering detected in audit logs
            </p>
            <p className="text-xs text-on-tertiary-container mt-2">
              Some audit logs have been modified or deleted. Please investigate immediately.
            </p>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-headline font-bold text-on-surface mb-6">Filter Audit Logs</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filterParams.startDate}
              onChange={(e) => setFilterParams({ ...filterParams, startDate: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filterParams.endDate}
              onChange={(e) => setFilterParams({ ...filterParams, endDate: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-2">
              Action
            </label>
            <select
              value={filterParams.action}
              onChange={(e) => setFilterParams({ ...filterParams, action: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Actions</option>
              {actionTypes.map((action, index) => (
                <option key={index} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-2">
              Status
            </label>
            <select
              value={filterParams.status}
              onChange={(e) => setFilterParams({ ...filterParams, status: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="px-6 py-3 bg-primary text-on-primary-container rounded-xl font-bold hover:bg-primary/90 transition-colors">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
            Total Events
          </p>
          <h2 className="text-3xl font-headline font-bold text-on-surface">
            1,247
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-secondary text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12.5%
            </span>
            <span className="text-[10px] text-on-tertiary-container">vs last week</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
            Failed Attempts
          </p>
          <h2 className="text-3xl font-headline font-bold text-error">
            23
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-error text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span> +3.2%
            </span>
            <span className="text-[10px] text-on-tertiary-container">vs last week</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
            Admin Actions
          </p>
          <h2 className="text-3xl font-headline font-bold text-on-surface">
            156
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-secondary text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_down</span> -2.1%
            </span>
            <span className="text-[10px] text-on-tertiary-container">vs last week</span>
          </div>
        </div>
      </div>

      {/* Activity Distribution */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Activity Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recentActivityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {recentActivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-4">Top Actions</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#b6c4ff]"></div>
                  <span className="text-sm">User Login</span>
                </div>
                <span className="text-sm font-bold">32%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#4d76ff]"></div>
                  <span className="text-sm">Transaction Created</span>
                </div>
                <span className="text-sm font-bold">28%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#2a3b8f]"></div>
                  <span className="text-sm">User Updated</span>
                </div>
                <span className="text-sm font-bold">15%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#131b2e]"></div>
                  <span className="text-sm">System Settings Changed</span>
                </div>
                <span className="text-sm font-bold">10%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#738296]"></div>
                  <span className="text-sm">Other Actions</span>
                </div>
                <span className="text-sm font-bold">15%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Audit Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-5 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-5 text-sm font-medium">{log.user}</td>
                  <td className="px-6 py-5 text-sm">{log.action}</td>
                  <td className="px-6 py-5 text-sm">{log.resource}</td>
                  <td className="px-6 py-5 text-sm font-mono">{log.ip}</td>
                  <td className="px-6 py-5">
                    <span className={`${statusMap[log.status]?.color || 'bg-error'} text-[10px] font-black px-2 py-1 rounded`}>
                      {statusMap[log.status]?.label || log.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button className="material-symbols-outlined text-on-tertiary-container hover:text-primary transition-colors">
                      more_vert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditTrail;