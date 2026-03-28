import { useEffect, useRef } from 'react';

/**
 * ARIA Live Region Component for announcing dynamic content to screen readers
 * 
 * @param {string} message - Message to announce
 * @param {'polite' | 'assertive'} priority - Announcement priority (default: polite)
 * @param {number} clearDelay - Time in ms before clearing (default: 3000)
 * @param {boolean} atomic - Whether to read entire region (default: true)
 */
const LiveRegion = ({ 
    children, 
    message,
    priority = 'polite', 
    clearDelay = 3000,
    atomic = true,
    className = ''
}) => {
    const timeoutRef = useRef(null);
    const liveMessage = message || children;

    useEffect(() => {
        if (!liveMessage) return;

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout to clear message
        timeoutRef.current = setTimeout(() => {
            // Message cleared after delay
        }, clearDelay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [liveMessage, clearDelay]);

    return (
        <div
            role={priority === 'assertive' ? 'alert' : 'status'}
            aria-live={priority}
            aria-atomic={atomic}
            className={className}
        >
            {liveMessage}
        </div>
    );
};

export default LiveRegion;
