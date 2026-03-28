import React from 'react';

const Checkbox = ({ 
  id, 
  label, 
  checked = false, 
  onChange, 
  disabled = false,
  className = '',
  style = {}
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={style}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      />
      {label && (
        <label 
          htmlFor={id}
          className="text-sm font-medium text-gray-700 cursor-pointer"
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
