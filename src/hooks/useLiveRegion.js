import { useEffect } from 'react';

/**
 * Hook to manage ARIA live region announcements for screen readers
 * @param {string} message - Message to announce
 * @param {'polite' | 'assertive'} priority - Announcement priority
 * @param {number} clearDelay - Time in ms before clearing message
 */
const useLiveRegion = (message, priority = 'polite', clearDelay = 3000) => {
    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            // Clear message after delay to prevent stale announcements
        }, clearDelay);

        return () => clearTimeout(timer);
    }, [message, clearDelay]);

    return {
        role: priority === 'assertive' ? 'alert' : 'status',
        'aria-live': priority,
        'aria-atomic': true
    };
};

export default useLiveRegion;
