import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const LoadingButton = ({ 
  loading, 
  children, 
  disabled = false, 
  className = '' 
}) => {
  return (
    <button 
      type="button"
      disabled={disabled || loading}
      className={cn(
        "relative",
        className
      )}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      )}
      <span className={cn(loading && "opacity-50")}>
        {children}
      </span>
    </button>
  );
};

export default LoadingButton;
