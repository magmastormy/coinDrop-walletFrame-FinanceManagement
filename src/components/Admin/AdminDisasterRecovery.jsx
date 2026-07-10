import { logError } from '../../utils/logger';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import adminService from '../../services/adminService';

const AdminDisasterRecovery = () => {
  const dispatch = useDispatch();
  const [replicaSetStatus, setReplicaSetStatus] = useState({ status: '', members: [], electionId: '' });
  const [backupStatus, setBackupStatus] = useState({ lastBackup: '', status: '', size: '', schedule: '' });
  const [failoverHistory, setFailoverHistory] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [replicaStatus, backupStatusData, failoverData, backupData] = await Promise.all([
        adminService.getReplicaSetStatus(),
        adminService.getBackupStatus(),
        adminService.getFailoverHistory(),
        adminService.getBackupHistory()
      ]);
      setReplicaSetStatus(replicaStatus);
      setBackupStatus(backupStatusData);
      setFailoverHistory(failoverData);
      setBackupHistory(backupData);
    } catch (err) {
      setError(err);
      logError('Error fetching disaster recovery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualFailover = async () => {
    try {
      await adminService.initiateFailover();
      alert('Manual failover initiated');
      fetchData();
    } catch (err) {
      setError(err);
      alert('Failed to initiate failover: ' + err);
    }
  };

  const handleBackupNow = async () => {
    try {
      await adminService.initiateBackup();
      alert('Backup initiated');
      fetchData();
    } catch (err) {
      setError(err);
      alert('Failed to initiate backup: ' + err);
    }
  };

  const healthStatusMap = {
    1: { label: 'Healthy', color: 'bg-secondary' },
    0: { label: 'Down', color: 'bg-error' }
  };

  const stateMap = {
    PRIMARY: { label: 'Primary', color: 'bg-secondary' },
    SECONDARY: { label: 'Secondary', color: 'bg-primary' },
    ARBITER: { label: 'Arbiter', color: 'bg-surface-bright' },
    STARTUP: { label: 'Startup', color: 'bg-surface-bright' },
    RECOVERING: { label: 'Recovering', color: 'bg-surface-bright' },
    STARTUP2: { label: 'Startup2', color: 'bg-surface-bright' },
    UNKNOWN: { label: 'Unknown', color: 'bg-error' },
    DOWN: { label: 'Down', color: 'bg-error' },
    ROLLBACK: { label: 'Rollback', color: 'bg-error' },
    REMOVED: { label: 'Removed', color: 'bg-error' }
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
        <div className="text-error">Error loading disaster recovery data: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Disaster Recovery</h1>
          <p className="text-on-tertiary-container mt-2">Monitor and manage replica set status, backups, and failover operations</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleBackupNow}
            className="px-6 py-3 bg-secondary text-on-secondary-container rounded-xl font-bold hover:bg-secondary/90 transition-colors"
          >
            Backup Now
          </button>
          <button 
            onClick={handleManualFailover}
            className="px-6 py-3 border border-outline-variant/30 rounded-xl font-bold hover:bg-surface-container transition-colors"
          >
            Manual Failover
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                Replica Set Status
              </p>
              <h2 className="text-2xl font-headline font-bold text-on-surface">
                {replicaSetStatus.status}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                database
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">check_circle</span> All members healthy
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                Last Backup
              </p>
              <h2 className="text-2xl font-headline font-bold text-on-surface">
                {new Date(backupStatus.lastBackup).toLocaleString()}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                backup
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">check_circle</span> {backupStatus.status}
              </span>
              <span className="text-[10px] text-on-tertiary-container">{backupStatus.size}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                Backup Schedule
              </p>
              <h2 className="text-2xl font-headline font-bold text-on-surface">
                {backupStatus.schedule}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-bright/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-surface-bright" style={{ fontVariationSettings: "'FILL' 1" }}>
                schedule
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">check_circle</span> Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Replica Set Status */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Replica Set Members</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">
              <tr>
                <th className="px-6 py-4">Member ID</th>
                <th className="px-6 py-4">Host</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {replicaSetStatus.members.map((member) => (
                <tr key={member._id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-5 text-sm font-bold">{member._id}</td>
                  <td className="px-6 py-5 text-sm">{member.host}</td>
                  <td className="px-6 py-5">
                    <span className={`${stateMap[member.stateStr]?.color || 'bg-error'} text-[10px] font-black px-2 py-1 rounded`}>
                      {stateMap[member.stateStr]?.label || member.stateStr}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`${healthStatusMap[member.health]?.color || 'bg-error'} text-[10px] font-black px-2 py-1 rounded`}>
                      {healthStatusMap[member.health]?.label || 'Unknown'}
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

      {/* Backup History */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Backup History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {backupHistory.map((backup, index) => (
                <tr key={index} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-5 text-sm">{backup.date}</td>
                  <td className="px-6 py-5">
                    <span className="bg-secondary/10 text-secondary text-[10px] font-black px-2 py-1 rounded">
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm">{backup.size}</td>
                  <td className="px-6 py-5 text-sm">{backup.duration}</td>
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

      {/* Failover History */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Failover History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {failoverHistory.map((failover, index) => (
                <tr key={index} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-5 text-sm">{failover.date}</td>
                  <td className="px-6 py-5 text-sm">{failover.reason}</td>
                  <td className="px-6 py-5 text-sm">{failover.duration}</td>
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

export default AdminDisasterRecovery;