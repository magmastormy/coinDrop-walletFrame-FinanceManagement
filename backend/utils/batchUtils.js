const express = require('express');
const router = express.Router();
const { getAuthenticatedUserId } = require('./authUser');
const metricsCollector = require('./metricsCollector');
const logger = require('./logger');

class BatchUtil {
    constructor(app) {
        this.app = app;
        this.initializeRoutes();
        this.maxConcurrentRequests = 5; // Limit concurrent processing
    }

    initializeRoutes() {
        router.post('/batch', this.handleBatchRequest.bind(this));
        router.get('/batch/stats', this.getBatchStats.bind(this));
        this.app.use('/api', router);
    }

    async handleBatchRequest(req, res) {
        const startedAt = Date.now();
        const userId = getAuthenticatedUserId(req);
        const { requests, parallel = false } = req.body;

        if (!Array.isArray(requests) || requests.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid batch request',
                message: 'Requests must be an array of request objects'
            });
        }

        const maxBatchSize = 20; // Increased batch size
        if (requests.length > maxBatchSize) {
            return res.status(400).json({
                success: false,
                error: 'Batch request too large',
                message: `Maximum ${maxBatchSize} requests per batch`
            });
        }

        let responses = [];

        try {
            if (parallel) {
                // Process requests in parallel with concurrency limit
                responses = await this.processParallelRequests(requests, req, userId);
            } else {
                // Process requests sequentially
                responses = await this.processSequentialRequests(requests, req, userId);
            }
        } catch (error) {
            logger.error('Batch processing failed:', {
                error: error.message,
                stack: error.stack,
                userId
            });
            return res.status(500).json({
                success: false,
                error: 'Batch processing failed',
                message: 'An error occurred while processing the batch request',
                details: error.message
            });
        }

        const duration = Date.now() - startedAt;
        const successCount = responses.filter(r => !r.error).length;
        const errorCount = responses.filter(r => r.error).length;

        metricsCollector.recordRequestDuration('POST', '/api/batch', 200, duration);
        metricsCollector.recordBatchStats(requests.length, successCount, errorCount, duration);

        res.json({
            success: true,
            message: `Batch processed successfully: ${successCount} succeeded, ${errorCount} failed`,
            data: {
                responses,
                batchDuration: duration,
                totalRequests: requests.length,
                successCount,
                errorCount
            }
        });
    }

    async processSequentialRequests(requests, originalReq, userId) {
        const responses = [];

        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            const response = await this.processSingleRequest(request, originalReq, userId, i);
            responses.push(response);
        }

        return responses;
    }

    async processParallelRequests(requests, originalReq, userId) {
        // Process requests in chunks to respect concurrency limit
        const chunks = [];
        for (let i = 0; i < requests.length; i += this.maxConcurrentRequests) {
            chunks.push(requests.slice(i, i + this.maxConcurrentRequests));
        }

        const responses = [];
        let currentIndex = 0;

        for (const chunk of chunks) {
            const chunkResponses = await Promise.all(
                chunk.map((request, index) => 
                    this.processSingleRequest(request, originalReq, userId, currentIndex + index)
                )
            );
            responses.push(...chunkResponses);
            currentIndex += chunk.length;
        }

        return responses;
    }

    async processSingleRequest(request, originalReq, userId, requestId) {
        const { method, path, body, params, query } = request;

        if (!method || !path) {
            return {
                id: requestId,
                error: {
                    status: 400,
                    message: 'Missing required fields: method and path'
                }
            };
        }

        try {
            // Create a mock request object
            const mockReq = {
                ...originalReq,
                method: method.toUpperCase(),
                path: path,
                url: path,
                body: body || {},
                params: params || {},
                query: query || {},
                user: originalReq.user,
                authUserId: userId
            };

            // Create a mock response object
            const mockRes = {
                statusCode: 200,
                headers: {},
                body: null,
                status(code) {
                    this.statusCode = code;
                    return this;
                },
                json(data) {
                    this.body = data;
                    return this;
                },
                setHeader(name, value) {
                    this.headers[name] = value;
                    return this;
                }
            };

            // Handle the request using the app's router
            await this.handleRequest(mockReq, mockRes);

            return {
                id: requestId,
                status: mockRes.statusCode,
                body: mockRes.body
            };
        } catch (error) {
            logger.error(`Batch request ${requestId} failed:`, {
                error: error.message,
                path: request.path,
                method: request.method,
                userId
            });
            return {
                id: requestId,
                error: {
                    status: error.statusCode || 500,
                    message: error.message || 'Internal server error'
                }
            };
        }
    }

    async handleRequest(req, res) {
        return new Promise((resolve, reject) => {
            // Use express router to handle the request
            this.app(req, res, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async getBatchStats(req, res) {
        try {
            const stats = await metricsCollector.getBatchStats();
            res.json({
                success: true,
                message: 'Batch statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            logger.error('Failed to get batch stats:', {
                error: error.message
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get batch statistics',
                message: 'An error occurred while retrieving batch statistics'
            });
        }
    }
}

module.exports = BatchUtil;
