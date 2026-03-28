import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

/**
 * PrivacyToggle Component
 * Toggle visibility of sensitive information like balances
 * Useful for privacy in public spaces
 */
const PrivacyToggle = ({ 
  children, 
  defaultValue = true,
  onToggle,
  className,
  ariaLabel 
}) => {
  const [isVisible, setIsVisible] = useState(defaultValue);

  const handleToggle = () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    if (onToggle) {
      onToggle(newValue);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1">
        {isVisible ? children : '••••••••'}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        aria-label={ariaLabel || (isVisible ? 'Hide value' : 'Show value')}
        className="h-8 w-8 flex-shrink-0"
      >
        {isVisible ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
};

export default PrivacyToggle;
