const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Budget = require('../models/Budget');
const CategoryService = require('./categoryService');
const { executeRulesForTransaction } = require('./savingsRuleExecutor');
const logger = require('../utils/logger');
const metricsCollector = require('../utils/metricsCollector');
const cacheUtil = require('../utils/cacheUtil');
const { circuitBreakers } = require('../utils/circuitBreaker');

// Conditionally load Bull and create queue if Redis is available
let Bull;
let transactionQueue;
let currentConcurrency = 5;

if (process.env.NODE_ENV !== 'test') {
    try {
        Bull = require('bull');
        // Create a transaction queue with enhanced configuration
        transactionQueue = new Bull('transactionQueue', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || '',
                maxRetriesPerRequest: 3,
                connectTimeout: 10000,
                retryStrategy: (times) => {
                    // Exponential backoff with max delay of 30 seconds
                    return Math.min(1000 * Math.pow(2, times), 30000);
                }
            },
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                removeOnComplete: { age: 86400 }, // Remove completed jobs after 24 hours
                removeOnFail: { age: 604800 },    // Remove failed jobs after 7 days
                timeout: 60000                    // 1 minute timeout per job
            },
            settings: {
                lockDuration: 30000,              // 30 seconds lock on jobs
                lockRenewTime: 15000,             // Renew lock every 15 seconds
                maxStalledCount: 3,               // Max stalled jobs before failing
                guardInterval: 5000,              // Check for stalled jobs every 5 seconds
                drainDelay: 5000,                 // Delay after queue drain
                maxLimit: 10000                   // Max jobs in queue
            }
        });

        // Add event listeners for queue monitoring
        transactionQueue.on('completed', (job, result) => {
            logger.info(`✅ Transaction job ${job.id} completed: ${result.message}`);
            metricsCollector.recordQueueEvent('completed', 'transactionQueue');
        });

        transactionQueue.on('failed', (job, error) => {
            logger.error(`❌ Transaction job ${job.id} failed: ${error.message}`);
            metricsCollector.recordQueueEvent('failed', 'transactionQueue');
        });

        transactionQueue.on('stalled', (job) => {
            logger.warn(`⚠️ Transaction job ${job.id} stalled`);
            metricsCollector.recordQueueEvent('stalled', 'transactionQueue');
        });

        transactionQueue.on('drained', () => {
            logger.info('📊 Transaction queue drained');
            metricsCollector.recordQueueEvent('drained', 'transactionQueue');
        });

        transactionQueue.on('error', (error) => {
            logger.error(`🔥 Transaction queue error: ${error.message}`);
            metricsCollector.recordQueueEvent('error', 'transactionQueue');
        });

        // Throttle concurrency based on system load
        const updateConcurrency = () => {
            let load = 0.5; // Default load value for Windows
            if (typeof process.loadavg === 'function') {
                load = process.loadavg()[0];
            }
            if (load > 4) {
                currentConcurrency = Math.max(1, currentConcurrency - 1);
            } else if (load < 1 && currentConcurrency < 10) {
                currentConcurrency = currentConcurrency + 1;
            }
            // Update queue concurrency
            if (transactionQueue) {
                transactionQueue.process(currentConcurrency, processTransactionJob);
                logger.info(`⚙️  Updated queue concurrency to ${currentConcurrency} based on system load: ${load}`);
            }
        };

        // Update concurrency every minute
        setInterval(updateConcurrency, 60000);

        // Start processing with initial concurrency
        transactionQueue.process(currentConcurrency, processTransactionJob);

        // Set up periodic job cleanup
        setInterval(clearCompletedJobs, 3600000); // Every hour
    } catch (error) {
        logger.warn(`Redis connection failed: ${error.message}. Queue functionality will be disabled.`);
        transactionQueue = null;
    }
}

