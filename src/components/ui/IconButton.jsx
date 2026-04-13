import React from 'react';
import { cn } from '../../lib/utils';

const IconButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    default: 'bg-surface-container hover:bg-surface-container-highest text-on-surface',
    primary: 'bg-primary hover:bg-primary/90 text-on-primary',
    destructive: 'bg-error hover:bg-error/90 text-on-error'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 rounded-lg font-medium transition-all',
        'hover:brightness-110 active:scale-95',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
};

export default IconButton;
