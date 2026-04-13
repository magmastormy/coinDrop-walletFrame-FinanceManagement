import React from 'react';
import { cn } from '../../lib/utils';

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  disabled = false,
  size = 'md',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7'
  };

  const thumbClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    primary: 'peer-checked:bg-primary',
    secondary: 'peer-checked:bg-secondary',
    default: 'peer-checked:bg-muted'
  };

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        'bg-muted peer-focus:outline-none',
        colorClasses[color],
        disabled && 'opacity-50 cursor-not-allowed',
        sizeClasses[size]
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white transition-transform',
          'translate-x-1 peer-checked:translate-x-6',
          thumbClasses[size]
        )}
      />
    </button>
  );
};

export default ToggleSwitch;
