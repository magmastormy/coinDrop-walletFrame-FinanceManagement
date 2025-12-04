import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    isLoading = false,
    children,
    disabled,
    ...props
}, ref) => {

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 border border-transparent",
        secondary: "bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-foreground/80 hover:text-foreground",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-xl px-8 text-lg",
        icon: "h-10 w-10",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                variants[variant],
                sizes[size],
                className
            )}
            ref={ref}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = "Button";

export { Button };
