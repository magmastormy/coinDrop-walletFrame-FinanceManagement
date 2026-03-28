import React from 'react';
import PropTypes from 'prop-types';
import { Tag, ChevronRight } from 'lucide-react';
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((cat, idx) => {
                  const total = getTotalAmount(cat);
                  const isActive = selectedCategory?._id === cat._id;

                  return (
                    <Card
                      key={cat._id}
                      variant={isActive ? "selected" : "default"}
                      elevation={1}
                      className="h-full cursor-pointer p-4"
                      onClick={() => onSelectCategory?.(cat)}
                    >
                      <div className="flex h-full flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex-shrink-0 rounded-lg border p-2"
                            style={{ borderColor: getColor(idx), color: getColor(idx) }}
                          >
                            <Tag className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="truncate text-base font-medium text-primary">{cat.name}</h3>
                            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                              {(cat.transactions?.length || 0)} transactions
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        </div>
                        <Card variant="secondary" className="mt-auto p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(total)}</p>
                        </Card>
                      </div>
                    </Card>
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
