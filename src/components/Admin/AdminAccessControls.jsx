import { logError } from '../../utils/logger';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import adminService from '../../services/adminService';

const AdminAccessControls = () => {
  const dispatch = useDispatch();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [sodConstraints, setSodConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, sodData] = await Promise.all([
        adminService.getRoles(),
        adminService.getPermissions(),
        adminService.getSodConstraints()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setSodConstraints(sodData);
    } catch (err) {
      setError(err);
      logError('Error fetching access controls data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    // Implement create role logic
    alert('Create role modal opened');
  };

  const handleManagePermissions = () => {
    // Implement manage permissions logic
    alert('Manage permissions modal opened');
  };

  const roleDistributionData = roles.map(role => ({
    name: role.name,
    value: role.users
  }));

  const COLORS = ['#b6c4ff', '#4d76ff', '#2a3b8f', '#131b2e', '#738296'];

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
        <div className="text-error">Error loading access controls data: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Access Controls</h1>
          <p className="text-on-tertiary-container mt-2">Manage roles, permissions, and Segregation of Duties</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleManagePermissions}
            className="px-6 py-3 border border-outline-variant/30 rounded-xl font-bold hover:bg-surface-container transition-colors"
          >
            Manage Permissions
          </button>
          <button 
            onClick={handleCreateRole}
            className="px-6 py-3 bg-secondary text-on-secondary-container rounded-xl font-bold hover:bg-secondary/90 transition-colors"
          >
            Create Role
          </button>
        </div>
      </div>

      {/* Access Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                Total Roles
              </p>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                {roles.length}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                groups
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">check_circle</span> {roles.reduce((acc, role) => acc + role.users, 0)} total users
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                Total Permissions
              </p>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                {permissions.length}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">check_circle</span> Well-defined access levels
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container tracking-widest uppercase mb-1">
                SoD Constraints
              </p>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                {sodConstraints.length}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-bright/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-surface-bright" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">check_circle</span> Enforced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Role Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-4">Role Details</h4>
            <div className="space-y-4">
              {roles.map((role, index) => (
                <div key={role.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm">{role.name}</span>
                  </div>
                  <span className="text-sm font-bold">{role.users} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Roles</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">
              <tr>
                <th className="px-6 py-4">Role Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4">Users</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-5 text-sm font-medium">{role.name}</td>
                  <td className="px-6 py-5 text-sm">{role.description}</td>
                  <td className="px-6 py-5 text-sm">{role.permissions}</td>
                  <td className="px-6 py-5 text-sm">{role.users}</td>
                  <td className="px-6 py-5 text-sm">{role.createdAt}</td>
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

      {/* SoD Constraints */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Segregation of Duties (SoD) Constraints</h3>
        <div className="space-y-6">
          {sodConstraints.map((constraint) => (
            <div key={constraint.id} className="p-6 bg-surface-container rounded-xl border border-outline-variant/30">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-2">{constraint.name}</h4>
                  <p className="text-sm text-on-tertiary-container">{constraint.description}</p>
                </div>
                <span className="bg-secondary/10 text-secondary text-xs font-black px-3 py-1 rounded-full">
                  Enforced
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAccessControls;