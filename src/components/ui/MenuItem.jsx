import React from 'react';
import { cn } from '../../lib/utils';

const MenuItem = ({ 
  icon: Icon, 
  label, 
  onClick, 
  disabled = false, 
  variant = 'default',
  className = '',
  stopPropagation = true
}) => {
  const handleClick = (e) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    onClick(e);
  };

  const baseClasses = cn(
    'w-full text-left px-4 py-2 text-sm transition-colors',
    'flex items-center gap-2',
    {
      'text-on-surface hover:bg-surface-container': variant === 'default',
      'text-error hover:bg-error/10': variant === 'danger',
      'cursor-not-allowed opacity-50': disabled,
      'cursor-pointer': !disabled
    },
    className
  );

  return (
    <button
      type="button"
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
};

export default MenuItem;
