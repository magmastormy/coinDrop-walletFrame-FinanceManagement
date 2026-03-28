const logger = require('./logger');

class MetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.counters = new Map();
        this.gauges = new Map();
        this.histograms = new Map();
        this.startTime = Date.now();
    }

    /**
     * Record a counter metric (increment only)
     */
    incrementCounter(name, value = 1, labels = {}) {
        const key = this._makeKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);
        
        if (process.env.NODE_ENV === 'development') {
            logger.debug(`Counter: ${name} = ${current + value}`, labels);
        }
    }

    /**
     * Set a gauge metric (absolute value)
     */
    setGauge(name, value, labels = {}) {
        const key = this._makeKey(name, labels);
        this.gauges.set(key, { value, timestamp: Date.now() });
        
        if (process.env.NODE_ENV === 'development') {
            logger.debug(`Gauge: ${name} = ${value}`, labels);
        }
    }

    /**
     * Record a histogram metric (for timing/distribution)
     */
    recordHistogram(name, value, labels = {}) {
        const key = this._makeKey(name, labels);
        let histogram = this.histograms.get(key);
        
        if (!histogram) {
            histogram = {
                count: 0,
                sum: 0,
                min: Infinity,
                max: -Infinity,
                buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
                bucketCounts: {}
            };
            this.histograms.set(key, histogram);
        }
        
        histogram.count++;
        histogram.sum += value;
        histogram.min = Math.min(histogram.min, value);
        histogram.max = Math.max(histogram.max, value);
        
        // Update bucket counts
        for (const bucket of histogram.buckets) {
            if (value <= bucket) {
                const bucketKey = `le_${bucket}`;
                histogram.bucketCounts[bucketKey] = (histogram.bucketCounts[bucketKey] || 0) + 1;
                break;
            }
        }
        
        // Add to +Inf bucket
        const infBucket = 'le_+Inf';
        histogram.bucketCounts[infBucket] = (histogram.bucketCounts[infBucket] || 0) + 1;
        
        if (process.env.NODE_ENV === 'development') {
            logger.debug(`Histogram: ${name} = ${value}ms`, labels);
        }
    }

    /**
     * Record request duration
     */
    recordRequestDuration(method, path, statusCode, durationMs) {
        this.recordHistogram('http_request_duration_seconds', durationMs / 1000, {
            method,
            path,
            status_code: statusCode
        });
        
        this.incrementCounter('http_requests_total', 1, {
            method,
            path,
            status_code: statusCode
        });
    }

    /**
     * Record database query duration
     */
    recordDatabaseQuery(collection, operation, durationMs) {
        this.recordHistogram('database_query_duration_seconds', durationMs / 1000, {
            collection,
            operation
        });
        
        this.incrementCounter('database_queries_total', 1, {
            collection,
            operation
        });
    }

    /**
     * Record AI API call metrics
     */
    recordAICall(model, success, durationMs) {
        this.recordHistogram('ai_api_call_duration_seconds', durationMs / 1000, {
            model,
            success: success.toString()
        });
        
        this.incrementCounter('ai_api_calls_total', 1, {
            model,
            success: success.toString()
        });
        
        if (!success) {
            this.incrementCounter('ai_api_errors_total', 1, { model });
        }
    }

    /**
     * Record Redis operation metrics
     */
    recordRedisOperation(operation, success, durationMs) {
        this.recordHistogram('redis_operation_duration_seconds', durationMs / 1000, {
            operation,
            success: success.toString()
        });
        
        this.incrementCounter('redis_operations_total', 1, {
            operation,
            success: success.toString()
        });
        
        if (!success) {
            this.incrementCounter('redis_errors_total', 1, { operation });
        }
    }

    /**
     * Record system metrics
     */
    recordSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        const os = require('os');
        
        this.setGauge('nodejs_memory_heap_used_bytes', memoryUsage.heapUsed);
        this.setGauge('nodejs_memory_heap_total_bytes', memoryUsage.heapTotal);
        this.setGauge('nodejs_memory_rss_bytes', memoryUsage.rss);
        this.setGauge('nodejs_memory_external_bytes', memoryUsage.external);
        
        this.setGauge('system_cpu_load_1m', os.loadavg()[0]);
        this.setGauge('system_cpu_cores', os.cpus().length);
        this.setGauge('system_memory_free_bytes', os.freemem());
        this.setGauge('system_memory_total_bytes', os.totalmem());
        this.setGauge('system_uptime_seconds', os.uptime());
    }

    /**
     * Record cache metrics
     */
    recordCacheOperation(operation, hit, durationMs) {
        this.recordHistogram('cache_operation_duration_seconds', durationMs / 1000, {
            operation,
            hit: hit.toString()
        });
        
        this.incrementCounter('cache_operations_total', 1, {
            operation,
            hit: hit.toString()
        });
    }

    /**
     * Record batch processing statistics
     */
    recordBatchStats(totalRequests, successCount, errorCount, durationMs) {
        this.incrementCounter('batch_requests_total', totalRequests);
        this.incrementCounter('batch_requests_success', successCount);
        this.incrementCounter('batch_requests_error', errorCount);
        this.recordHistogram('batch_processing_duration_seconds', durationMs / 1000);
        
        if (process.env.NODE_ENV === 'development') {
            logger.debug(`Batch processing: ${totalRequests} total, ${successCount} success, ${errorCount} error, ${durationMs}ms`);
        }
    }

    /**
     * Get batch processing statistics
     */
    async getBatchStats() {
        // Extract batch-related metrics
        const batchMetrics = {
            totalRequests: 0,
            successCount: 0,
            errorCount: 0,
            averageDuration: 0
        };
        
        // Calculate from counters
        for (const [key, value] of this.counters.entries()) {
            if (key.startsWith('batch_requests_total')) {
                batchMetrics.totalRequests = value;
            } else if (key.startsWith('batch_requests_success')) {
                batchMetrics.successCount = value;
            } else if (key.startsWith('batch_requests_error')) {
                batchMetrics.errorCount = value;
            }
        }
        
        // Calculate average duration from histogram
        for (const [key, histogram] of this.histograms.entries()) {
            if (key.startsWith('batch_processing_duration_seconds')) {
                batchMetrics.averageDuration = histogram.count > 0 ? histogram.sum / histogram.count : 0;
                break;
            }
        }
        
        return batchMetrics;
    }

    /**
     * Record queue events
     */
    recordQueueEvent(eventType, queueName) {
        this.incrementCounter('queue_events_total', 1, {
            event_type: eventType,
            queue_name: queueName
        });
    }

    /**
     * Record job duration
     */
    recordJobDuration(queueName, durationMs) {
        this.recordHistogram('job_duration_seconds', durationMs / 1000, {
            queue_name: queueName
        });
    }

    /**
     * Record queue statistics
     */
    recordQueueStats(queueName, stats) {
        this.setGauge('queue_jobs_active', stats.activeJobs || 0, {
            queue_name: queueName
        });
        this.setGauge('queue_jobs_waiting', stats.waitingJobs || 0, {
            queue_name: queueName
        });
        this.setGauge('queue_jobs_delayed', stats.delayedJobs || 0, {
            queue_name: queueName
        });
        this.setGauge('queue_concurrency', stats.concurrency || 0, {
            queue_name: queueName
        });
    }

    /**
     * Get all metrics in Prometheus format
     */
    getMetrics() {
        const uptime = (Date.now() - this.startTime) / 1000;
        
        return {
            process_uptime_seconds: uptime,
            nodejs_heap_size_bytes: process.memoryUsage().heapUsed,
            nodejs_heap_size_total_bytes: process.memoryUsage().heapTotal,
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(
                Array.from(this.gauges.entries()).map(([key, data]) => [key, data.value])
            ),
            histograms: Object.fromEntries(this.histograms)
        };
    }

    /**
     * Export metrics in Prometheus text format
     */
    exportPrometheus() {
        const lines = [];
        const metrics = this.getMetrics();
        
        // Export counters
        for (const [key, value] of Object.entries(metrics.counters)) {
            const [name, ...labelParts] = key.split('{');
            lines.push(`# TYPE ${name} counter`);
            lines.push(`${key} ${value}`);
        }
        
        // Export gauges
        for (const [key, value] of Object.entries(metrics.gauges)) {
            const [name] = key.split('{');
            lines.push(`# TYPE ${name} gauge`);
            lines.push(`${key} ${value}`);
        }
        
        // Export histograms
        for (const [key, hist] of Object.entries(metrics.histograms)) {
            const [name] = key.split('{');
            lines.push(`# TYPE ${name} histogram`);
            
            for (const [bucket, count] of Object.entries(hist.bucketCounts)) {
                lines.push(`${name}_bucket{le="${bucket}",${key.split('{')[1]} ${count}`);
            }
            
            lines.push(`${name}_sum{${key.split('{')[1]} ${hist.sum}`);
            lines.push(`${name}_count{${key.split('{')[1]} ${hist.count}`);
        }
        
        return lines.join('\n');
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
        this.startTime = Date.now();
    }

    /**
     * Create unique key from name and labels
     */
    _makeKey(name, labels = {}) {
        const labelKeys = Object.keys(labels).sort();
        const labelString = labelKeys.length > 0
            ? `{${labelKeys.map(k => `${k}="${labels[k]}"`).join(',')}}`
            : '';
        return `${name}${labelString}`;
    }
}

module.exports = new MetricsCollector();
