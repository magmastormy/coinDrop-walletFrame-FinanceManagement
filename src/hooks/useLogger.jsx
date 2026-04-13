import { useContext, createContext, useCallback, useEffect } from 'react';

// Create logger context
const LoggerContext = createContext(null);

/**
 * Logger Provider Component
 * Provides unified logging to all child components
 */
export const LoggerProvider = ({ children }) => {
    const logger = window.CoinDropLogger;
    
    // Set user context when available
    const setLoggerContext = useCallback((userId, correlationId) => {
        if (userId) logger.setUserId(userId);
        if (correlationId) logger.setCorrelationId(correlationId);
    }, []);

    // Clear context on unmount
    useEffect(() => {
        return () => {
            logger.clearCorrelationId();
        };
    }, []);

    const contextValue = {
        logger,
        setLoggerContext
    };

    return (
        <LoggerContext.Provider value={contextValue}>
            {children}
        </LoggerContext.Provider>
    );
};

/**
 * Hook to use logger in components
 */
export const useLogger = () => {
    const context = useContext(LoggerContext);
    
    if (!context) {
        throw new Error('useLogger must be used within a LoggerProvider');
    }

    return context.logger;
};

/**
 * Hook for logging with automatic context
 */
export const useLoggerContext = () => {
    const context = useContext(LoggerContext);
    
    if (!context) {
        throw new Error('useLoggerContext must be used within a LoggerProvider');
    }

    const { logger, setLoggerContext } = context;

    return {
        // Enhanced logging methods with automatic context
        logError: useCallback((message, metadata = {}) => {
            logger.error(message, metadata);
        }, [logger]),

        logWarn: useCallback((message, metadata = {}) => {
            logger.warn(message, metadata);
        }, [logger]),

        logInfo: useCallback((message, metadata = {}) => {
            logger.info(message, metadata);
        }, [logger]),

        logDebug: useCallback((message, metadata = {}) => {
            logger.debug(message, metadata);
        }, [logger]),

        logPerformance: useCallback((operation, duration, metadata = {}) => {
            logger.performance(operation, duration, metadata);
        }, [logger]),

        logUserAction: useCallback((action, metadata = {}) => {
            logger.userAction(action, metadata);
        }, [logger]),

        logSecurity: useCallback((event, metadata = {}) => {
            logger.security(event, metadata);
        }, [logger]),

        logApiRequest: useCallback((method, url, statusCode, duration, metadata = {}) => {
            logger.apiRequest(method, url, statusCode, duration, metadata);
        }, [logger]),

        // Context management
        setContext: useCallback((userId, correlationId) => {
            setLoggerContext(userId, correlationId);
        }, [setLoggerContext]),

        // Create child logger with component context
        child: useCallback((context) => {
            return logger.child(context);
        }, [logger])
    };
};

export default LoggerProvider;
