import axiosInstance from '../api/userAxios';

export const ADMIN_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.'
};

const formatAdminError = (error) => {
  if (!error.response) {
    return ADMIN_ERRORS.NETWORK_ERROR;
  }

  const { status, data } = error.response;

  if (status === 401) {
    return ADMIN_ERRORS.UNAUTHORIZED;
  }

  if (status === 404) {
    return ADMIN_ERRORS.NOT_FOUND;
  }

  if (status === 400) {
    return data?.message || data?.details || ADMIN_ERRORS.VALIDATION_ERROR;
  }

  return data?.message || data?.details || ADMIN_ERRORS.SERVER_ERROR;
};

const adminService = {
  async getDashboardOverview() {
    try {
      const response = await axiosInstance.get('/admin/dashboard/overview');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getDashboardStatistics() {
    try {
      const response = await axiosInstance.get('/admin/dashboard/statistics');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async listUsers(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getUserDetails(id) {
    try {
      const response = await axiosInstance.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async createUser(userData) {
    try {
      const response = await axiosInstance.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await axiosInstance.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async deleteUser(id) {
    try {
      const response = await axiosInstance.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async listTransactions(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/transactions', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getTransactionDetails(id) {
    try {
      const response = await axiosInstance.get(`/admin/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getTransactionStatistics(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/transactions/statistics', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getSystemHealth() {
    try {
      const response = await axiosInstance.get('/admin/system/health');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getSystemMetrics() {
    try {
      const response = await axiosInstance.get('/admin/system/metrics');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getSummaryReport(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/reports/summary', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getDetailedReport(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/reports/detailed', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  // Disaster Recovery
  async getReplicaSetStatus() {
    try {
      const response = await axiosInstance.get('/admin/disaster-recovery/replica-set');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getBackupStatus() {
    try {
      const response = await axiosInstance.get('/admin/disaster-recovery/backup');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async initiateBackup() {
    try {
      const response = await axiosInstance.post('/admin/disaster-recovery/backup');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async initiateFailover() {
    try {
      const response = await axiosInstance.post('/admin/disaster-recovery/failover');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getFailoverHistory() {
    try {
      const response = await axiosInstance.get('/admin/disaster-recovery/failover-history');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getBackupHistory() {
    try {
      const response = await axiosInstance.get('/admin/disaster-recovery/backup-history');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  // Audit Trail
  async getAuditLogs(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/audit-trail/logs', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getIntegrityStatus() {
    try {
      const response = await axiosInstance.get('/admin/audit-trail/integrity');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async verifyIntegrity() {
    try {
      const response = await axiosInstance.post('/admin/audit-trail/integrity/verify');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async exportAuditLogs(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/audit-trail/export', { params, responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  // Access Controls
  async getRoles() {
    try {
      const response = await axiosInstance.get('/admin/access-controls/roles');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async createRole(roleData) {
    try {
      const response = await axiosInstance.post('/admin/access-controls/roles', roleData);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async updateRole(id, roleData) {
    try {
      const response = await axiosInstance.put(`/admin/access-controls/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async deleteRole(id) {
    try {
      const response = await axiosInstance.delete(`/admin/access-controls/roles/${id}`);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getPermissions() {
    try {
      const response = await axiosInstance.get('/admin/access-controls/permissions');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getSodConstraints() {
    try {
      const response = await axiosInstance.get('/admin/access-controls/sod-constraints');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  // Performance Monitoring
  async getPerformanceMetrics() {
    try {
      const response = await axiosInstance.get('/admin/performance/metrics');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getPerformanceHistory(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/performance/history', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async runLoadTest(testData) {
    try {
      const response = await axiosInstance.post('/admin/performance/load-test', testData);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getLoadTestResults(id) {
    try {
      const response = await axiosInstance.get(`/admin/performance/load-test/${id}`);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getAlerts(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/performance/alerts', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  // System Settings
  async updateSystemSettings(settings) {
    try {
      const response = await axiosInstance.put('/admin/system/settings', settings);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async getSystemSettings() {
    try {
      const response = await axiosInstance.get('/admin/system/settings');
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async configureAlerts(alertConfig) {
    try {
      const response = await axiosInstance.put('/admin/performance/alerts/configure', alertConfig);
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  // Security Logs
  async getSecurityLogs(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/security/logs', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  async exportSecurityLogs(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/security/logs/export', { 
        params, 
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  },

  // Audit Statistics
  async getAuditStatistics(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/audit/statistics', { params });
      return response.data;
    } catch (error) {
      throw formatAdminError(error);
    }
  }
};

export default adminService;
