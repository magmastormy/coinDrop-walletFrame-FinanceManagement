import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Folder, PieChart, Edit, Trash2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const CategoryPanel = ({ categories = [], onAddCategory, onSelectCategory, selectedCategory, onEditCategory, onDeleteCategory }) => {
    const getRandomColor = (index) => {
        const hue = (index * 137.5) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    return (
        <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <Folder className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Categories</h2>
            </div>

            {categories.length === 0 ? (
                <motion.div
                    className="flex flex-col items-center justify-center py-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="p-4 rounded-full bg-white/5 mb-4">
                        <PieChart className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Categories Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Create categories to better organize your transactions
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {categories.map((category, index) => (
                            <motion.div
                                key={category._id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={cn(
                                    "group flex items-center gap-3 p-3 rounded-lg transition-all",
                                    selectedCategory?._id === category._id
                                        ? "bg-primary/20 ring-1 ring-primary"
                                        : "hover:bg-white/5"
                                )}>
                                    <button
                                        className="flex-1 flex items-center gap-3 text-left"
                                        onClick={() => onSelectCategory?.(category)}
                                    >
                                        <div
                                            className="p-2 rounded-lg flex-shrink-0"
                                            style={{ backgroundColor: getRandomColor(index) }}
                                        >
                                            <Tag className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">{category.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {category.transactions?.length || 0} transactions
                                            </p>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEditCategory?.(category)}
                                            className="h-8 w-8"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteCategory?.(category._id)}
                                            disabled={category.name === "None"}
                                            className="h-8 w-8 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </GlassCard>
    );
};

export default CategoryPanel;
