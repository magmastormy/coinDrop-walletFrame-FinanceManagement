import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const LoadingSpinner = ({ 
  size = 'md', 
  fullScreen = false, 
  overlay = false,
  message,
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  if (fullScreen) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center"
      )}
      style={{
        background: overlay ? 'var(--color-overlay-dark)' : 'var(--color-overlay-light)'
      }}>
        <Loader2 className={cn(
          "animate-spin text-primary",
          sizeClasses[size]
        )} />
        {message && (
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center p-8",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      {message && (
        <p className="ml-3 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
};

export const Skeleton = ({ className, width, height }) => (
  <div 
    className={cn(
      "animate-pulse rounded-md",
      className
    )}
    style={{
      width: width || '100%',
      height: height || '1rem',
      background: 'var(--color-surface-2)'
    }}
  />
);

export const CardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);

export default LoadingSpinner;