// Process transaction jobs with concurrency
async function processTransactionJob(job) {
    const startedAt = Date.now();
    try {
        const { userId, amount, type, category, description, walletId, date, savingsAccountId, priority = 1 } = job.data;
        
        logger.info(`🔄 Processing transaction job ${job.id} with priority ${priority}`);
        
        // Validate required fields
        if (!amount || !type) {
            throw new Error('Amount and type are required');
        }

        // If category is provided, validate it as an ID
        let finalCategory;
        if (category) {
            finalCategory = await CategoryService.handleCategory(category, userId);
        } 
        // If no category but description exists, use AI fallback
        else if (description && description.trim()) {
            try {
                // Use circuit breaker for AI service calls
                const suggestedCategory = await circuitBreakers.aiService.execute(
                    () => CategoryService.suggestCategory(description),
                    () => 'Other' // Fallback category name if AI service fails
                );
                finalCategory = await CategoryService.handleCategory(suggestedCategory, userId);
            } catch (aiError) {
                logger.warn(`AI categorization failed: ${aiError.message}, using default category`);
                // Use a default category if AI fails
                const defaultCategory = await CategoryService.getDefaultCategory(userId);
                finalCategory = defaultCategory;
            }
        } else {
            throw new Error('Please provide a category or description');
        }

        // Create the transaction
        const transactionData = {
            userId,
            amount: parseFloat(amount),
            type,
            category: finalCategory._id,
            description,
            walletId,
            savingsAccountId,
            date: date || new Date(),
            status: 'completed'
        };
        
        const transaction = new Transaction(transactionData);
        await transaction.save();
        
        // Update wallet balance if provided
        let wallet = null;
        if (walletId) {
            wallet = await Wallet.findOne({ _id: walletId, userId, isActive: true });
            if (wallet) {
                if (type === 'expense') {
                    wallet.balance -= parseFloat(amount);
                } else if (type === 'income') {
                    wallet.balance += parseFloat(amount);
                }
                await wallet.save();
            }
        }

        // Update budget (if category and walletId are provided)
        if (finalCategory._id && walletId) {
            try {
                const matchingBudget = await Budget.findOne({
                    userId,
                    category: finalCategory._id,
                    walletId
                });
                if (matchingBudget) {
                    await matchingBudget.updateTotalSpent(amount, type);
                }
            } catch (budgetError) {
                logger.error(`Budget update failed: ${budgetError.message}`);
                // Continue processing even if budget update fails
            }
        }

        // Execute savings rules
        try {
            await executeRulesForTransaction(userId, transaction.toObject());
        } catch (err) {
            logger.error(`Auto savings error: ${err.message}`);
            // Continue processing even if savings rules fail
        }

        // Clear relevant cache keys to ensure data consistency
        try {
            await cacheUtil.clearByPattern(`category_spending:${userId}:*`);
            await cacheUtil.clearByPattern(`monthly_trend:${userId}:*`);
            await cacheUtil.clearByPattern(`recurring_transactions:${userId}:*`);
            logger.debug(`Cache cleared for user ${userId} after transaction processing`);
        } catch (cacheError) {
            logger.error(`Error clearing cache: ${cacheError.message}`);
            // Continue processing even if cache clearing fails
        }

        const duration = Date.now() - startedAt;
        metricsCollector.recordJobDuration('transactionQueue', duration);

        return {
            success: true,
            transactionId: transaction._id,
            message: 'Transaction processed successfully',
            processingTime: duration
        };
    } catch (error) {
        const duration = Date.now() - startedAt;
        metricsCollector.recordJobDuration('transactionQueue', duration);
        logger.error(`Transaction queue processing error: ${error.message}`, { error: error.stack });
        throw error;
    }
}

