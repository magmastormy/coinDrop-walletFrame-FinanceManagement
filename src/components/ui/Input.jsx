import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, label, error, style, ...props }, ref) => {
    const baseStyle = {
        background: 'var(--color-surface-2)',
        borderColor: error ? 'var(--color-negative)' : 'var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-primary)'
    };

    return (
        <div className="w-full space-y-1">
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full border px-3 text-sm transition-all duration-200",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                        error
                            ? "border-red-500 focus-visible:ring-red-500/40"
                            : "focus-visible:ring-ring-primary/50",
                        className
                    )}
                    ref={ref}
                    style={{ ...baseStyle, ...style }}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1 animate-slide-up">{error}</p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export { Input };
