import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Folder, Tag } from 'lucide-react';
import categoryService from '../../services/categoryService';
import { useSelector } from 'react-redux';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';

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
            setExpanded(hierarchy.map(cat => cat._id));
        } catch (_) {
            // Error handling is done by service
        }
    };

    const toggleExpand = (categoryId) => {
        setExpanded(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const canSelectCategory = (category) => {
        if (budgetType && !category.budgetTypes.includes(budgetType)) return false;
        if (!allowSubcategories && category.children?.length > 0) return false;
        return true;
    };

    const renderCategory = (category, depth = 0) => {
        const isExpanded = expanded.includes(category._id);
        const isSelected = selectedCategory?._id === category._id;
        const canSelect = canSelectCategory(category);

        return (
            <div key={category._id} className="space-y-2">
                <Card
                    variant={isSelected ? "selected" : "default"}
                    elevation={1}
                    className={cn(
                        "flex items-center gap-3 p-3",
                        !canSelect && "opacity-60",
                        canSelect && "cursor-pointer hover:bg-surface-2"
                    )}
                    onClick={() => canSelect && onSelect(category)}
                >
                    <button 
                        className="flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(category._id);
                        }}
                        disabled={!category.children?.length}
                    >
                        {category.children?.length ? (
                            isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )
                        ) : (
                            <div className="w-4 h-4" />
                        )}
                    </button>

                    <div className="flex-1 flex items-center gap-3">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                        )}>
                            {category.name}
                        </span>
                    </div>
                </Card>

                <AnimatePresence>
                    {isExpanded && category.children?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-6"
                        >
                            {category.children.map(child => renderCategory(child, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <Card variant="default" elevation={1} className="p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Category Hierarchy</h3>
            </div>
            
            <div className="space-y-2">
                {categories.map(category => renderCategory(category))}
            </div>
        </Card>
    );
};

export default CategoryHierarchySelector;
