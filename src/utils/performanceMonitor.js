import { logInfo, logError, logWarn } from './logger';

/**
 * Performance monitoring utilities for tracking API response times and component performance
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    /**
     * Start timing an API call
     */
    startApiCall(apiName, url) {
        const startTime = performance.now();
        const callId = `${apiName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.metrics.set(callId, {
            apiName,
            url,
            startTime,
            status: 'pending'
        });

        if (this.isDevelopment) {
            logInfo(`🚀 API Call Started: ${apiName} (${url})`);
        }

        return callId;
    }

    /**
     * End timing an API call
     */
    endApiCall(callId, success = true, error = null) {
        const metric = this.metrics.get(callId);
        if (!metric) return;

        const endTime = performance.now();
        const duration = endTime - metric.startTime;

        this.metrics.set(callId, {
            ...metric,
            endTime,
            duration,
            status: success ? 'success' : 'error',
            error
        });

        // Log performance metrics
        if (this.isDevelopment) {
            const status = success ? '✅' : '❌';
            logInfo(`${status} API Call Completed: ${metric.apiName} (${duration.toFixed(0)}ms)`);
            
            if (error) {
                logError('API Error:', error);
            }
        }

        // Report slow calls (> 2 seconds)
        if (duration > 2000) {
            this.reportSlowApi(metric, duration);
        }

        // Clean up old metrics (keep last 100)
        this.cleanupMetrics();
    }

    /**
     * Track component render performance
     */
    trackComponentRender(componentName) {
        const startTime = performance.now();
        
        // Use requestAnimationFrame for accurate timing
        requestAnimationFrame(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (this.isDevelopment) {
                if (duration > 16) { // > 1 frame at 60fps
                    logWarn(`🐌 Slow Render: ${componentName} took ${duration.toFixed(2)}ms`);
                }
            }
        });
    }

    /**
     * Report slow API calls
     */
    reportSlowApi(metric, duration) {
        // In production, this would send to monitoring service
        logWarn(`🐌 Slow API Detected: ${metric.apiName} took ${duration.toFixed(0)}ms`);
        
        // This could trigger an alert or send to monitoring service
        if (typeof window !== 'undefined' && window.alert) {
            alert(`Slow response detected. Please check your connection.`);
        }
    }

    /**
     * Get performance metrics summary
     */
    getMetrics() {
        const allMetrics = Array.from(this.metrics.values());
        
        const summary = {
            totalCalls: allMetrics.length,
            successfulCalls: allMetrics.filter(m => m.status === 'success').length,
            failedCalls: allMetrics.filter(m => m.status === 'error').length,
            averageDuration: allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / allMetrics.length,
            slowCalls: allMetrics.filter(m => (m.duration || 0) > 2000).length
        };

        return {
            metrics: allMetrics,
            summary,
            recommendations: this.generateRecommendations(summary)
        };
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations(summary) {
        const recommendations = [];

        if (summary.averageDuration > 1000) {
            recommendations.push({
                type: 'performance',
                severity: 'high',
                message: 'Average API response time is over 1 second',
                action: 'Consider implementing caching or optimizing API endpoints'
            });
        }

        if (summary.failedCalls / summary.totalCalls > 0.1) {
            recommendations.push({
                type: 'reliability',
                severity: 'medium',
                message: 'API failure rate is over 10%',
                action: 'Review error handling and implement retry logic'
            });
        }

        if (summary.slowCalls > 0) {
            recommendations.push({
                type: 'performance',
                severity: 'medium',
                message: `${summary.slowCalls} slow API calls detected`,
                action: 'Investigate slow endpoints and implement response caching'
            });
        }

        return recommendations;
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    cleanupMetrics() {
        const now = Date.now();
        const cutoff = now - (5 * 60 * 1000); // 5 minutes ago

        for (const [callId, metric] of this.metrics.entries()) {
            if (metric.startTime < cutoff) {
                this.metrics.delete(callId);
            }
        }
    }

    /**
     * Add performance observer
     */
    addObserver(callback) {
        this.observers.push(callback);
    }

    /**
     * Remove performance observer
     */
    removeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * Notify all observers of performance event
     */
    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                logError('Performance observer error:', error);
            }
        });
    }
}

export default new PerformanceMonitor();