// Add a transaction to the queue with rate limiting
const addTransactionToQueue = async (transactionData, options = {}) => {
    // If queue is not available (e.g., in test environment), process immediately
    if (!transactionQueue) {
        logger.info('Queue not available, processing transaction immediately');
        const result = await processTransactionJob({ data: transactionData, id: 'test-job' });
        return { id: 'test-job', ...result };
    }

    try {
        // Check queue size and implement backpressure
        const queueStats = await transactionQueue.getJobCounts();
        const totalJobs = queueStats.waiting + queueStats.active + queueStats.delayed;
        
        if (totalJobs > 1000) {
            logger.warn(`Queue backpressure detected: ${totalJobs} jobs in queue`);
            // Implement backpressure by delaying the job
            options.delay = options.delay || 1000;
        }
        
        const jobOptions = {
            priority: transactionData.priority || 1,
            attempts: options.attempts || 5,
            backoff: options.backoff || {
                type: 'exponential',
                delay: 2000
            },
            timeout: options.timeout || 60000,
            delay: options.delay
        };
        
        const job = await transactionQueue.add(transactionData, jobOptions);
        logger.info(`📥 Added transaction job ${job.id} to queue with priority ${jobOptions.priority}`);
        metricsCollector.recordQueueEvent('added', 'transactionQueue');
        return job;
    } catch (error) {
        logger.error(`Error adding transaction to queue: ${error.message}`);
        metricsCollector.recordQueueEvent('error', 'transactionQueue');
        throw error;
    }
};

// Get job status
const getJobStatus = async (jobId) => {
    if (!transactionQueue) {
        return { status: 'not_found' };
    }

    try {
        const job = await transactionQueue.getJob(jobId);
        if (!job) {
            return { status: 'not_found' };
        }
        return { 
            status: job.status,
            progress: job.progress(),
            timestamp: job.timestamp,
            attemptsMade: job.attemptsMade,
            failReason: job.failedReason
        };
    } catch (error) {
        logger.error(`Error getting job status: ${error.message}`);
        throw error;
    }
};

// Get queue statistics
const getQueueStats = async () => {
    if (!transactionQueue) {
        return {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
            activeJobs: 0,
            waitingJobs: 0,
            delayedJobs: 0,
            concurrency: 0
        };
    }

    try {
        const stats = await transactionQueue.getJobCounts();
        const jobs = await transactionQueue.getJobs(['active', 'waiting', 'delayed']);
        
        const result = {
            ...stats,
            activeJobs: jobs.filter(job => job.status === 'active').length,
            waitingJobs: jobs.filter(job => job.status === 'waiting').length,
            delayedJobs: jobs.filter(job => job.status === 'delayed').length,
            concurrency: currentConcurrency
        };
        
        metricsCollector.recordQueueStats('transactionQueue', result);
        return result;
    } catch (error) {
        logger.error(`Error getting queue stats: ${error.message}`);
        throw error;
    }
};

// Pause queue processing
const pauseQueue = async () => {
    if (!transactionQueue) {
        logger.warn('Queue not available, cannot pause');
        return;
    }

    try {
        await transactionQueue.pause();
        logger.info('⏸️  Transaction queue paused');
        metricsCollector.recordQueueEvent('paused', 'transactionQueue');
    } catch (error) {
        logger.error(`Error pausing queue: ${error.message}`);
        throw error;
    }
};

// Resume queue processing
const resumeQueue = async () => {
    if (!transactionQueue) {
        logger.warn('Queue not available, cannot resume');
        return;
    }

    try {
        await transactionQueue.resume();
        logger.info('▶️  Transaction queue resumed');
        metricsCollector.recordQueueEvent('resumed', 'transactionQueue');
    } catch (error) {
        logger.error(`Error resuming queue: ${error.message}`);
        throw error;
    }
};

// Clear completed jobs to free up space
const clearCompletedJobs = async () => {
    if (!transactionQueue) {
        return;
    }

    try {
        await transactionQueue.clean(3600000); // Clean jobs older than 1 hour
        logger.info('🧹 Cleared completed jobs from queue');
    } catch (error) {
        logger.error(`Error clearing completed jobs: ${error.message}`);
        throw error;
    }
};

module.exports = {
    transactionQueue,
    addTransactionToQueue,
    getJobStatus,
    getQueueStats,
    pauseQueue,
    resumeQueue,
    clearCompletedJobs
};