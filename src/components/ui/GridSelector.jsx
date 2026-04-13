import React from 'react';
import { cn } from '../../lib/utils';

const GridSelector = ({ 
  options, 
  selected, 
  onSelect, 
  columns = 3,
  className = ''
}) => {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className={cn(
      'grid gap-3',
      gridClasses[columns],
      className
    )}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-xl border transition-all',
              'hover:border-primary/50 hover:bg-surface-container-high',
              selected === option.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground'
            )}
          >
            {Icon && <Icon className="w-5 h-5 mb-1" />}
            <span className="text-xs font-medium text-center">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default GridSelector;
