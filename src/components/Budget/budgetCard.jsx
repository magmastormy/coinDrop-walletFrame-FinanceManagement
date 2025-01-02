import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faChartLine, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import './styles/budgetCardStyles.css';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = () => {
    const spent = budget.spent || 0;
    const progress = (spent / budget.amount) * 100;
    return Math.min(progress, 100);
  };

  const getStatusColor = () => {
    const progress = calculateProgress();
    if (progress >= 90) return 'var(--error)';
    if (progress >= 70) return 'var(--warning)';
    return 'var(--accent-2)';
  };

  return (
    <motion.div 
      className="budget-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="budget-header">
        <h3>{budget.name}</h3>
        <div className="budget-type-badge">
          {budget.type}
        </div>
      </div>

      <div className="budget-progress">
        <div className="progress-info">
          <span>Progress</span>
          <span>{calculateProgress().toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${calculateProgress()}%`,
              backgroundColor: getStatusColor()
            }}
            role="progressbar"
            aria-valuenow={calculateProgress()}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
        <div className="budget-amounts">
          <span>Spent: {formatCurrency(budget.spent || 0)}</span>
          <span>of {formatCurrency(budget.amount)}</span>
        </div>
      </div>

      <div className="budget-details">
        <div className="detail-item">
          <FontAwesomeIcon icon={faChartLine} aria-hidden="true" />
          <span>Category: {budget.categoryId?.name || 'Uncategorized'}</span>
        </div>
        <div className="detail-item">
          <FontAwesomeIcon icon={faCalendarAlt} aria-hidden="true" />
          <span>
            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
          </span>
        </div>
      </div>

      <div className="budget-status" style={{ color: getStatusColor() }}>
        {budget.status}
      </div>

      <div className="budget-actions">
        <button 
          onClick={() => onEdit(budget)}
          className="edit-btn"
          aria-label="Edit budget"
        >
          <FontAwesomeIcon icon={faEdit} aria-hidden="true" />
          Edit
        </button>
        <button 
          onClick={() => onDelete(budget._id)}
          className="delete-btn"
          aria-label="Delete budget"
        >
          <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
          Delete
        </button>
      </div>
    </motion.div>
  );
};

export default BudgetCard;