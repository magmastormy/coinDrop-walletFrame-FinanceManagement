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
    }

    // Initialize resource management
    initialize() {
        logger.info('🔄 Initializing resource management service...');
        logger.info(`📊 Resource limits: Memory=${this.resourceLimits.maxMemoryUsage}%, CPU=${this.resourceLimits.maxCPUUsage}%, Files=${this.resourceLimits.maxOpenFiles}, Connections=${this.resourceLimits.maxConnections}`);
        
        // Set up resource monitoring
        this.startResourceMonitoring();
        
        logger.info('✅ Resource management service initialized');
    }

    // Start resource monitoring
    startResourceMonitoring() {
        // Monitor resources every 10 seconds, but not in test environment
        if (process.env.NODE_ENV !== 'test') {
            setInterval(() => {
                this.checkResourceUsage();
            }, 10000);
        }
    }

    // Check resource usage and alert if limits are exceeded
    checkResourceUsage() {
        const memoryUsage = this.getMemoryUsage();
        const cpuUsage = this.getCPUUsage();
        
        // Check memory usage
        if (memoryUsage > this.resourceLimits.maxMemoryUsage) {
            logger.warn(`⚠️ Memory usage exceeded limit: ${memoryUsage.toFixed(2)}% > ${this.resourceLimits.maxMemoryUsage}%`);
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
}

// Export singleton instance
module.exports = new ResourceManagementService();
