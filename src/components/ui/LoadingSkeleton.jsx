import React from 'react';

const LoadingSkeleton = ({ className, width = '100%', height = '1rem', rounded = '0.5rem' }) => {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: 'var(--color-surface-2)',
      }}
    />
  );
};

const SkeletonForm = () => {
  return (
    <div className="space-y-6">
      {/* Email field skeleton */}
      <div className="space-y-2">
        <LoadingSkeleton height="0.75rem" width="6rem" />
        <LoadingSkeleton height="2.5rem" />
      </div>
      
      {/* Password field skeleton */}
      <div className="space-y-2">
        <LoadingSkeleton height="0.75rem" width="6rem" />
        <LoadingSkeleton height="2.5rem" />
      </div>
      
      {/* Button skeleton */}
      <LoadingSkeleton height="2.5rem" />
    </div>
  );
};

const SkeletonCard = () => {
  return (
    <div className="space-y-4 p-6">
      <LoadingSkeleton height="2rem" width="80%" />
      <LoadingSkeleton height="1rem" width="100%" />
      <LoadingSkeleton height="1rem" width="90%" />
      <LoadingSkeleton height="2rem" width="60%" />
    </div>
  );
};

export { LoadingSkeleton, SkeletonForm, SkeletonCard };
