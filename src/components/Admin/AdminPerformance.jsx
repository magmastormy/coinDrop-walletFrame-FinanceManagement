import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import adminService from '../../services/adminService';

const AdminPerformance = () => {
  const dispatch = useDispatch();
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    responseTime: 0,
    requestsPerSecond: 0
  });
  
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadTestResults, setLoadTestResults] = useState({
    maxUsers: 0,
    averageResponseTime: 0,
    throughput: 0,
    errorRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update data every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [metrics, history, alertsData] = await Promise.all([
        adminService.getPerformanceMetrics(),
        adminService.getPerformanceHistory(),
        adminService.getAlerts()
      ]);
      setPerformanceMetrics(metrics);
      setPerformanceHistory(history);
      setAlerts(alertsData);
    } catch (err) {
      setError(err);
      logError('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRunLoadTest = async () => {
    try {
      const result = await adminService.runLoadTest({});
      setLoadTestResults(result);
      alert('Load test initiated');
    } catch (err) {
      setError(err);
      alert('Failed to run load test: ' + err);
    }
  };

  const handleConfigureAlerts = () => {
    // Implement alert configuration logic
    alert('Alert configuration modal opened');
  };

  const severityMap = {
    info: { label: 'Info', color: 'bg-primary' },
    warning: { label: 'Warning', color: 'bg-warning' },
    error: { label: 'Error', color: 'bg-error' }
  };

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
        <div className="text-error">Error loading performance data: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Performance Monitoring</h1>
          <p className="text-on-tertiary-container mt-2">Monitor system performance and optimize resource usage</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleConfigureAlerts}
            className="px-6 py-3 border border-outline-variant/30 rounded-xl font-bold hover:bg-surface-container transition-colors"
          >
            Configure Alerts
          </button>
          <button 
            onClick={handleRunLoadTest}
            className="px-6 py-3 bg-secondary text-on-secondary-container rounded-xl font-bold hover:bg-secondary/90 transition-colors"
          >
            Run Load Test
          </button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                CPU Usage
              </p>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                {performanceMetrics.cpu}%
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                memory
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-surface-container rounded-full h-2">
              <div 
                className="bg-secondary h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${performanceMetrics.cpu}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                Memory Usage
              </p>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                {performanceMetrics.memory}%
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                storage
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-surface-container rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${performanceMetrics.memory}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                Response Time
              </p>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                {performanceMetrics.responseTime}ms
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-bright/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-surface-bright" style={{ fontVariationSettings: "'FILL' 1" }}>
                speed
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-surface-container rounded-full h-2">
              <div 
                className="bg-surface-bright h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, (performanceMetrics.responseTime / 200) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance History */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Performance History</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceHistory}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b6c4ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#b6c4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4d76ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4d76ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a3b8f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2a3b8f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#45464d" opacity={0.3} />
              <XAxis dataKey="time" stroke="#738296" fontSize={10} />
              <YAxis stroke="#738296" fontSize={10} />
              <Tooltip />
              <Area type="monotone" dataKey="cpu" stroke="#b6c4ff" fillOpacity={1} fill="url(#cpuGradient)" name="CPU Usage (%)" />
              <Area type="monotone" dataKey="memory" stroke="#4d76ff" fillOpacity={1} fill="url(#memoryGradient)" name="Memory Usage (%)" />
              <Area type="monotone" dataKey="responseTime" stroke="#2a3b8f" fillOpacity={1} fill="url(#responseGradient)" name="Response Time (ms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Load Test Results */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Load Test Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-on-tertiary-container">Max Users</p>
                <h4 className="text-2xl font-bold text-on-surface">{loadTestResults.maxUsers}</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  group
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-on-tertiary-container">Average Response Time</p>
                <h4 className="text-2xl font-bold text-on-surface">{loadTestResults.averageResponseTime}ms</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  speed
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-on-tertiary-container">Throughput</p>
                <h4 className="text-2xl font-bold text-on-surface">{loadTestResults.throughput} req/sec</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-bright/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-surface-bright" style={{ fontVariationSettings: "'FILL' 1" }}>
                  data_object
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-on-tertiary-container">Error Rate</p>
                <h4 className="text-2xl font-bold text-on-surface">{loadTestResults.errorRate}%</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                  error
                </span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Max Users', value: loadTestResults.maxUsers },
                { name: 'Avg Response Time', value: loadTestResults.averageResponseTime },
                { name: 'Throughput', value: loadTestResults.throughput },
                { name: 'Error Rate', value: loadTestResults.errorRate }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#45464d" opacity={0.3} />
                <XAxis dataKey="name" stroke="#738296" fontSize={10} />
                <YAxis stroke="#738296" fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" name="Value">
                  {[
                    { name: 'Max Users', value: loadTestResults.maxUsers },
                    { name: 'Avg Response Time', value: loadTestResults.averageResponseTime },
                    { name: 'Throughput', value: loadTestResults.throughput },
                    { name: 'Error Rate', value: loadTestResults.errorRate }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Recent Alerts</h3>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full ${severityMap[alert.severity]?.color || 'bg-error'} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {alert.severity === 'info' ? 'info' : alert.severity === 'warning' ? 'warning' : 'error'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-on-surface">{alert.message}</h4>
                  <span className={`${severityMap[alert.severity]?.color || 'bg-error'} text-[10px] font-black px-2 py-1 rounded`}>
                    {severityMap[alert.severity]?.label || alert.severity}
                  </span>
                </div>
                <p className="text-xs text-on-tertiary-container mt-2">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPerformance;