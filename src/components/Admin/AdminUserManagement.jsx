import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, deleteUser, createUser, updateUser } from '../../slices/adminSlice';
import { toast } from 'react-toastify';

const AdminUserManagement = () => {
  const dispatch = useDispatch();
  const { list: users, pagination, loading, error } = useSelector(state => state.admin.users);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  const validateForm = () => {
    const errors = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Invalid email format';
    }
    if (!showEditModal && !formData.password) errors.password = 'Password is required';
    if (!showEditModal && formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = () => {
    if (!validateForm() || loading) return;
    
    dispatch(createUser(formData))
      .unwrap()
      .then(() => {
        toast.success('User created successfully');
        setShowCreateModal(false);
        resetForm();
        dispatch(fetchUsers({ page: currentPage, limit: 10 }));
      })
      .catch((err) => {
        toast.error(err || 'Failed to create user');
      });
  };

  const handleUpdateUser = () => {
    if (!validateForm() || loading || !selectedUser?._id) return;
    
    const updateData = { ...formData };
    if (!updateData.password) delete updateData.password;
    
    dispatch(updateUser({ id: selectedUser._id, userData: updateData }))
      .unwrap()
      .then(() => {
        toast.success('User updated successfully');
        setShowEditModal(false);
        resetForm();
        dispatch(fetchUsers({ page: currentPage, limit: 10 }));
      })
      .catch((err) => {
        toast.error(err || 'Failed to update user');
      });
  };

  const handleDeleteUser = () => {
    if (!selectedUser?._id || loading) return;
    
    dispatch(deleteUser(selectedUser._id))
      .unwrap()
      .then(() => {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        dispatch(fetchUsers({ page: currentPage, limit: 10 }));
      })
      .catch((err) => {
        toast.error(err || 'Failed to delete user');
      });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'user'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user'
    });
    setFormErrors({});
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (firstName, lastName, username) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return username?.charAt(0).toUpperCase() || 'U';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-error">Error loading users: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider ml-1">
              Member Tier
            </label>
            <select
              className="min-w-[140px] cursor-pointer rounded-lg border-none bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant focus:ring-1 focus:ring-primary"
            >
              <option>All Tiers</option>
              <option>Elite</option>
              <option>Pro</option>
              <option>Basic</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider ml-1">
              Account Status
            </label>
            <select
              className="min-w-[140px] cursor-pointer rounded-lg border-none bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant focus:ring-1 focus:ring-primary"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Suspended</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider ml-1">
              Batch Control
            </label>
            <button className="bg-surface-container-high hover:bg-surface-container-highest transition-colors border-none rounded-lg text-sm px-4 py-2.5 flex items-center gap-2 text-on-surface font-medium">
              Bulk Actions <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-semibold px-6 py-2.5 transition-all">
            <span className="material-symbols-outlined text-sm">file_download</span>
            Export CSV
          </button>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-on-primary-container text-on-primary text-sm font-bold px-6 py-2.5 shadow-lg shadow-primary/10 hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Create User
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-xl border border-outline-variant/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-tertiary-container uppercase text-[10px] font-bold tracking-widest border-b border-outline-variant/5">
                <th className="px-6 py-5 w-12 text-center">
                  <input type="checkbox" className="rounded bg-surface-container-highest border-outline-variant/30 text-primary focus:ring-primary ring-offset-surface" />
                </th>
                <th className="px-6 py-5">Username</th>
                <th className="px-6 py-5">Email Address</th>
                <th className="px-6 py-5">Tier</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Last Login</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {users.map((user) => (
                <tr key={user._id} className="group transition-colors hover:bg-surface-container-high/50">
                  <td className="px-6 py-4 text-center">
                    <input type="checkbox" className="rounded bg-surface-container-highest border-outline-variant/30 text-primary focus:ring-primary ring-offset-surface" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(user.firstName, user.lastName, user.username)}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">
                        {user.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-on-primary-fixed/30 text-primary border border-primary/20">
                      {user.role || 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.5)]"></span>
                      <span className="text-xs font-semibold text-on-surface">
                        Active
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-on-tertiary-container font-medium">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 text-on-tertiary-container hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                        title="Edit Profile"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button className="p-2 text-on-tertiary-container hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Reset Password">
                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-2 text-on-tertiary-container hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="Suspend Access"
                      >
                        <span className="material-symbols-outlined text-lg">block</span>
                      </button>
                    </div>
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
              </span> of <span className="text-on-surface">{pagination.total}</span> curators
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

      {/* Dashboard Footer Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">how_to_reg</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-widest">Growth Velocity</p>
            <h4 className="text-xl font-bold text-on-surface">+12.4% <span className="text-xs font-medium text-secondary ml-1">↑ month</span></h4>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">stars</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-widest">Elite Migration</p>
            <h4 className="text-xl font-bold text-on-surface">412 Users <span className="text-xs font-medium text-on-tertiary-container ml-1">total</span></h4>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error">
            <span className="material-symbols-outlined">gpp_bad</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-widest">Risk Flag Rate</p>
            <h4 className="text-xl font-bold text-on-surface">0.82% <span className="text-xs font-medium text-error ml-1">Stable</span></h4>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-surface border border-outline-variant/20 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-headline font-bold text-on-surface">Create New User</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-on-tertiary-container hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${formErrors.username ? 'border-error' : 'border-outline-variant/30'} bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent`}
                  placeholder="Enter username"
                />
                {formErrors.username && <p className="text-error text-xs mt-1">{formErrors.username}</p>}
              </div>
              
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${formErrors.email ? 'border-error' : 'border-outline-variant/30'} bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent`}
                  placeholder="Enter email"
                />
                {formErrors.email && <p className="text-error text-xs mt-1">{formErrors.email}</p>}
              </div>
              
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${formErrors.password ? 'border-error' : 'border-outline-variant/30'} bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent`}
                  placeholder="Enter password (min 6 chars)"
                />
                {formErrors.password && <p className="text-error text-xs mt-1">{formErrors.password}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-bright"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-primary to-on-primary-container px-4 py-2.5 text-sm font-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-surface border border-outline-variant/20 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-headline font-bold text-on-surface">Edit User</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-2 text-on-tertiary-container hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${formErrors.username ? 'border-error' : 'border-outline-variant/30'} bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent`}
                />
                {formErrors.username && <p className="text-error text-xs mt-1">{formErrors.username}</p>}
              </div>
              
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${formErrors.email ? 'border-error' : 'border-outline-variant/30'} bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent`}
                />
                {formErrors.email && <p className="text-error text-xs mt-1">{formErrors.email}</p>}
              </div>
              
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent"
                  placeholder="Enter new password (optional)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider mb-1 block">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-lg bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-bright"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-primary to-on-primary-container px-4 py-2.5 text-sm font-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-surface border border-outline-variant/20 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-headline font-bold text-on-surface">Delete User</h3>
                <p className="text-sm text-on-tertiary-container">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-on-surface-variant mb-6">
              Are you sure you want to delete user <span className="text-on-surface font-semibold">{selectedUser.username}</span>? All their data will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-lg bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-bright"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="flex-1 rounded-lg bg-error px-4 py-2.5 text-sm font-bold text-on-error-container shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
