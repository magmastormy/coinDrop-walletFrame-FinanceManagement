import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, fetchTransactionDetails } from '../../slices/adminSlice';

const AdminTransactionsAudit = () => {
  const dispatch = useDispatch();
  const { list: transactions, pagination, loading, error } = useSelector(state => state.admin.transactions);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    userId: ''
  });

  useEffect(() => {
    dispatch(fetchTransactions({ page: currentPage, limit: 10, ...filters }));
  }, [dispatch, currentPage, filters]);

  const handleViewDetails = (transaction) => {
    dispatch(fetchTransactionDetails(transaction._id))
      .unwrap()
      .then((data) => {
        setSelectedTransaction(data);
        setShowModal(true);
      })
      .catch((err) => {
        console.error('Failed to fetch transaction details:', err);
      });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'income':
        return 'text-secondary';
      case 'expense':
        return 'text-error';
      default:
        return 'text-on-surface-variant';
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'income':
        return 'trending_up';
      case 'expense':
        return 'trending_down';
      default:
        return 'swap_horiz';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-error">Error loading transactions: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Filters */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider ml-1">
              Transaction Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="min-w-[140px] cursor-pointer rounded-lg border-none bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant focus:ring-1 focus:ring-primary"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
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
            onClick={() => setFilters({ type: '', startDate: '', endDate: '', userId: '' })}
            className="flex items-center gap-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-semibold px-6 py-2.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">clear_all</span>
            Clear Filters
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-on-primary-container text-on-primary text-sm font-bold px-6 py-2.5 shadow-lg shadow-primary/10 hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-sm">file_download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-xl border border-outline-variant/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-tertiary-container uppercase text-[10px] font-bold tracking-widest border-b border-outline-variant/5">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="group transition-colors hover:bg-surface-container-high/50 cursor-pointer" onClick={() => handleViewDetails(transaction)}>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {transaction.userId?.firstName?.charAt(0) || transaction.userId?.username?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">
                        {transaction.userId?.firstName && transaction.userId?.lastName
                          ? `${transaction.userId.firstName} ${transaction.userId.lastName}`
                          : transaction.userId?.username || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 ${getTypeColor(transaction.type)}`}>
                      <span className="material-symbols-outlined text-sm">
                        {getTypeIcon(transaction.type)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-on-primary-fixed/30 text-primary border border-primary/20">
                      {transaction.categoryId?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${getTypeColor(transaction.type)}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-tertiary-container max-w-xs truncate">
                    {transaction.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(transaction);
                      }}
                      className="rounded-lg p-2 text-on-tertiary-container hover:bg-primary/10 hover:text-primary transition-colors"
                      title="View Details"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex items-center justify-between border-t border-outline-variant/5 bg-surface-container px-6 py-4">
            <p className="text-xs text-on-tertiary-container font-medium">
              Showing <span className="text-on-surface">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>-<span className="text-on-surface">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of <span className="text-on-surface">{pagination.total}</span> transactions
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-tertiary-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(3, pagination.totalPages || 1) }, (_, i) => {
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
              {pagination.totalPages > 3 && (
                <>
                  <span className="text-on-tertiary-container text-xs px-1">...</span>
                  <button
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    className="w-8 h-8 rounded-lg text-xs font-medium text-on-tertiary-container hover:bg-surface-container-high transition-colors"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages || 1, currentPage + 1))}
                disabled={currentPage >= (pagination.totalPages || 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-tertiary-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-outline-variant/20 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-headline font-bold text-on-surface">Transaction Details</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-on-tertiary-container hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-sm text-on-tertiary-container">Transaction ID</span>
                <span className="text-sm font-mono text-on-surface-variant">{selectedTransaction._id}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-sm text-on-tertiary-container">Date</span>
                <span className="text-sm text-on-surface">{formatDate(selectedTransaction.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-sm text-on-tertiary-container">User</span>
                <span className="text-sm text-on-surface">
                  {selectedTransaction.userId?.firstName && selectedTransaction.userId?.lastName
                    ? `${selectedTransaction.userId.firstName} ${selectedTransaction.userId.lastName}`
                    : selectedTransaction.userId?.username || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-sm text-on-tertiary-container">Type</span>
                <span className={`text-sm font-bold uppercase ${getTypeColor(selectedTransaction.type)}`}>
                  {selectedTransaction.type}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-sm text-on-tertiary-container">Category</span>
                <span className="text-sm text-on-surface">{selectedTransaction.categoryId?.name || 'Uncategorized'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-sm text-on-tertiary-container">Amount</span>
                <span className={`text-lg font-bold ${getTypeColor(selectedTransaction.type)}`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              <div className="py-3">
                <span className="text-sm text-on-tertiary-container block mb-2">Description</span>
                <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3">
                  {selectedTransaction.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsAudit;
