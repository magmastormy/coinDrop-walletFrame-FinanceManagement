import React from 'react';
import PropTypes from 'prop-types';
import { Tag, ChevronRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

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

  const getColor = (index) => {
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Categories</h2>
        {onAddCategory && (
          <Button onClick={onAddCategory} size="sm">
            + Add Category
          </Button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat, idx) => {
          const total = getTotalAmount(cat);
          const isActive = selectedCategory?._id === cat._id;

          return (
            <GlassCard
              key={cat._id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:scale-105",
                isActive && "ring-2 ring-primary"
              )}
              onClick={() => onSelectCategory?.(cat)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: getColor(idx) }}
                >
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatCurrency(total)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </GlassCard>
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
