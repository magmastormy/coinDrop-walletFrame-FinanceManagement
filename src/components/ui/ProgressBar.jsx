import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

const ProgressBar = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    value = 0,
    max = 100,
    showPercentage = true,
    animated = true,
    ...props
}, ref) => {
    const progressRef = useRef(null);
    const percentage = Math.min(Math.max(value / max * 100, 0), 100);

    useEffect(() => {
        if (animated && progressRef.current) {
            progressRef.current.style.width = `${percentage}%`;
        }
    }, [percentage, animated]);

    const variants = {
        primary: "bg-primary",
        secondary: "bg-secondary",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        danger: "bg-red-500",
        info: "bg-blue-500",
    };

    const sizes = {
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
        xl: "h-5",
    };

    return (
        <div className={cn(
            "w-full relative",
            className
        )} ref={ref} {...props}>
            <div className={cn(
                "w-full bg-muted rounded-full overflow-hidden",
                sizes[size]
            )}>
                <div
                    ref={progressRef}
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out transform-gpu",
                        variants[variant],
                        !animated && "transition-none"
                    )}
                    style={{
                        width: animated ? '0%' : `${percentage}%`
                    }}
                />
            </div>
            {showPercentage && (
                <div className="mt-1 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        {value}/{max}
                    </span>
                    <span className="text-sm font-semibold">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
        </div>
    );
});

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };