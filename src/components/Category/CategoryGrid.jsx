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
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Categories</h2>
        {onAddCategory && (
          <Button onClick={onAddCategory} size="sm" className="h-9 rounded-xl">
            + Add Category
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
        {categories.map((cat, idx) => {
          const total = getTotalAmount(cat);
          const isActive = selectedCategory?._id === cat._id;

          return (
            <GlassCard
              key={cat._id}
              className={cn(
                "h-full min-h-[180px] cursor-pointer border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-4 transition-all hover:translate-y-[-3px] dark:from-white/10 dark:via-white/5",
                isActive && "ring-2 ring-primary/60"
              )}
              onClick={() => onSelectCategory?.(cat)}
            >
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 rounded-xl border p-3"
                    style={{ borderColor: getColor(idx), color: getColor(idx) }}
                  >
                    <Tag className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{cat.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      {(cat.transactions?.length || 0)} transactions
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                </div>
                <div
                  className="mt-auto rounded-xl border border-white/10 bg-background/40 px-3 py-2"
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Total</p>
                  <p className="text-xl font-display font-bold text-foreground">{formatCurrency(total)}</p>
                </div>
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
