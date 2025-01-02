import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTag, 
    faFolderOpen,
    faChartPie,
    faPlusCircle
} from '@fortawesome/free-solid-svg-icons';
import './styles/categoryPanelStyles.css';

const CategoryPanel = ({ categories = [], onAddCategory, onSelectCategory, selectedCategory }) => {
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

    const getRandomColor = (index) => {
        const hue = (index * 137.5) % 360; // Golden angle approximation
        return `hsl(${hue}, 70%, 50%)`;
    };

    return (
        <div 
            className="category-panel"
            role="region"
            aria-label="Categories panel"
        >
            <div className="panel-header">
                <h2>
                    <FontAwesomeIcon icon={faFolderOpen} aria-hidden="true" />
                    Categories
                </h2>
                {onAddCategory && (
                    <button 
                        className="add-category-btn"
                        onClick={onAddCategory}
                        aria-label="Add new category"
                    >
                        <FontAwesomeIcon icon={faPlusCircle} aria-hidden="true" />
                        Add Category
                    </button>
                )}
            </div>

            {categories.length === 0 ? (
                <motion.div 
                    className="empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    role="status"
                >
                    <FontAwesomeIcon icon={faChartPie} className="empty-icon" aria-hidden="true" />
                    <h3>No Categories Yet</h3>
                    <p>Create categories to better organize your transactions</p>
                    {onAddCategory && (
                        <button 
                            onClick={onAddCategory}
                            className="create-first-btn"
                            aria-label="Create your first category"
                        >
                            Create First Category
                        </button>
                    )}
                </motion.div>
            ) : (
                <div 
                    className="category-list-container"
                    role="list"
                    aria-label="List of categories"
                >
                    <AnimatePresence>
                        {categories.map((category, index) => (
                            <motion.div
                                key={category._id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                role="listitem"
                            >
                                <button 
                                    className={`category-item ${selectedCategory?._id === category._id ? 'selected' : ''}`}
                                    onClick={() => onSelectCategory?.(category)}
                                    aria-selected={selectedCategory?._id === category._id}
                                >
                                    <div className="category-icon" style={{ backgroundColor: getRandomColor(index) }}>
                                        <FontAwesomeIcon icon={faTag} aria-hidden="true" />
                                    </div>
                                    <div className="category-details">
                                        <span className="category-name">{category.name}</span>
                                        <span className="transaction-count">
                                            {category.transactions?.length || 0} transactions
                                        </span>
                                    </div>
                                    <div className="category-amount">
                                        {formatCurrency(getTotalAmount(category))}
                                    </div>
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default CategoryPanel;