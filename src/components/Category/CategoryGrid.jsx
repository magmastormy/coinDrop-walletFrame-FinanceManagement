import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './styles/categoryGridStyles.css';

const CategoryGrid = ({ categories = [], onAddCategory, onSelectCategory, selectedCategory }) => {
  const getTotalAmount = (category) => {
    return category.transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="category-grid-container">
      <div className="grid-header">
        <h2>Categories</h2>
        {onAddCategory && (
          <button className="add-btn" onClick={onAddCategory} aria-label="Add new category">
            + Add Category
          </button>
        )}
      </div>
      <div className="category-grid">
        {categories.map((cat, idx) => {
          const total = getTotalAmount(cat);
          return (
            <div
              key={cat._id}
              className={`category-card ${selectedCategory?._id === cat._id ? 'active' : ''}`}
              onClick={() => onSelectCategory?.(cat)}
              role="button"
              tabIndex={0}
            >
              <div className="icon-wrapper" style={{ backgroundColor: `hsl(${(idx * 137.5) % 360}, 65%, 55%)` }}>
                <FontAwesomeIcon icon={faTag} size="lg" color="#fff" />
              </div>
              <div className="info">
                <span className="name">{cat.name}</span>
                <span className="amount">{formatCurrency(total)}</span>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="chevron" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

CategoryGrid.propTypes = {
  categories: PropTypes.array,
  onAddCategory: PropTypes.func,
  onSelectCategory: PropTypes.func,
  selectedCategory: PropTypes.object
};

export default CategoryGrid;
