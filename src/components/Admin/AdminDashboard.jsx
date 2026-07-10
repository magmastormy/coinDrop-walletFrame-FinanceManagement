import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardOverview, fetchDashboardStatistics } from '../../slices/adminSlice';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { overview, statistics, loading, error } = useSelector(state => state.admin.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardOverview());
    dispatch(fetchDashboardStatistics());
  }, [dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1
    }).format(num);
  };

  // Prepare chart data
  const userGrowthData = statistics?.userGrowth?.map(item => ({
    date: item._id,
    users: item.count
  })) || [];

  const transactionData = statistics?.transactionStats?.map(item => ({
    date: item._id,
    count: item.count,
    amount: item.totalAmount
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-outline-variant/30 rounded-lg p-3 shadow-xl">
          <p className="text-on-tertiary-container text-xs mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-on-surface text-sm font-semibold">
              {entry.name}: {entry.name === 'amount' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
        <div className="text-error">Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
          </div>
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
            Total Platform Volume
          </p>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface">
            {overview?.totalTransactionAmount ? formatCurrency(overview.totalTransactionAmount) : '$0'}
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-secondary text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12.5%
            </span>
            <span className="text-[10px] text-on-tertiary-container">vs last quarter</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              group
            </span>
          </div>
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
            Active Monthly Users
          </p>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface">
            {overview?.activeUsers ? formatNumber(overview.activeUsers) : '0'}
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-secondary text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span> +4.2%
            </span>
            <span className="text-[10px] text-on-tertiary-container">MoM growth</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              speed
            </span>
          </div>
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
            System Latency
          </p>
          <h2 className="text-3xl font-headline font-extrabold text-secondary">
            24ms
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-secondary text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">check_circle</span> Optimized
            </span>
            <span className="text-[10px] text-on-tertiary-container">Global average</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-on-primary-container p-6 rounded-2xl shadow-xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <span className="material-symbols-outlined text-9xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              payments
            </span>
          </div>
          <p className="text-xs font-black text-on-primary/70 tracking-widest uppercase mb-1">
            Revenue Growth
          </p>
          <h2 className="text-3xl font-headline font-extrabold text-on-primary">
            $12.8M
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="bg-on-primary/20 text-on-primary px-2 py-0.5 rounded text-[10px] font-bold">ANNUALIZED</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card rounded-3xl p-8 relative">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-xl font-headline font-bold text-on-surface">User Growth Over Time</h3>
                <p className="text-sm text-on-tertiary-container">Analysis of institutional vs retail adoption</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-full bg-surface-container-highest text-xs font-bold text-on-surface transition-all hover:bg-surface-bright">Weekly</button>
                <button className="px-4 py-1.5 rounded-full bg-secondary text-xs font-bold text-on-secondary-container transition-all">Monthly</button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b6c4ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#b6c4ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#45464d" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#738296" 
                    fontSize={10}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis stroke="#738296" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#b6c4ff" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#userGradient)" 
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="glass-card rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-headline font-bold text-on-surface">Transaction Volume Heatmap</h3>
              <span className="text-xs text-on-tertiary-container font-medium">Regional load distribution (GMT)</span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              {/* Heatmap blocks */}
              <div className="aspect-square bg-surface-container rounded-sm"></div>
              <div className="aspect-square bg-surface-container-high rounded-sm"></div>
              <div className="aspect-square bg-primary/20 rounded-sm"></div>
              <div className="aspect-square bg-primary/40 rounded-sm"></div>
              <div className="aspect-square bg-primary/60 rounded-sm"></div>
              <div className="aspect-square bg-primary rounded-sm"></div>
              <div className="aspect-square bg-primary/80 rounded-sm"></div>
              <div className="aspect-square bg-primary/40 rounded-sm"></div>
              <div className="aspect-square bg-surface-container-high rounded-sm"></div>
              <div className="aspect-square bg-surface-container rounded-sm"></div>
              <div className="aspect-square bg-surface-container-lowest rounded-sm"></div>
              <div className="aspect-square bg-surface-container-lowest rounded-sm"></div>
              {/* Repeated for visual effect */}
              <div className="aspect-square bg-surface-container-high rounded-sm"></div>
              <div className="aspect-square bg-primary/40 rounded-sm"></div>
              <div className="aspect-square bg-primary/80 rounded-sm"></div>
              <div className="aspect-square bg-secondary rounded-sm"></div>
              <div className="aspect-square bg-primary/60 rounded-sm"></div>
              <div className="aspect-square bg-primary/20 rounded-sm"></div>
              <div className="aspect-square bg-surface-container-high rounded-sm"></div>
              <div className="aspect-square bg-surface-container rounded-sm"></div>
              <div className="aspect-square bg-surface-container-lowest rounded-sm"></div>
              <div className="aspect-square bg-surface-container-lowest rounded-sm"></div>
              <div className="aspect-square bg-surface-container-lowest rounded-sm"></div>
              <div className="aspect-square bg-surface-container-lowest rounded-sm"></div>
            </div>
          </section>
        </div>
        {/* Secondary Sidebar Stats */}
        <div className="space-y-8">
          {/* System Health Section */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-sm font-bold text-on-surface tracking-widest uppercase mb-6 flex items-center justify-between">
              System Status
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] animate-pulse">LIVE</span>
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-on-tertiary-container">database</span>
                  </div>
                  <span className="text-sm font-medium">Main Registry</span>
                </div>
                <span className="text-xs font-bold text-secondary">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-on-tertiary-container">api</span>
                  </div>
                  <span className="text-sm font-medium">Gateway API</span>
                </div>
                <span className="text-xs font-bold text-secondary">Operational</span>
              </div>
              <div className="flex justify-between items-center opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-on-tertiary-container">hub</span>
                  </div>
                  <span className="text-sm font-medium">Node Sync</span>
                </div>
                <span className="text-xs font-bold text-error">Degraded</span>
              </div>
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-outline-variant/30 text-xs font-bold hover:bg-surface-container transition-colors">View Detailed Logs</button>
          </div>
          {/* Recent Admin Activity */}
          <div className="glass-card rounded-3xl p-6 overflow-hidden">
            <h3 className="text-sm font-bold text-on-surface tracking-widest uppercase mb-6">Recent Activity</h3>
            <div className="space-y-6 relative">
              {/* Activity timeline */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-outline-variant/30"></div>
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-surface"></div>
                <p className="text-sm font-medium text-on-surface">Security Policy Updated</p>
                <p className="text-[10px] text-on-tertiary-container mt-1 uppercase font-bold tracking-tighter">By Admin_01 • 12m ago</p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-surface-bright ring-4 ring-surface"></div>
                <p className="text-sm font-medium text-on-surface">New Node Deployed: US-EAST</p>
                <p className="text-[10px] text-on-tertiary-container mt-1 uppercase font-bold tracking-tighter">System Automata • 45m ago</p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-secondary ring-4 ring-surface"></div>
                <p className="text-sm font-medium text-on-surface">Quarterly Audit Report Generated</p>
                <p className="text-[10px] text-on-tertiary-container mt-1 uppercase font-bold tracking-tighter">Financial_Curator_Bot • 2h ago</p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-error ring-4 ring-surface"></div>
                <p className="text-sm font-medium text-on-surface">Failed Login Attempt Blocked</p>
                <p className="text-[10px] text-on-tertiary-container mt-1 uppercase font-bold tracking-tighter">Security Firewall • 4h ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Insights Table */}
      <section className="glass-card rounded-3xl overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center border-b border-outline-variant/10">
          <h3 className="text-lg font-headline font-bold text-on-surface">Performance Anomalies</h3>
          <button className="text-primary text-sm font-bold hover:underline">Download CSV</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">
            <tr>
              <th className="px-8 py-4">Event ID</th>
              <th className="px-8 py-4">Source Entity</th>
              <th className="px-8 py-4">Transaction Value</th>
              <th className="px-8 py-4">Risk Level</th>
              <th className="px-8 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            <tr className="hover:bg-surface-container-high transition-colors group">
              <td className="px-8 py-5 text-sm font-mono text-primary">TX_92834-Z</td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-xs font-bold">JD</div>
                  <span className="text-sm font-medium">Julianne Doe</span>
                </div>
              </td>
              <td className="px-8 py-5 text-sm font-bold">$42,500.00</td>
              <td className="px-8 py-5">
                <span className="bg-secondary/10 text-secondary text-[10px] font-black px-2 py-1 rounded">LOW</span>
              </td>
              <td className="px-8 py-5 text-right">
                <button className="material-symbols-outlined text-on-tertiary-container group-hover:text-primary transition-colors">more_vert</button>
              </td>
            </tr>
            <tr className="hover:bg-surface-container-high transition-colors group">
              <td className="px-8 py-5 text-sm font-mono text-primary">TX_92835-X</td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-xs font-bold">MK</div>
                  <span className="text-sm font-medium">Marcus Kane</span>
                </div>
              </td>
              <td className="px-8 py-5 text-sm font-bold">$124,000.00</td>
              <td className="px-8 py-5">
                <span className="bg-error/10 text-error text-[10px] font-black px-2 py-1 rounded">CRITICAL</span>
              </td>
              <td className="px-8 py-5 text-right">
                <button className="material-symbols-outlined text-on-tertiary-container group-hover:text-primary transition-colors">more_vert</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
