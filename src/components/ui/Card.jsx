import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Card = ({ 
  children,
  className = '',
  variant = 'default',
  elevation = 1,
  hover = false,
  padding = 'md',
  onClick,
  as: Component = 'div',
  ...props
}) => {
  const baseClasses = cn(
    'card',
    `card-variant-${variant}`,
    `card-elevation-${elevation}`,
    {
      'card-hover': hover,
      'card-interactive': !!onClick,
    },
    className
  );

  const style = {
    '--card-padding': `var(--card-pad-${padding})`,
    ...props.style
  };

  const MotionComponent = motion[Component];

  return (
    <MotionComponent
      className={baseClasses}
      onClick={onClick}
      whileHover={hover ? { 
        y: -2,
        transition: { duration: 0.15 }
      } : undefined}
      style={style}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'outline', 'filled']),
  elevation: PropTypes.oneOf([0, 1, 2]),
  hover: PropTypes.bool,
  padding: PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick: PropTypes.func,
  as: PropTypes.elementType,
};



export default Card;
export { Card };
