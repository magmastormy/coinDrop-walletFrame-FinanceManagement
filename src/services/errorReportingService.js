import { useLogger } from './hooks/useLogger';

/**
 * Error reporting service for centralized error tracking and monitoring
 */

class ErrorReportingService {
    constructor() {
        this.errorQueue = [];
        this.isOnline = navigator.onLine;
        
        // Setup online/offline listeners
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
    }

    /**
     * Report error to centralized logging service
     */
    reportError(errorData) {
        const errorReport = {
            ...errorData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            online: this.isOnline,
            sessionId: this.getSessionId(),
            severity: this.determineSeverity(errorData.error)
        };

        // Log to console for development
        if (process.env.NODE_ENV === 'development') {
            logError('Error Report:', errorReport);
        }

        // Add to error queue for batch sending
        this.errorQueue.push(errorReport);
        
        // Send immediately if critical
        if (errorReport.severity === 'critical') {
            this.sendErrorReport(errorReport);
        } else {
            this.scheduleBatchSend();
        }
    }

    /**
     * Determine error severity based on error type and message
     */
    determineSeverity(error) {
        if (!error) return 'low';
        
        const message = error.message || error.toString();
        
        // Network errors
        if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) {
            return 'high';
        }
        
        // Authentication errors
        if (message.includes('auth') || message.includes('login') || message.includes('token')) {
            return 'critical';
        }
        
        // Validation errors
        if (message.includes('required') || message.includes('invalid') || message.includes('validation')) {
            return 'medium';
        }
        
        // Server errors
        if (message.includes('500') || message.includes('server error')) {
            return 'high';
        }
        
        return 'medium';
    }

    /**
     * Get or create session ID for error tracking
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('errorSessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('errorSessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Schedule batch sending of error reports
     */
    scheduleBatchSend() {
        // Clear existing timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this.sendBatchedErrors();
        }, 5000); // Send batch after 5 seconds
    }

    /**
     * Send batched error reports
     */
    sendBatchedErrors() {
        if (this.errorQueue.length === 0) return;
        
        const errors = this.errorQueue.splice(0, 10); // Send max 10 at a time
        this.errorQueue = [];
        
        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
            // This would integrate with your error reporting service
            logInfo('Sending error batch:', errors);
            // Example: await fetch('/api/errors', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ errors, sessionId: this.getSessionId() })
            // });
        }
    }

    /**
     * Send individual error report immediately
     */
    async sendErrorReport(errorReport) {
        try {
            if (process.env.NODE_ENV === 'production') {
                // This would integrate with your error reporting service
                logInfo('Sending immediate error report:', errorReport);
                // Example: await fetch('/api/errors', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(errorReport)
                // });
            }
        } catch (err) {
            logError('Failed to send error report:', err);
        }
    }

    /**
     * Clear error queue (call on app startup)
     */
    clearErrors() {
        this.errorQueue = [];
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
    }
}

export default new ErrorReportingService();
