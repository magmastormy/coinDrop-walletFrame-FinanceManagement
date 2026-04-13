import React, { useState, useEffect } from 'react';
import thirdPartyIntegrationService from '../../services/thirdPartyIntegrationService';
import './IntegrationStyles.css';

const IntegrationManager = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch user-accessible integrations
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await thirdPartyIntegrationService.getUserAccessibleIntegrations();
        setIntegrations(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  // Filter integrations by tab
  const filteredIntegrations = integrations.filter(integration => {
    if (activeTab === 'all') return true;
    return integration.type === activeTab;
  });

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

  // Get integration icon
  const getIntegrationIcon = (type) => {
    const iconMap = {
      payment_gateway: 'credit_card',
      financial_api: 'account_balance',
      cloud_storage: 'cloud',
      analytics: 'analytics',
      notifications: 'notifications',
      crypto_exchange: 'currency_exchange',
      ai_advisor: 'lightbulb'
    };
    return iconMap[type] || 'extension';
  };

  // Get integration card class based on type
  const getIntegrationCardClass = (type) => {
    const cardClasses = {
      payment_gateway: 'bg-gradient-to-br from-blue-500 to-blue-700',
      financial_api: 'bg-gradient-to-br from-green-500 to-green-700',
      cloud_storage: 'bg-gradient-to-br from-purple-500 to-purple-700',
      analytics: 'bg-gradient-to-br from-orange-500 to-orange-700',
      notifications: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
      crypto_exchange: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
      ai_advisor: 'bg-gradient-to-br from-pink-500 to-pink-700'
    };
    return cardClasses[type] || 'bg-gradient-to-br from-gray-500 to-gray-700';
  };

  return (
    <div className="integration-manager">
      <div className="integration-header">
        <h1 className="integration-title">Third-Party Integrations</h1>
        <p className="integration-description">Connect with your favorite services to enhance your financial experience</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tab navigation */}
      <div className="integration-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          className={`tab-button ${activeTab === 'payment_gateway' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment_gateway')}
        >
          Payment
        </button>
        <button
          className={`tab-button ${activeTab === 'financial_api' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial_api')}
        >
          Financial APIs
        </button>
        <button
          className={`tab-button ${activeTab === 'crypto_exchange' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto_exchange')}
        >
          Crypto
        </button>
        <button
          className={`tab-button ${activeTab === 'ai_advisor' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_advisor')}
        >
          AI
        </button>
      </div>

      {/* Integrations grid */}
      <div className="integration-grid">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading integrations...</p>
          </div>
        ) : filteredIntegrations.length > 0 ? (
          filteredIntegrations.map((integration) => (
            <div key={integration._id} className="integration-card">
              <div className={`integration-card-header ${getIntegrationCardClass(integration.type)}`}>
                <span className="material-symbols-outlined integration-icon">
                  {getIntegrationIcon(integration.type)}
                </span>
                <h3 className="integration-card-title">{integration.name}</h3>
              </div>
              <div className="integration-card-body">
                <p className="integration-card-provider">{integration.provider}</p>
                <p className="integration-card-description">{integration.description || 'No description available'}</p>
                <div className="integration-card-footer">
                  <span className="integration-card-type">{getTypeLabel(integration.type)}</span>
                  <button className="integration-card-button">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-integrations">
            <span className="material-symbols-outlined no-integrations-icon">
              extension
            </span>
            <h3>No integrations available</h3>
            <p>Check back later for new integrations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationManager;