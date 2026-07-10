import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, fetchUsers } from '../../slices/adminSlice';
import adminService from '../../services/adminService';

const AdminSecurityLogs = () => {
  const dispatch = useDispatch();
  const { list: transactions } = useSelector(state => state.admin.transactions);
  const { list: users } = useSelector(state => state.admin.users);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: ''
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dispatch(fetchTransactions({ limit: 100 }));
    dispatch(fetchUsers({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const fetchSecurityLogs = async () => {
      try {
        setLoading(true);
        const logs = await adminService.getSecurityLogs(filters);
        setSecurityLogs(logs);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityLogs();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExportLogs = async () => {
    try {
      const data = await adminService.exportSecurityLogs(filters);
      // Create download link for exported file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err);
      alert('Failed to export security logs: ' + err);
    }
  };

  const logsPerPage = 10;
  const totalPages = Math.ceil(securityLogs.length / logsPerPage);
  const paginatedLogs = securityLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider ml-1">
              Event Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              className="min-w-[160px] cursor-pointer rounded-lg border-none bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant focus:ring-1 focus:ring-primary"
            >
              <option value="">All Events</option>
              <option value="USER_REGISTERED">User Registered</option>
              <option value="USER_LOGIN">User Login</option>
              <option value="TRANSACTION_CREATED">Transaction Created</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider ml-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="min-w-[140px] cursor-pointer rounded-lg border-none bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider ml-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="min-w-[140px] cursor-pointer rounded-lg border-none bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFilters({ eventType: '', startDate: '', endDate: '' })}
            className="flex items-center gap-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-semibold px-6 py-2.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">clear_all</span>
            Clear Filters
          </button>
          <button 
            onClick={handleExportLogs}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-on-primary-container text-on-primary text-sm font-bold px-6 py-2.5 shadow-lg shadow-primary/10 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">file_download</span>
            Export Logs
          </button>
        </div>
      </div>

      {/* Security Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-on-surface">shield</span>
          </div>
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">Total Events</p>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface">{securityLogs.length}</h2>
        </div>
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-secondary">check_circle</span>
          </div>
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">Successful</p>
          <h2 className="text-3xl font-headline font-extrabold text-secondary">
            {securityLogs.filter(l => l.status === 'SUCCESS').length}
          </h2>
        </div>
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-warning">person_add</span>
          </div>
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">New Users</p>
          <h2 className="text-3xl font-headline font-extrabold text-warning">
            {securityLogs.filter(l => l.eventType === 'USER_REGISTERED').length}
          </h2>
        </div>
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">swap_horiz</span>
          </div>
          <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">Transactions</p>
          <h2 className="text-3xl font-headline font-extrabold text-primary">
            {securityLogs.filter(l => l.eventType === 'TRANSACTION_CREATED').length}
          </h2>
        </div>
      </div>

      {/* Security Logs Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-xl border border-outline-variant/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-tertiary-container uppercase text-[10px] font-bold tracking-widest border-b border-outline-variant/5">
                <th className="px-6 py-5">Timestamp</th>
                <th className="px-6 py-5">Event Type</th>
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5">IP Address</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="group transition-colors hover:bg-surface-container-high/50">
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md border px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-secondary/20 text-secondary border-secondary/30">
                      {log.eventType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {log.user?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">
                        {log.user}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-on-tertiary-container">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span className="text-xs font-bold uppercase text-secondary">
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant max-w-md truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant/5 bg-surface-container px-6 py-4">
            <p className="text-xs text-on-tertiary-container font-medium">
              Showing <span className="text-on-surface">
                {(currentPage - 1) * logsPerPage + 1}
              </span>-<span className="text-on-surface">
                {Math.min(currentPage * logsPerPage, filteredLogs.length)}
              </span> of <span className="text-on-surface">{filteredLogs.length}</span> events
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-tertiary-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      pageNum === currentPage
                        ? 'bg-primary/20 text-primary'
                        : 'text-on-tertiary-container hover:bg-surface-container-high'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 3 && (
                <>
                  <span className="text-on-tertiary-container text-xs px-1">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-lg text-xs font-medium text-on-tertiary-container hover:bg-surface-container-high transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-tertiary-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSecurityLogs;