/**
 * Query Optimizer Utility
 * 
 * Provides query optimization strategies for MongoDB including
 * index hints, query analysis, and performance recommendations.
 * 
 * @module utils/queryOptimizer
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Query optimization configuration
 */
const OPTIMIZER_CONFIG = {
    slowQueryThreshold: 100, // ms
    maxQueryTime: 5000, // ms
    enableQueryCache: true,
    cacheTTL: 300000, // 5 minutes
};

/**
 * Query cache
 */
const queryCache = new Map();

/**
 * Query Optimizer class
 */
class QueryOptimizer {
    constructor() {
        this.slowQueries = [];
        this.indexRecommendations = new Map();
    }

    /**
     * Optimize query execution
     */
    async optimize(query, model, options = {}) {
        const startTime = Date.now();
        
        try {
            // Check cache
            if (options.cache && OPTIMIZER_CONFIG.enableQueryCache) {
                const cached = this.getFromCache(query, model);
                if (cached) {
                    return cached;
                }
            }

            // Apply optimization hints
            const optimizedQuery = this.applyHints(query, options.hints);

            // Execute query
            const result = await optimizedQuery.exec();

            // Calculate execution time
            const executionTime = Date.now() - startTime;

            // Log slow queries
            if (executionTime > OPTIMIZER_CONFIG.slowQueryThreshold) {
                this.logSlowQuery(query, model, executionTime);
            }

            // Cache result
            if (options.cache && OPTIMIZER_CONFIG.enableQueryCache) {
                this.setCache(query, model, result, options.cacheTTL);
            }

            return result;
        } catch (error) {
            logger.error('Query optimization failed:', error);
            throw error;
        }
    }

    /**
     * Apply optimization hints to query
     */
    applyHints(query, hints = {}) {
        if (!hints) {
            return query;
        }

        // Apply index hint
        if (hints.index) {
            query = query.hint(hints.index);
        }

        // Apply maxTimeMS
        if (hints.maxTimeMS) {
            query = query.maxTimeMS(hints.maxTimeMS);
        }

        // Apply limit
        if (hints.limit) {
            query = query.limit(hints.limit);
        }

        // Apply sort
        if (hints.sort) {
            query = query.sort(hints.sort);
        }

        // Apply projection
        if (hints.select) {
            query = query.select(hints.select);
        }

        // Apply skip
        if (hints.skip) {
            query = query.skip(hints.skip);
        }

        return query;
    }

    /**
     * Get from cache
     */
    getFromCache(query, model) {
        const cacheKey = this.generateCacheKey(query, model);
        const cached = queryCache.get(cacheKey);

        if (cached && cached.expiry > Date.now()) {
            logger.debug('Cache hit:', cacheKey);
            return cached.data;
        }

        // Remove expired entry
        if (cached) {
            queryCache.delete(cacheKey);
        }

        return null;
    }

    /**
     * Set cache
     */
    setCache(query, model, data, ttl = OPTIMIZER_CONFIG.cacheTTL) {
        const cacheKey = this.generateCacheKey(query, model);
        
        queryCache.set(cacheKey, {
            data,
            expiry: Date.now() + ttl,
        });

        logger.debug('Cache set:', cacheKey);
    }

    /**
     * Generate cache key
     */
    generateCacheKey(query, model) {
        const queryString = JSON.stringify(query.getQuery ? query.getQuery() : query);
        const modelName = model.modelName || model.constructor.modelName;
        return `${modelName}:${queryString}`;
    }

    /**
     * Log slow query
     */
    logSlowQuery(query, model, executionTime) {
        const slowQuery = {
            timestamp: new Date(),
            model: model.modelName || model.constructor.modelName,
            query: query.getQuery ? query.getQuery() : query,
            executionTime,
        };

        this.slowQueries.push(slowQuery);

        // Keep only last 100 slow queries
        if (this.slowQueries.length > 100) {
            this.slowQueries.shift();
        }

        logger.warn('Slow query detected:', slowQuery);
    }

    /**
     * Analyze query performance
     */
    async analyzeQuery(query, model) {
        try {
            // Get query plan
            const explain = await query.explain('executionStats');

            const analysis = {
                query: query.getQuery ? query.getQuery() : query,
                model: model.modelName || model.constructor.modelName,
                executionStats: explain.executionStats,
                queryPlanner: explain.queryPlanner,
                recommendations: [],
            };

            // Analyze execution stats
            if (explain.executionStats) {
                const stats = explain.executionStats;

                // Check if collection scan is used
                if (stats.totalDocsExamined > stats.nReturned * 10) {
                    analysis.recommendations.push({
                        type: 'index',
                        severity: 'high',
                        message: 'Query is examining many more documents than returning. Consider adding an index.',
                        details: {
                            docsExamined: stats.totalDocsExamined,
                            docsReturned: stats.nReturned,
                        },
                    });
                }

                // Check execution time
                if (stats.executionTimeMillis > OPTIMIZER_CONFIG.slowQueryThreshold) {
                    analysis.recommendations.push({
                        type: 'performance',
                        severity: 'medium',
                        message: `Query took ${stats.executionTimeMillis}ms to execute.`,
                        details: {
                            executionTime: stats.executionTimeMillis,
                        },
                    });
                }
            }

            return analysis;
        } catch (error) {
            logger.error('Query analysis failed:', error);
            return null;
        }
    }

