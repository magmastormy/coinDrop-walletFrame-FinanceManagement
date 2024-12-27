import React from 'react';
import './styles/categoryPanelStyles.css';

const CategoryPanel = ({ categories }) => {
    return (
        <div className="category-panel">
            <h4>Categories</h4>
            {categories.length === 0 ? (
                <div className="empty-state">No categories available</div>
            ) : (
                <ul className="category-list">
                    {categories.map(category => (
                        <li key={category._id} className="category-item">
                            {category.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CategoryPanel;