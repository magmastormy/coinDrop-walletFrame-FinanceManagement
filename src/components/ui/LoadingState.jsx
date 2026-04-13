import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const LoadingState = ({ 
  loading, 
  height = 'md', 
  message = 'Loading...', 
  className = '' 
}) => {
  if (!loading) return null;

  const heightClasses = {
    sm: 'min-h-[200px]',
    md: 'min-h-[400px]',
    lg: 'min-h-[600px]',
    screen: 'min-h-screen'
  };

  return (
    <div className={cn(
      'flex items-center justify-center',
      heightClasses[height],
      className
    )}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      {message && (
        <p className="text-muted-foreground mt-4">{message}</p>
      )}
    </div>
  );
};

export default LoadingState;
