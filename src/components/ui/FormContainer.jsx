import React from 'react';
import { cn } from '../../lib/utils';

const FormContainer = ({ 
  onSubmit, 
  children, 
  className = '', 
  spacing = 'md' 
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  return (
    <form 
      onSubmit={onSubmit} 
      className={cn(
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </form>
  );
};

export default FormContainer;
