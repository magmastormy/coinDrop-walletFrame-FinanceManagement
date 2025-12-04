import React from 'react';
import { cn } from '../../lib/utils';

const GlassCard = React.forwardRef(({ className, children, hoverEffect = true, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "glass-card relative overflow-hidden p-6",
                hoverEffect ? "hover:-translate-y-1 hover:shadow-glass-md" : "",
                className
            )}
            {...props}
        >
            {/* Optional: Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100 pointer-events-none dark:from-white/5" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
});

GlassCard.displayName = "GlassCard";

export { GlassCard };
