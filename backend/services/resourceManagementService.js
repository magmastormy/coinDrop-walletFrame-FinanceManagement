const os = require('os');
const logger = require('../utils/logger');

class ResourceManagementService {
    constructor() {
        this.resourceLimits = {
            maxMemoryUsage: process.env.MAX_MEMORY_USAGE || 80, // percentage
            maxCPUUsage: process.env.MAX_CPU_USAGE || 80,     // percentage
            maxOpenFiles: process.env.MAX_OPEN_FILES || 10000, // number of files
            maxConnections: process.env.MAX_CONNECTIONS || 1000 // number of connections
        };
        
        this.currentConnections = 0;
        this.maxConnectionsReached = false;
        this.memoryCleanupInterval = null;
        this.memoryLeakDetection = {
            lastMemoryUsage: 0,
            memoryGrowthTrend: [],
            leakThreshold: 5 // percentage increase over 5 intervals
        };
        this.objectPools = new Map();
    }

    // Initialize resource management
    initialize() {
        logger.info('🔄 Initializing resource management service...');
        logger.info(`📊 Resource limits: Memory=${this.resourceLimits.maxMemoryUsage}%, CPU=${this.resourceLimits.maxCPUUsage}%, Files=${this.resourceLimits.maxOpenFiles}, Connections=${this.resourceLimits.maxConnections}`);
        
        // Set up resource monitoring
        this.startResourceMonitoring();
        this.startMemoryCleanup();
        
        logger.info('✅ Resource management service initialized');
    }

    // Start resource monitoring
    startResourceMonitoring() {
        // Monitor resources every 10 seconds, but not in test environment
        if (process.env.NODE_ENV !== 'test') {
            setInterval(() => {
                this.checkResourceUsage();
                this.detectMemoryLeaks();
            }, 10000);
        }
    }

    // Start memory cleanup process
    startMemoryCleanup() {
        // Clean up memory every 30 seconds
        if (process.env.NODE_ENV !== 'test') {
            this.memoryCleanupInterval = setInterval(() => {
                this.optimizeMemoryUsage();
            }, 30000);
        }
    }

    // Check resource usage and alert if limits are exceeded
    checkResourceUsage() {
        const memoryUsage = this.getMemoryUsage();
        const cpuUsage = this.getCPUUsage();
        
        // Check memory usage
        if (memoryUsage > this.resourceLimits.maxMemoryUsage) {
            logger.warn(`⚠️ Memory usage exceeded limit: ${memoryUsage.toFixed(2)}% > ${this.resourceLimits.maxMemoryUsage}%`);
            this.optimizeMemoryUsage(true);
        }
        
        // Check CPU usage
        if (cpuUsage > this.resourceLimits.maxCPUUsage) {
            logger.warn(`⚠️ CPU usage exceeded limit: ${cpuUsage.toFixed(2)}% > ${this.resourceLimits.maxCPUUsage}%`);
        }
        
        // Check connection count
        if (this.currentConnections > this.resourceLimits.maxConnections) {
            if (!this.maxConnectionsReached) {
                logger.warn(`⚠️ Connection count exceeded limit: ${this.currentConnections} > ${this.resourceLimits.maxConnections}`);
                this.maxConnectionsReached = true;
            }
        } else {
            this.maxConnectionsReached = false;
        }
    }

