import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = cn(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    {
      'btn-disabled': disabled,
      'btn-loading': loading,
      'btn-icon': !children && icon,
    },
    className
  );

  const MotionComponent = motion.button;

  return (
    <MotionComponent
      type={type}
      className={baseClasses}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 200 }}
      {...props}
    >
      {loading && <Loader2 className="btn-spinner" size={16} />}
      
      {icon && iconPosition === 'left' && (
        <span className="btn-icon">{icon}</span>
      )}
      
      {children && <span className="btn-text">{children}</span>}
      
      {icon && iconPosition === 'right' && (
        <span className="btn-icon btn-icon-right">{icon}</span>
      )}
    </MotionComponent>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'destructive', 'outline', 'default']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'icon']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
export { Button };
