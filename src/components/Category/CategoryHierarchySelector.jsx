import React, { useState, useEffect } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import categoryService from '../../services/categoryService';
import { useSelector } from 'react-redux';


const CategoryHierarchySelector = ({
    onSelect,
    selectedCategory,
    allowSubcategories = true,
    budgetType = null
}) => {
    const [categories, setCategories] = useState([]);
    const [expanded, setExpanded] = useState([]);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        loadCategories();
    }, [user.id]);

    const loadCategories = async () => {
        try {
            const hierarchy = await categoryService.getCategoryHierarchy(user.id);
            setCategories(hierarchy);
            // Expand root categories by default
            setExpanded(hierarchy.map(cat => cat._id));
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const handleToggle = (event, nodeIds) => {
        setExpanded(nodeIds);
    };

    const handleSelect = (event, categoryId) => {
        const findCategory = (cats, id) => {
            for (const cat of cats) {
                if (cat._id === id) return cat;
                if (cat.children) {
                    const found = findCategory(cat.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const category = findCategory(categories, categoryId);
        if (category) {
            // Only allow selection if category supports the budget type
            if (budgetType && !category.budgetTypes.includes(budgetType)) {
                return;
            }
            // Only allow selection of leaf categories if subcategories aren't allowed
            if (!allowSubcategories && category.children?.length > 0) {
                return;
            }
            onSelect(category);
        }
    };

    const renderTree = (nodes) => (
        <TreeItem
            key={nodes._id}
            nodeId={nodes._id}
            label={
                <div className="category-tree-item">
                    <FontAwesomeIcon
                        icon={nodes.icon}
                        style={{ color: nodes.color }}
                        className="category-icon"
                    />
                    <span className="category-name">{nodes.name}</span>
                    {budgetType && !nodes.budgetTypes.includes(budgetType) && (
                        <span className="category-type-mismatch">
                            (Not available for {budgetType})
                        </span>
                    )}
                </div>
            }
            className={`
                category-tree-node
                ${selectedCategory?._id === nodes._id ? 'selected' : ''}
                ${budgetType && !nodes.budgetTypes.includes(budgetType) ? 'disabled' : ''}
                ${!allowSubcategories && nodes.children?.length > 0 ? 'disabled' : ''}
            `}
        >
            {Array.isArray(nodes.children) && nodes.children.length > 0
                ? nodes.children.map((node) => renderTree(node))
                : null}
        </TreeItem>
    );

    return (
        <TreeView
            className="category-hierarchy-selector"
            defaultCollapseIcon={<FontAwesomeIcon icon={faChevronDown} />}
            defaultExpandIcon={<FontAwesomeIcon icon={faChevronRight} />}
            expanded={expanded}
            selected={selectedCategory?._id || ''}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
        >
            {categories.map((category) => renderTree(category))}
        </TreeView>
    );
};

export default CategoryHierarchySelector;