    // Get memory usage percentage
    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        return parseFloat(((usedMemory / totalMemory) * 100).toFixed(2));
    }

    // Get CPU usage percentage
    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        
        return parseFloat(((1 - totalIdle / totalTick) * 100).toFixed(2));
    }

    // Track connection count
    incrementConnectionCount() {
        this.currentConnections++;
        if (this.currentConnections > this.resourceLimits.maxConnections) {
            logger.warn(`⚠️ Connection count reached: ${this.currentConnections}`);
        }
    }

    // Decrement connection count
    decrementConnectionCount() {
        if (this.currentConnections > 0) {
            this.currentConnections--;
        }
    }

    // Check if resource limits allow new connections
    canAcceptNewConnection() {
        const memoryUsage = this.getMemoryUsage();
        const cpuUsage = this.getCPUUsage();
        
        // Check if any resource is critically low
        if (memoryUsage > this.resourceLimits.maxMemoryUsage * 0.9) {
            return false;
        }
        
        if (cpuUsage > this.resourceLimits.maxCPUUsage * 0.9) {
            return false;
        }
        
        if (this.currentConnections >= this.resourceLimits.maxConnections) {
            return false;
        }
        
        return true;
    }

    // Get resource status
    getResourceStatus() {
        return {
            memory: {
                usage: this.getMemoryUsage(),
                limit: this.resourceLimits.maxMemoryUsage,
                total: Math.round(os.totalmem() / 1024 / 1024),
                free: Math.round(os.freemem() / 1024 / 1024)
            },
            cpu: {
                usage: this.getCPUUsage(),
                limit: this.resourceLimits.maxCPUUsage,
                cores: os.cpus().length
            },
            connections: {
                current: this.currentConnections,
                limit: this.resourceLimits.maxConnections
            },
            system: {
                uptime: Math.round(os.uptime()),
                loadAverage: os.loadavg(),
                platform: os.platform(),
                arch: os.arch()
            }
        };
    }

    // Optimize memory usage
    optimizeMemoryUsage(force = false) {
        const memoryUsage = this.getMemoryUsage();
        
        // Only optimize if memory usage is high or forced
        if (force || memoryUsage > this.resourceLimits.maxMemoryUsage * 0.7) {
            logger.info('🔧 Optimizing memory usage...');
            
            // Force garbage collection if available
            if (global.gc) {
                try {
                    const beforeMemory = process.memoryUsage();
                    global.gc();
                    const afterMemory = process.memoryUsage();
                    const freedMemory = ((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024).toFixed(2);
                    logger.info(`✅ Garbage collection performed, freed ${freedMemory} MB`);
                } catch (error) {
                    logger.warn('⚠️ Garbage collection not available, run node with --expose-gc');
                }
            }
            
            // Clear object pools if memory is critically low
            if (memoryUsage > this.resourceLimits.maxMemoryUsage * 0.9) {
                this.clearObjectPools();
            }
        }
    }

    // Detect memory leaks
    detectMemoryLeaks() {
        const currentMemoryUsage = this.getMemoryUsage();
        const lastMemoryUsage = this.memoryLeakDetection.lastMemoryUsage;
        
        if (lastMemoryUsage > 0) {
            const memoryIncrease = currentMemoryUsage - lastMemoryUsage;
            this.memoryLeakDetection.memoryGrowthTrend.push(memoryIncrease);
            
            // Keep only the last 5 measurements
            if (this.memoryLeakDetection.memoryGrowthTrend.length > 5) {
                this.memoryLeakDetection.memoryGrowthTrend.shift();
            }
            
            // Check for consistent memory growth
            const averageGrowth = this.memoryLeakDetection.memoryGrowthTrend.reduce((sum, val) => sum + val, 0) / this.memoryLeakDetection.memoryGrowthTrend.length;
            
            if (averageGrowth > this.memoryLeakDetection.leakThreshold) {
                logger.warn(`⚠️ Potential memory leak detected: Average memory growth of ${averageGrowth.toFixed(2)}% over 5 intervals`);
            }
        }
        
        this.memoryLeakDetection.lastMemoryUsage = currentMemoryUsage;
    }

    // Object pool management
    getFromPool(poolName, createFn) {
        if (!this.objectPools.has(poolName)) {
            this.objectPools.set(poolName, []);
        }
        
        const pool = this.objectPools.get(poolName);
        if (pool.length > 0) {
            return pool.pop();
        }
        
        return createFn();
    }

    returnToPool(poolName, object) {
        if (!this.objectPools.has(poolName)) {
            this.objectPools.set(poolName, []);
        }
        
        const pool = this.objectPools.get(poolName);
        // Limit pool size to prevent memory issues
        if (pool.length < 100) {
            pool.push(object);
        }
    }

    // Clear object pools
    clearObjectPools() {
        const poolCount = this.objectPools.size;
        this.objectPools.clear();
        logger.info(`✅ Cleared ${poolCount} object pools to free memory`);
    }

    // Clean up resources
    cleanup() {
        if (this.memoryCleanupInterval) {
            clearInterval(this.memoryCleanupInterval);
        }
        this.clearObjectPools();
        logger.info('✅ Resource management service cleaned up');
    }
}

// Export singleton instance
module.exports = new ResourceManagementService();
