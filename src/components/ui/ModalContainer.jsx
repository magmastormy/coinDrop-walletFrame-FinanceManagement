import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const ModalContainer = ({ 
  children, 
  className = '', 
  size = 'md',
  showBackdrop = true 
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <>
      {showBackdrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className={cn(
              "bg-white rounded-lg shadow-xl w-full overflow-hidden",
              sizeClasses[size],
              className
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ModalContainer;
