/**
 * Performance Optimization Configuration
 * Centralized settings for app-wide performance optimizations
 */

export const PERFORMANCE_CONFIG = {
    // Lazy loading thresholds
    lazyLoad: {
        rootMargin: '100px',
        threshold: 0.01
    },

    // Image optimization
    images: {
        loading: 'lazy',
        decoding: 'async',
        placeholder: 'blur',
        sizes: {
            mobile: '100vw',
            tablet: '50vw',
            desktop: '33vw'
        }
    },

    // Animation settings - reduced on mobile
    animations: {
        mobile: {
            duration: 0.2,
            enabled: true
        },
        desktop: {
            duration: 0.4,
            enabled: true
        }
    },

    // Debounce/Throttle delays
    delays: {
        search: 300,
        resize: 200,
        scroll: 100,
        apiCall: 500
    },

    // Pagination
    pagination: {
        defaultPageSize: 10,
        mobilePageSize: 5,
        desktopPageSize: 20
    },

    // Cache durations (ms)
    cache: {
        short: 60000,      // 1 minute
        medium: 300000,    // 5 minutes
        long: 900000,      // 15 minutes
        veryLong: 3600000  // 1 hour
    }
};

/**
 * Get optimal page size based on screen width
 */
export const getOptimalPageSize = (screenWidth) => {
    if (screenWidth < 640) return PERFORMANCE_CONFIG.pagination.mobilePageSize;
    if (screenWidth < 1024) return PERFORMANCE_CONFIG.pagination.defaultPageSize;
    return PERFORMANCE_CONFIG.pagination.desktopPageSize;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
};

/**
 * Check if reduced motion is preferred
 */
export const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
