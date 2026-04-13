import React from 'react';
import { cn } from '../../lib/utils';

const IconLabel = ({ 
  icon: Icon, 
  label, 
  size = 'md', 
  variant = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary'
  };

  return (
    <div className={cn(
      'flex items-center gap-2',
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {React.cloneElement(icon, {
        className: 'w-4 h-4'
      })}
      <span>{label}</span>
    </div>
  );
};

export default IconLabel;
