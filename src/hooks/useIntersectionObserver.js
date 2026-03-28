import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect when an element is visible in the viewport
 * Useful for lazy loading and animations
 */
export const useIntersectionObserver = (options = {}) => {
    const [elements, setElements] = useState([]);
    const [entries, setEntries] = useState([]);

    const observerRef = useRef(null);

    useEffect(() => {
        if (elements.length === 0) return;

        observerRef.current = new IntersectionObserver((observedEntries) => {
            setEntries(observedEntries);
        }, options);

        const observer = observerRef.current;

        elements.forEach(element => {
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [elements, options]);

    return [setElements, entries];
};

/**
 * Hook for debouncing values
 */
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook for throttling function calls
 */
export const useThrottle = (callback, delay) => {
    const throttleRef = useRef(false);

    useEffect(() => {
        throttleRef.current = false;
    }, [delay]);

    return (...args) => {
        if (!throttleRef.current) {
            callback(...args);
            throttleRef.current = true;
            setTimeout(() => {
                throttleRef.current = false;
            }, delay);
        }
    };
};
