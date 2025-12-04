import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, label, error, ...props }, ref) => {
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
                        "flex h-10 w-full rounded-xl border border-input bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-sm",
                        error && "border-red-500 focus-visible:ring-red-500",
                        className
                    )}
                    ref={ref}
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