    /**
     * Get index recommendations
     */
    async getIndexRecommendations(model) {
        try {
            const collection = model.collection;
            const indexes = await collection.indexes();
            const stats = await collection.stats();

            const recommendations = {
                existingIndexes: indexes,
                suggestedIndexes: [],
                redundantIndexes: [],
            };

            // Analyze slow queries for this model
            const modelSlowQueries = this.slowQueries.filter(
                q => q.model === model.modelName
            );

            // Suggest indexes based on slow queries
            for (const slowQuery of modelSlowQueries) {
                const fields = Object.keys(slowQuery.query);
                
                // Check if index exists for these fields
                const hasIndex = indexes.some(index => {
                    const indexFields = Object.keys(index.key);
                    return fields.every(field => indexFields.includes(field));
                });

                if (!hasIndex) {
                    recommendations.suggestedIndexes.push({
                        fields,
                        reason: 'Frequently queried fields without index',
                        query: slowQuery.query,
                    });
                }
            }

            // Find redundant indexes
            for (let i = 0; i < indexes.length; i++) {
                for (let j = i + 1; j < indexes.length; j++) {
                    const index1 = indexes[i];
                    const index2 = indexes[j];

                    const fields1 = Object.keys(index1.key);
                    const fields2 = Object.keys(index2.key);

                    // Check if index1 is a prefix of index2
                    if (fields1.every((field, index) => field === fields2[index])) {
                        recommendations.redundantIndexes.push({
                            index: index1.name,
                            reason: `Covered by index: ${index2.name}`,
                        });
                    }
                }
            }

            return recommendations;
        } catch (error) {
            logger.error('Failed to get index recommendations:', error);
            return null;
        }
    }

    /**
     * Get slow queries
     */
    getSlowQueries(limit = 50) {
        return this.slowQueries
            .sort((a, b) => b.executionTime - a.executionTime)
            .slice(0, limit);
    }

    /**
     * Clear cache
     */
    clearCache() {
        queryCache.clear();
        logger.info('Query cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        let hits = 0;
        let misses = 0;

        // This would require tracking hits/misses in a real implementation
        return {
            size: queryCache.size,
            hits,
            misses,
        };
    }

    /**
     * Create optimized query builder
     */
    createOptimizedQuery(model, filters = {}, options = {}) {
        let query = model.find(filters);

        // Apply default optimizations
        if (options.select) {
            query = query.select(options.select);
        }

        if (options.sort) {
            query = query.sort(options.sort);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.skip) {
            query = query.skip(options.skip);
        }

        if (options.populate) {
            query = query.populate(options.populate);
        }

        // Apply max time
        query = query.maxTimeMS(options.maxTimeMS || OPTIMIZER_CONFIG.maxQueryTime);

        return query;
    }

    /**
     * Optimize aggregation pipeline
     */
    optimizeAggregation(pipeline, options = {}) {
        const optimizedPipeline = [...pipeline];

        // Move $match stages to the beginning
        const matchStages = optimizedPipeline.filter(stage => stage.$match);
        const otherStages = optimizedPipeline.filter(stage => !stage.$match);

        // Combine match stages
        if (matchStages.length > 1) {
            const combinedMatch = matchStages.reduce((acc, stage) => ({
                ...acc,
                ...stage.$match,
            }), {});

            optimizedPipeline = [{ $match: combinedMatch }, ...otherStages];
        }

        // Add $limit early if specified
        if (options.limit && !optimizedPipeline.some(stage => stage.$limit)) {
            optimizedPipeline.push({ $limit: options.limit });
        }

        return optimizedPipeline;
    }

    /**
     * Monitor query performance
     */
    async monitorQueryPerformance(query, model, callback) {
        const startTime = Date.now();

        try {
            const result = await query;
            const executionTime = Date.now() - startTime;

            callback({
                success: true,
                executionTime,
                result,
            });

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            callback({
                success: false,
                executionTime,
                error: error.message,
            });

            throw error;
        }
    }
}

// Export singleton instance
module.exports = new QueryOptimizer();
