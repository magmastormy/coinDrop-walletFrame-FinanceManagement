import React from 'react';
import { cn } from '../../lib/utils';

const Select = React.forwardRef(({ className, label, error, children, ...props }, ref) => {
    return (
        <div className="w-full space-y-1">
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={cn(
                        "flex h-10 w-full rounded-xl border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                        error && "border-red-500 focus-visible:ring-red-500",
                        className
                    )}
                    ref={ref}
                    style={{
                        background: 'var(--color-surface-2)',
                        borderColor: error ? 'var(--color-negative)' : 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                    }}
                    {...props}
                >
                    {children}
                </select>
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1 animate-slide-up">{error}</p>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;
export { Select };