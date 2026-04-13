import React from 'react';

const MaterialIcon = ({ 
  name, 
  className = '', 
  filled = false 
}) => {
  return (
    <span 
      className={`material-symbols-outlined ${className}`}
      style={{ 
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" 
      }}
    >
      {name}
    </span>
  );
};

export default MaterialIcon;
