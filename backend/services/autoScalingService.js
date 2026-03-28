const os = require('os');
const { spawn, kill } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

class AutoScalingService {
    constructor() {
        this.instances = [];
        this.minInstances = process.env.MIN_INSTANCES ? parseInt(process.env.MIN_INSTANCES) : 2;
        this.maxInstances = process.env.MAX_INSTANCES ? parseInt(process.env.MAX_INSTANCES) : 5;
        this.cpuThreshold = process.env.CPU_THRESHOLD ? parseFloat(process.env.CPU_THRESHOLD) : 70;
        this.memoryThreshold = process.env.MEMORY_THRESHOLD ? parseFloat(process.env.MEMORY_THRESHOLD) : 80;
        this.checkInterval = process.env.CHECK_INTERVAL ? parseInt(process.env.CHECK_INTERVAL) : 30000; // 30 seconds
        this.basePort = 5001;
        this.monitoringInterval = null;
    }

    // Start the auto-scaling service
    start() {
        logger.info('🔄 Starting auto-scaling service...');
        logger.info(`📊 Auto-scaling configuration: min=${this.minInstances}, max=${this.maxInstances}, CPU threshold=${this.cpuThreshold}%, memory threshold=${this.memoryThreshold}%`);
        
        // Start with minimum instances
        this.scaleTo(this.minInstances);
        
        // Start monitoring
        this.monitoringInterval = setInterval(() => {
            this.checkResourceUtilization();
        }, this.checkInterval);
        
        logger.info('✅ Auto-scaling service started');
    }

    // Stop the auto-scaling service
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        // Stop all instances
        this.instances.forEach(instance => {
            try {
                instance.process.kill();
                logger.info(`⏹️  Stopped instance on port ${instance.port}`);
            } catch (error) {
                logger.error(`❌ Error stopping instance on port ${instance.port}:`, error);
            }
        });
        
        this.instances = [];
        logger.info('🛑 Auto-scaling service stopped');
    }

    // Check resource utilization and scale accordingly
    checkResourceUtilization() {
        const cpuUsage = this.getCPUUsage();
        const memoryUsage = this.getMemoryUsage();
        
        logger.info(`📈 Resource utilization: CPU=${cpuUsage.toFixed(2)}%, Memory=${memoryUsage.toFixed(2)}%`);
        
        if (cpuUsage > this.cpuThreshold || memoryUsage > this.memoryThreshold) {
            // Need to scale up
            if (this.instances.length < this.maxInstances) {
                const newInstanceCount = Math.min(this.instances.length + 1, this.maxInstances);
                logger.info(`📈 Scaling up to ${newInstanceCount} instances due to high resource utilization`);
                this.scaleTo(newInstanceCount);
            }
        } else if (cpuUsage < this.cpuThreshold * 0.5 && memoryUsage < this.memoryThreshold * 0.5) {
            // Can scale down
            if (this.instances.length > this.minInstances) {
                const newInstanceCount = Math.max(this.instances.length - 1, this.minInstances);
                logger.info(`📉 Scaling down to ${newInstanceCount} instances due to low resource utilization`);
                this.scaleTo(newInstanceCount);
            }
        }
    }

    // Scale to a specific number of instances
    scaleTo(targetCount) {
        const currentCount = this.instances.length;
        
        if (targetCount > currentCount) {
            // Scale up
            for (let i = currentCount; i < targetCount; i++) {
                const port = this.basePort + i;
                this.startInstance(port);
            }
        } else if (targetCount < currentCount) {
            // Scale down
            for (let i = currentCount - 1; i >= targetCount; i--) {
                const instance = this.instances[i];
                if (instance) {
                    try {
                        instance.process.kill();
                        logger.info(`⏹️  Stopped instance on port ${instance.port}`);
                    } catch (error) {
                        logger.error(`❌ Error stopping instance on port ${instance.port}:`, error);
                    }
                    this.instances.splice(i, 1);
                }
            }
        }
        
        logger.info(`✅ Scaled to ${this.instances.length} instances`);
    }

    // Start a new server instance
    startInstance(port) {
        logger.info(`🚀 Starting new instance on port ${port}...`);
        
        const child = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            env: {
                ...process.env,
                PORT: port,
                NODE_ENV: process.env.NODE_ENV || 'development'
            },
            stdio: 'inherit'
        });
        
        const instance = {
            port,
            process: child,
            startTime: Date.now()
        };
        
        this.instances.push(instance);
        
        child.on('error', (err) => {
            logger.error(`❌ Error starting instance on port ${port}:`, err);
        });
        
        child.on('exit', (code) => {
            logger.info(`📝 Instance on port ${port} exited with code ${code}`);
            // Remove from instances array
            this.instances = this.instances.filter(inst => inst.port !== port);
        });
        
        logger.info(`✅ Started instance on port ${port}`);
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
        
        return ((1 - totalIdle / totalTick) * 100).toFixed(2);
    }

    // Get memory usage percentage
    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        return ((usedMemory / totalMemory) * 100).toFixed(2);
    }

    // Get current instance status
    getStatus() {
        return {
            instanceCount: this.instances.length,
            minInstances: this.minInstances,
            maxInstances: this.maxInstances,
            cpuThreshold: this.cpuThreshold,
            memoryThreshold: this.memoryThreshold,
            instances: this.instances.map(instance => ({
                port: instance.port,
                uptime: Math.round((Date.now() - instance.startTime) / 1000)
            })),
            resourceUtilization: {
                cpu: this.getCPUUsage(),
                memory: this.getMemoryUsage()
            }
        };
    }
}

// Export singleton instance
module.exports = new AutoScalingService();
