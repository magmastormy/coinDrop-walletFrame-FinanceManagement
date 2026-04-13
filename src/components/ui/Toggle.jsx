import React from 'react';

const Toggle = ({ 
  label, 
  checked = false, 
  onChange, 
  disabled = false,
  size = 'medium',
  className = '',
  style = {}
}) => {
  const sizeStyles = {
    small: {
      width: '32px',
      height: '18px'
    },
    medium: {
      width: '44px',
      height: '24px'
    },
    large: {
      width: '56px',
      height: '30px'
    }
  };

  const thumbStyles = {
    small: {
      width: '14px',
      height: '14px',
      transform: checked ? 'translateX(14px)' : 'translateX(2px)'
    },
    medium: {
      width: '20px',
      height: '20px',
      transform: checked ? 'translateX(20px)' : 'translateX(2px)'
    },
    large: {
      width: '26px',
      height: '26px',
      transform: checked ? 'translateX(26px)' : 'translateX(2px)'
    }
  };

  return (
    <label 
      className={`toggle-component ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
    >
      {label && (
        <span style={{
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          userSelect: 'none'
        }}>
          {label}
        </span>
      )}
      
      <div
        style={{
          position: 'relative',
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-surface-3)',
          borderRadius: '12px',
          transition: 'background-color 0.2s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...sizeStyles[size]
        }}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            backgroundColor: 'white',
            borderRadius: '50%',
            transition: 'transform 0.2s ease',
            boxShadow: 'var(--shadow-sm)',
            ...thumbStyles[size]
          }}
        />
      </div>
    </label>
  );
};

export default Toggle;
