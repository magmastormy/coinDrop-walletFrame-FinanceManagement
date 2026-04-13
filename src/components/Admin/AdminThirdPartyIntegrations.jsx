import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import thirdPartyIntegrationService from '../../services/thirdPartyIntegrationService';

const AdminThirdPartyIntegrations = () => {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [formData, setFormData] = useState({
    type: 'payment_gateway',
    provider: '',
    name: '',
    description: '',
    isEnabled: false,
    userAccessible: false,
    config: {},
    credentials: {},
    rateLimits: {},
    webhookConfig: {},
    notes: ''
  });

  // Fetch integrations
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (filterType !== 'all') {
        params.type = filterType;
      }
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await thirdPartyIntegrationService.listIntegrations(params);
      setIntegrations(response.data.integrations);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filterType, filterStatus]);

  // Fetch integrations on mount and when filters change
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle JSON input changes
  const handleJsonInputChange = (name, value) => {
    try {
      const parsedValue = JSON.parse(value);
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue
      }));
    } catch (error) {
      // Allow invalid JSON temporarily
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle create integration
  const handleCreateIntegration = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await thirdPartyIntegrationService.createIntegration(formData);
      setShowCreateModal(false);
      setFormData({
        type: 'payment_gateway',
        provider: '',
        name: '',
        description: '',
        isEnabled: false,
        userAccessible: false,
        config: {},
        credentials: {},
        rateLimits: {},
        webhookConfig: {},
        notes: ''
      });
      setSuccessMessage('Integration created successfully');
      fetchIntegrations();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit integration
  const handleEditIntegration = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await thirdPartyIntegrationService.updateIntegration(editingIntegration._id, formData);
      setShowEditModal(false);
      setEditingIntegration(null);
      setSuccessMessage('Integration updated successfully');
      fetchIntegrations();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete integration
  const handleDeleteIntegration = async (id) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await thirdPartyIntegrationService.deleteIntegration(id);
      setSuccessMessage('Integration deleted successfully');
      fetchIntegrations();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle test integration
  const handleTestIntegration = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await thirdPartyIntegrationService.testIntegration(id);
      setSuccessMessage('Integration test completed successfully');
      fetchIntegrations();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle integration status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      await thirdPartyIntegrationService.updateIntegrationStatus(id, {
        isEnabled: !currentStatus
      });
      setSuccessMessage('Integration status updated successfully');
      fetchIntegrations();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (integration) => {
    setEditingIntegration(integration);
    setFormData({
      type: integration.type,
      provider: integration.provider,
      name: integration.name,
      description: integration.description || '',
      isEnabled: integration.isEnabled,
      userAccessible: integration.userAccessible,
      config: integration.config || {},
      credentials: integration.credentials || {},
      rateLimits: integration.rateLimits || {},
      webhookConfig: integration.webhookConfig || {},
      notes: integration.notes || ''
    });
    setShowEditModal(true);
  };

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingIntegration(null);
    setFormData({
      type: 'payment_gateway',
      provider: '',
      name: '',
      description: '',
      isEnabled: false,
      userAccessible: false,
      config: {},
      credentials: {},
      rateLimits: {},
      webhookConfig: {},
      notes: ''
    });
  };

  // Get integration type label
  const getTypeLabel = (type) => {
    const typeLabels = {
      payment_gateway: 'Payment Gateway',
      financial_api: 'Financial API',
      cloud_storage: 'Cloud Storage',
      analytics: 'Analytics',
      notifications: 'Notifications',
      crypto_exchange: 'Crypto Exchange',
      ai_advisor: 'AI Advisor'
    };
    return typeLabels[type] || type;
  };

  // Get status label and class
  const getStatusInfo = (status) => {
    const statusInfo = {
      active: { label: 'Active', class: 'bg-green-500' },
      inactive: { label: 'Inactive', class: 'bg-gray-500' },
      error: { label: 'Error', class: 'bg-red-500' },
      maintenance: { label: 'Maintenance', class: 'bg-yellow-500' }
    };
    return statusInfo[status] || { label: status, class: 'bg-gray-500' };
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Third-Party Integrations</h1>
        <p className="admin-description">Manage and configure third-party services for both admin and user access</p>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filter section */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="filterType">Type:</label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="payment_gateway">Payment Gateway</option>
            <option value="financial_api">Financial API</option>
            <option value="cloud_storage">Cloud Storage</option>
            <option value="analytics">Analytics</option>
            <option value="notifications">Notifications</option>
            <option value="crypto_exchange">Crypto Exchange</option>
            <option value="ai_advisor">AI Advisor</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filterStatus">Status:</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Integration
        </button>
      </div>

      {/* Integrations table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading integrations...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Provider</th>
                <th>Status</th>
                <th>User Accessible</th>
                <th>Last Tested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {integrations.length > 0 ? (
                integrations.map((integration) => (
                  <tr key={integration._id}>
                    <td>{integration.name}</td>
                    <td>{getTypeLabel(integration.type)}</td>
                    <td>{integration.provider}</td>
                    <td>
                      <span className={`status-badge ${getStatusInfo(integration.status).class}`}>
                        {getStatusInfo(integration.status).label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${integration.userAccessible ? 'bg-green-500' : 'bg-gray-500'}`}>
                        {integration.userAccessible ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      {integration.lastTested ? (
                        new Date(integration.lastTested).toLocaleString()
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openEditModal(integration)}
                          className="btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTestIntegration(integration._id)}
                          className="btn-info"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleToggleStatus(integration._id, integration.isEnabled)}
                          className={`btn ${integration.isEnabled ? 'btn-warning' : 'btn-success'}`}
                        >
                          {integration.isEnabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteIntegration(integration._id)}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No integrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Integration Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Integration</h2>
              <button onClick={closeModals} className="modal-close">×</button>
            </div>
            <form onSubmit={handleCreateIntegration} className="modal-form">
              <div className="form-group">
                <label htmlFor="type">Integration Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="payment_gateway">Payment Gateway</option>
                  <option value="financial_api">Financial API</option>
                  <option value="cloud_storage">Cloud Storage</option>
                  <option value="analytics">Analytics</option>
                  <option value="notifications">Notifications</option>
                  <option value="crypto_exchange">Crypto Exchange</option>
                  <option value="ai_advisor">AI Advisor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="provider">Provider *</label>
                <input
                  type="text"
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Integration Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                ></textarea>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="isEnabled"
                  name="isEnabled"
                  checked={formData.isEnabled}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="isEnabled">Enable Integration</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="userAccessible"
                  name="userAccessible"
                  checked={formData.userAccessible}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="userAccessible">Allow User Access</label>
              </div>

              <div className="form-group">
                <label htmlFor="config">Configuration (JSON)</label>
                <textarea
                  id="config"
                  name="config"
                  value={typeof formData.config === 'object' ? JSON.stringify(formData.config, null, 2) : formData.config}
                  onChange={(e) => handleJsonInputChange('config', e.target.value)}
                  className="form-textarea json-input"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="credentials">Credentials (JSON)</label>
                <textarea
                  id="credentials"
                  name="credentials"
                  value={typeof formData.credentials === 'object' ? JSON.stringify(formData.credentials, null, 2) : formData.credentials}
                  onChange={(e) => handleJsonInputChange('credentials', e.target.value)}
                  className="form-textarea json-input"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Admin Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-textarea"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModals} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Integration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Integration Modal */}
      {showEditModal && editingIntegration && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Integration: {editingIntegration.name}</h2>
              <button onClick={closeModals} className="modal-close">×</button>
            </div>
            <form onSubmit={handleEditIntegration} className="modal-form">
              <div className="form-group">
                <label htmlFor="type">Integration Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="payment_gateway">Payment Gateway</option>
                  <option value="financial_api">Financial API</option>
                  <option value="cloud_storage">Cloud Storage</option>
                  <option value="analytics">Analytics</option>
                  <option value="notifications">Notifications</option>
                  <option value="crypto_exchange">Crypto Exchange</option>
                  <option value="ai_advisor">AI Advisor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="provider">Provider *</label>
                <input
                  type="text"
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Integration Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                ></textarea>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="isEnabled"
                  name="isEnabled"
                  checked={formData.isEnabled}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="isEnabled">Enable Integration</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="userAccessible"
                  name="userAccessible"
                  checked={formData.userAccessible}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="userAccessible">Allow User Access</label>
              </div>

              <div className="form-group">
                <label htmlFor="config">Configuration (JSON)</label>
                <textarea
                  id="config"
                  name="config"
                  value={typeof formData.config === 'object' ? JSON.stringify(formData.config, null, 2) : formData.config}
                  onChange={(e) => handleJsonInputChange('config', e.target.value)}
                  className="form-textarea json-input"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="credentials">Credentials (JSON)</label>
                <textarea
                  id="credentials"
                  name="credentials"
                  value={typeof formData.credentials === 'object' ? JSON.stringify(formData.credentials, null, 2) : formData.credentials}
                  onChange={(e) => handleJsonInputChange('credentials', e.target.value)}
                  className="form-textarea json-input"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Admin Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-textarea"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModals} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Integration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThirdPartyIntegrations;