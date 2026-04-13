const logger = require('../utils/logger');

const { spawn } = require('child_process');
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * Sanitize text to remove invalid Unicode characters and surrogate pairs
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeUnicode(text) {
  if (typeof text !== 'string') return text;
  
  // Replace lone surrogates with the Unicode replacement character
  return text.replace(/[\uD800-\uDBFF][^\uDC00-\uDFFF]|[^\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF]$|^[\uDC00-\uDFFF]/g, '�')
    // Remove other control characters except common whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Process pool for Python processes
const processPool = [];
const MAX_POOL_SIZE = 8; // Increased to handle more concurrent users
let isInitialized = false;
let requestQueue = [];
let processingCount = 0;
const MAX_CONCURRENT_REQUESTS = 12; // Increased to support more simultaneous users

// Performance metrics
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalProcessingTime = 0;

// Process TTL and other constants
const PROCESS_TTL_MS = 3600000; // 1 hour TTL for processes
const PROCESS_MEMORY_LIMIT_MB = 256; // Memory limit per process in MB
const MAX_REQUESTS_PER_PROCESS = 100; // Max requests before process refresh
const IDLE_TIMEOUT_MS = 300000; // 5 minutes idle timeout for processes

// Circuit breaker pattern implementation
const circuitBreaker = {
  state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
  failureCount: 0,
  lastFailureTime: 0,
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  
  // Record a failure and potentially open the circuit
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold && this.state === 'CLOSED') {
      logger.debug(`[aiClient] Circuit breaker opened after ${this.failureCount} failures`);
      this.state = 'OPEN';
    }
  },
  
  // Record a success and potentially close the circuit
  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      logger.debug('[aiClient] Circuit breaker closed after successful request');
      this.state = 'CLOSED';
      this.failureCount = 0;
    }
  },
  
  // Check if the circuit is open
  isOpen() {
    if (this.state === 'OPEN') {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        logger.debug('[aiClient] Circuit breaker transitioning to HALF_OPEN state');
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }
};

/**
 * Initialize the process pool
 * @private
 */
async function initializePool() {
  if (isInitialized) return;
  isInitialized = true;
  
  logger.debug('[aiClient] Initializing process pool');
  
  // Create initial processes with staggered initialization to prevent resource contention
  for (let i = 0; i < MAX_POOL_SIZE; i++) {
    try {
      // Stagger process creation to reduce resource contention
      await new Promise(resolve => setTimeout(resolve, i * 200));
      const proc = await createPythonProcess();
      processPool.push(proc);
      logger.debug(`[aiClient] Pre-populated process ${processPool.length}/${MAX_POOL_SIZE}`);
    } catch (err) {
      logger.error(`[aiClient] Error pre-populating process pool: ${err.message}`);
    }
  }
  
  // Set up periodic health check and pool maintenance
  setInterval(maintainProcessPool, 60000); // Check pool health every minute
}

/**
 * Health check and maintenance for the process pool
 */
function healthCheck() {
  logger.debug(`[aiClient] Health check - Pool size: ${processPool.length}/${MAX_POOL_SIZE}, Processing: ${processingCount}/${MAX_CONCURRENT_REQUESTS}, Queue: ${requestQueue.length}`);
  logger.debug(`[aiClient] Metrics - Total: ${totalRequests}, Success: ${successfulRequests}, Failed: ${failedRequests}, Avg time: ${totalRequests > 0 ? (totalProcessingTime / totalRequests).toFixed(2) : 0}ms`);
}

// Track process metadata for TTL and memory monitoring
const processMetadata = new Map(); // Map<process, {createdAt, requestCount, lastUsed, memoryUsage, idleTime}>

/**
 * Maintain the process pool health by refreshing processes and ensuring pool size
 */
async function maintainProcessPool() {
  healthCheck();
  
  const now = Date.now();
  
  // Check all processes for TTL expiration, memory issues, or idle timeout
  for (let i = processPool.length - 1; i >= 0; i--) {
    const proc = processPool[i];
    const metadata = processMetadata.get(proc);
    
    if (!metadata) continue;
    
    const age = now - metadata.createdAt;
    const idleTime = now - metadata.lastUsed;
    const shouldRefresh = 
      age > PROCESS_TTL_MS ||  // TTL expired
      metadata.requestCount > MAX_REQUESTS_PER_PROCESS ||  // After max requests
      idleTime > IDLE_TIMEOUT_MS ||  // Idle timeout
      (metadata.memoryUsage && metadata.memoryUsage > PROCESS_MEMORY_LIMIT_MB);  // Memory limit exceeded
    
    if (shouldRefresh) {
      logger.debug(`[aiClient] Refreshing process (age: ${(age/60000).toFixed(1)}min, requests: ${metadata.requestCount}, idle: ${(idleTime/60000).toFixed(1)}min, memory: ${metadata.memoryUsage || 'N/A'}MB)`);
      try {
        proc.kill('SIGTERM');
        processPool.splice(i, 1);
        processMetadata.delete(proc);
        
        // Create replacement process
        const newProc = await createPythonProcess();
        processPool.push(newProc);
        processMetadata.set(newProc, {
          createdAt: now,
          requestCount: 0,
          lastUsed: now,
          memoryUsage: 0,
          idleTime: 0
        });
      } catch (err) {
        logger.error(`[aiClient] Error refreshing process: ${err.message}`);
      }
    }
  }
  
  // Check if we need to add processes to the pool
  const neededProcesses = MAX_POOL_SIZE - processPool.length;
  if (neededProcesses > 0) {
    logger.debug(`[aiClient] Adding ${neededProcesses} missing processes to pool`);
    for (let i = 0; i < neededProcesses; i++) {
      try {
        // Stagger process creation
        await new Promise(resolve => setTimeout(resolve, i * 200));
        const proc = await createPythonProcess();
        processPool.push(proc);
        processMetadata.set(proc, {
          createdAt: now,
          requestCount: 0,
          lastUsed: now,
          memoryUsage: 0,
          idleTime: 0
        });
        logger.debug(`[aiClient] Added process to pool (${processPool.length}/${MAX_POOL_SIZE})`);
      } catch (err) {
        logger.error(`[aiClient] Error adding process to pool: ${err.message}`);
      }
    }
  }
  
  // Log detailed pool health metrics
  const activeProcesses = processPool.length;
  const idleProcesses = processPool.filter(proc => {
    const metadata = processMetadata.get(proc);
    return metadata && (now - metadata.lastUsed) > 60000; // Idle for more than 1 minute
  }).length;
  
  logger.debug(`[aiClient] Pool health - Active: ${activeProcesses}, Idle: ${idleProcesses}, Max: ${MAX_POOL_SIZE}`);
}

/**
 * Get a Python process from the pool or create a new one
 * @private
 * @returns {Promise<ChildProcess>} A Python process
 */
async function getProcess() {
  if (!isInitialized) {
    await initializePool();
  }
  
  // Get a process from the pool if available
  if (processPool.length > 0) {
    const proc = processPool.pop();
    const metadata = processMetadata.get(proc);
    if (metadata) {
      metadata.requestCount++;
      metadata.lastUsed = Date.now();
      metadata.idleTime = 0;
    }
    logger.debug(`[aiClient] Reusing Python process from pool (${processPool.length} remaining, requests: ${metadata?.requestCount || 0})`);
    return proc;
  }
  
  // Create a new process using the createPythonProcess function
  logger.debug('[aiClient] Creating new Python process');
  const proc = await createPythonProcess();
  
  // Initialize metadata for this process
  const now = Date.now();
  processMetadata.set(proc, {
    createdAt: now,
    requestCount: 0,
    lastUsed: now,
    memoryUsage: 0,
    idleTime: 0
  });
  
  return proc;
}

/**
 * Release a process back to the pool or destroy it
 * @private
 * @param {ChildProcess} proc - The process to release
 */
function releaseProcess(proc) {
  const metadata = processMetadata.get(proc);
  
  // Check memory usage before returning to pool
  if (metadata && metadata.requestCount > 0) {
    // Log memory info every 50 requests
    if (metadata.requestCount % 50 === 0) {
      logger.debug(`[aiClient] Process stats - Requests: ${metadata.requestCount}, Age: ${((Date.now() - metadata.createdAt)/60000).toFixed(1)}min, Memory: ${metadata.memoryUsage || 'N/A'}MB`);
    }
  }
  
  if (processPool.length < MAX_POOL_SIZE) {
    logger.debug(`[aiClient] Returning process to pool (${processPool.length + 1} total)`);
    processPool.push(proc);
  } else {
    logger.debug('[aiClient] Pool full, destroying process');
    processMetadata.delete(proc);
    try {
      proc.kill('SIGTERM');
    } catch (err) {
      logger.error(`[aiClient] Error killing process: ${err.message}`);
    }
  }
}

/**
 * Queues a request to be processed when resources are available
 * @private
 * @param {Array} messages - Array of message objects { role, content }
 * @param {Object} options - Request options
 * @returns {Promise<string>} - AI response content
 */
function queueRequest(messages, options) {
  return new Promise((resolve, reject) => {
    const request = {
      messages,
      options,
      resolve,
      reject,
      timestamp: Date.now()
    };
    
    requestQueue.push(request);
    logger.debug(`[aiClient] Request queued. Queue length: ${requestQueue.length}`);
    
    // Process the queue if we're not at max capacity
    processQueue();
  });
}

/**
 * Process requests from the queue if resources are available
 * @private
 */
async function processQueue() {
  // If we're at max capacity or the queue is empty, do nothing
  if (processingCount >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }
  
  // Get the next request from the queue
  const request = requestQueue.shift();
  processingCount++;
  
  // Log queue stats
  logger.debug(`[aiClient] Processing request. Queue length: ${requestQueue.length}, Active: ${processingCount}/${MAX_CONCURRENT_REQUESTS}`);
  
  try {
    // Process the request
    const result = await processRequestWithRetries(request.messages, request.options);
    request.resolve(result);
  } catch (err) {
    request.reject(err);
  } finally {
    // Decrement the processing count
    processingCount--;
    
    // Process the next request in the queue
    processQueue();
  }
}

/**
 * Process a request with retry logic and improved error handling
 * @private
 * @param {Array} messages - Array of message objects { role, content }
 * @param {Object} options - Request options
 * @returns {Promise<string>} - AI response content
 */
async function processRequestWithRetries(messages, { timeoutMs = 30000, maxRetries = 1 } = {}) {
  let attempts = 0;
  let lastError = null;
  let currentProc = null; // Define proc at the function level to ensure it's accessible in catch blocks
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Track the request
  totalRequests++;
  const startTime = performance.now();
  
  while (attempts <= maxRetries) {
    attempts++;
    logger.debug(`[aiClient][${requestId}] Processing request, attempt ${attempts}/${maxRetries + 1}`);
    
    try {
      // Get a process from the pool
      try {
        currentProc = await getProcess();
      } catch (err) {
        logger.error(`[aiClient][${requestId}] Failed to acquire process: ${err.message}`);
        
        // If this is the last attempt, throw the error
        if (attempts > maxRetries) throw err;
        
        // Otherwise wait and retry
        logger.debug(`[aiClient][${requestId}] Retry attempt ${attempts}/${maxRetries} after error: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // Calculate timeout for this attempt - use dynamic timeout based on message size with improved scaling
      const messageSize = JSON.stringify(messages).length;
      // More generous timeout calculation based on message size
      const dynamicTimeout = Math.min(timeoutMs, Math.max(20000, messageSize / 50));
      const attemptTimeoutMs = attempts === 1 ? dynamicTimeout : Math.min(dynamicTimeout * 1.5, 30000); // Increased timeout for retries
      
      logger.debug(`[aiClient][${requestId}] Using timeout of ${attemptTimeoutMs}ms for attempt ${attempts}/${maxRetries + 1} (message size: ${messageSize} bytes)`);
      
      // Process the request
      const t0 = performance.now();
      const result = await processRequest(currentProc, messages, attemptTimeoutMs, t0, requestId);
      
      // Success - record metrics and return the result
      const processingTime = performance.now() - startTime;
      totalProcessingTime += processingTime;
      successfulRequests++;
      logger.debug(`[aiClient][${requestId}] Request completed successfully in ${processingTime.toFixed(2)}ms`);
      
      return result;
    } catch (err) {
      lastError = err;
      logger.error(`[aiClient][${requestId}] Error in attempt ${attempts}/${maxRetries + 1}: ${err.message}`);
      
      // If we have a process and it failed, don't reuse it
      if (currentProc) {
        try {
          logger.debug(`[aiClient][${requestId}] Killing failed process`);
          currentProc.kill('SIGKILL');
        } catch (killErr) {
          logger.error(`[aiClient][${requestId}] Error killing process: ${killErr.message}`);
        }
      }
      
      // If we've reached the max retries, try fallback or throw the error
      if (attempts > maxRetries) {
        // For timeout errors, try the fallback implementation as a last resort
        if (err.message && err.message.includes('timeout')) {
          logger.debug(`[aiClient][${requestId}] All attempts timed out, using fallback implementation`);
          try {
            // Use the original timeoutMs from the options, not the attempt-specific one
            return await fallbackSend(messages, { timeoutMs: timeoutMs }, requestId);
          } catch (fallbackErr) {
            logger.error(`[aiClient][${requestId}] Fallback also failed: ${fallbackErr.message}`);
            throw new Error(`AI service unavailable: ${fallbackErr.message}`);
          }
        }
        throw err;
      }
      
      // Wait before retrying (exponential backoff)
      const backoffMs = Math.min(1000 * Math.pow(2, attempts), 10000);
      logger.debug(`[aiClient][${requestId}] Waiting ${backoffMs}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  // This should never be reached due to the checks above, but just in case
  throw lastError || new Error('Unknown error in processRequestWithRetries');
}

/**
 * Process a request using a Python process from the pool
 * @private
 * @param {ChildProcess} proc - The Python process to use
 * @param {Array} messages - Array of message objects
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {number} t0 - Start time for performance measurement
 * @param {string} requestId - Request ID for tracking
 * @returns {Promise<string>} - AI response content
 */
async function processRequest(proc, messages, timeoutMs, t0, requestId) {
  return new Promise((resolve, reject) => {
    let result = '';
    let stderr = '';
    let isCompleted = false;
    let responseStarted = false;
    let lastActivityTime = Date.now();
    
    // Set up main timeout
    const timer = setTimeout(() => {
      if (isCompleted) return;
      
      isCompleted = true;
      const timeoutError = `AI client: timeout after ${timeoutMs}ms`;
      logger.error(`[aiClient][${requestId}] ${timeoutError}`);
      
      try {
        proc.kill('SIGKILL'); // Force kill to ensure it terminates
      } catch (e) {
        logger.error(`[aiClient][${requestId}] Error killing process on timeout: ${e.message}`);
      }
      
      reject(new Error(timeoutError));
    }, timeoutMs);
    
    // Set up activity watchdog to detect stalled processes
    const activityWatchdog = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityTime;
      if (responseStarted && inactiveTime > 10000 && !isCompleted) {
        // If we've started receiving a response but nothing for 10 seconds, consider it stalled
        logger.warn(`[aiClient][${requestId}] Process appears stalled - no activity for ${inactiveTime}ms`);
        
        if (inactiveTime > 20000) {
          // After 20 seconds of inactivity during response, force completion
          logger.error(`[aiClient][${requestId}] Forcing completion after ${inactiveTime}ms of inactivity`);
          isCompleted = true;
          clearInterval(activityWatchdog);
          clearTimeout(timer);
          
          if (result) {
            // If we have partial results, return them
            logger.debug(`[aiClient][${requestId}] Returning partial results due to stalled process`);
            cleanup();
            releaseProcess(proc);
            resolve(result + "\n\n[Note: This response was truncated due to a timeout.]");
          } else {
            // Otherwise treat as a timeout
            cleanup();
            reject(new Error(`AI client: process stalled after partial response`));
          }
        }
      }
    }, 5000);
    
    // Prepare the payload
    const payload = JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        content: sanitizeUnicode(m.content)
      })),
      requestId: requestId,
      action: 'predict' // Explicit action for Python process
    });
    
    logger.debug(`[aiClient] Sending payload of ${payload.length} bytes`);
    try {
      proc.stdin.write(payload + '\n');
    } catch (writeError) {
      logger.error(`[aiClient][${requestId}] Error writing to process stdin: ${writeError.message}`);
      isCompleted = true;
      cleanup();
      reject(new Error(`Failed to send request to AI process: ${writeError.message}`));
      return;
    }
    
    // Handle data from the process
    const dataHandler = (data) => {
      lastActivityTime = Date.now(); // Update activity timestamp
      const output = data.toString();
      
      try {
        // Check for JSON response
        if (output.includes('"response":') || output.includes('"error":') || output.includes('"memory_usage":')) {
          responseStarted = true;
          const lines = output.split('\n');
          
          for (const line of lines) {
            if (line.trim() && (line.includes('"response":') || line.includes('"content":') || line.includes('"error":') || line.includes('"memory_usage":'))) {
              try {
                const json = JSON.parse(line);
                
                // Update memory usage if provided
                if (json.memory_usage) {
                  const metadata = processMetadata.get(proc);
                  if (metadata) {
                    metadata.memoryUsage = json.memory_usage;
                  }
                }
                
                if (json.response) {
                  result = json.response;
                  isCompleted = true;
                  cleanup();
                  
                  const processingTime = performance.now() - t0;
                  logger.debug(`[aiClient] Request completed in ${processingTime.toFixed(1)}ms`);
                  
                  // Return the process to the pool
                  releaseProcess(proc);
                  
                  resolve(result);
                  return;
                } else if (json.content) {
                  result = json.content;
                  isCompleted = true;
                  cleanup();
                  
                  const processingTime = performance.now() - t0;
                  logger.debug(`[aiClient] Request completed in ${processingTime.toFixed(1)}ms`);
                  
                  // Return the process to the pool
                  releaseProcess(proc);
                  
                  resolve(result);
                  return;
                } else if (json.error) {
                  isCompleted = true;
                  cleanup();
                  
                  // Return the process to the pool
                  releaseProcess(proc);
                  
                  reject(new Error(json.error));
                  return;
                }
              } catch (parseErr) {
                // Ignore parsing errors for incomplete JSON
              }
            }
          }
        }
      } catch (err) {
        // Ignore parsing errors for incomplete data
        logger.warn(`[aiClient] Error processing stdout: ${err.message}`);
      }
    };
    
    const errorHandler = (data) => {
      lastActivityTime = Date.now(); // Update activity timestamp
      stderr += data.toString();
      logger.error(`[aiClient] Error from Python process: ${data.toString().trim()}`);
    };
    
    // Handle process exit during request
    const exitHandler = (code) => {
      if (!isCompleted) {
        cleanup();
        reject(new Error(stderr || `AI client: process exited with code ${code} during request`));
      }
    };
    
    // Handle process error event
    const processErrorHandler = (err) => {
      if (!isCompleted) {
        logger.error(`[aiClient][${requestId}] Process error: ${err.message}`);
        isCompleted = true;
        cleanup();
        reject(new Error(`AI client: process error: ${err.message}`));
      }
    };
    
    // Clean up all listeners
    const cleanup = () => {
      clearTimeout(timer);
      clearInterval(activityWatchdog);
      proc.stdout.removeListener('data', dataHandler);
      proc.stderr.removeListener('data', errorHandler);
      proc.removeListener('exit', exitHandler);
      proc.removeListener('error', processErrorHandler);
    };
    
    // Add listeners
    proc.stdout.on('data', dataHandler);
    proc.stderr.on('data', errorHandler);
    proc.on('exit', exitHandler);
    proc.on('error', processErrorHandler);
  });
}

/**
 * Create a new Python process
 * @private
 * @returns {Promise<ChildProcess>} - A new Python process
 */
async function createPythonProcess() {
  return new Promise((resolve, reject) => {
    logger.debug('[aiClient] Creating new Python process');
    const scriptPath = path.join(__dirname, '../../volcanicEngine/glm_api.py');
    const proc = spawn('python', [scriptPath, '--server-mode']);
    
    let initialized = false;
    let stderr = '';
    let stdout = '';
    const timeoutMs = 8000; // 8 second timeout
    
    // Set up timeout
    const timer = setTimeout(() => {
      if (!initialized) {
        logger.error('[aiClient] Python process initialization timed out');
        try {
          proc.kill('SIGKILL');
        } catch (e) {
          logger.error(`[aiClient] Error killing process on timeout: ${e.message}`);
        }
        reject(new Error(`Python process initialization timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
    
    // Handle process startup
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (output.includes('READY') && !initialized) {
        initialized = true;
        logger.debug('[aiClient] Python process initialized successfully');
        clearTimeout(timer);
        resolve(proc);
      }
    });
    
    // Handle stderr - only log, don't reject on warnings
    proc.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      stderr += errorOutput;
      // Log stderr output but don't treat warnings as errors during initialization
      logger.debug(`[aiClient] Python stderr: ${errorOutput.trim()}`);
    });
    
    // Handle process exit
    proc.on('exit', (code) => {
      if (!initialized) {
        clearTimeout(timer);
        reject(new Error(`Python process exited with code ${code} during initialization`));
      }
    });
    
    // Handle process error
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

/**
 * Fallback implementation that creates a new process for each request
 * @private
 * @param {Array} messages - Array of message objects { role, content }.
 * @param {Object} options - Optional settings.
 * @param {string} requestId - Optional request ID for tracking.
 * @returns {Promise<string>} - AI response content.
 */
async function fallbackSend(messages, { timeoutMs = 60000 } = {}, requestId = `fallback-${Date.now()}`) {
  logger.debug(`[aiClient][${requestId}] Using fallback implementation with timeout ${timeoutMs}ms`);
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../volcanicEngine/glm_api.py');
    const args = [scriptPath, JSON.stringify(messages)];
    const proc = spawn('python', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      logger.error(`AI client error: ${data.toString()}`);
    });

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`AI client: timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.error) return reject(new Error(parsed.error));
          return resolve(parsed.response || parsed.message);
        } catch (err) {
          return reject(new Error(`AI client: failed to parse response: ${err.message}`));
        }
      }
      return reject(new Error(stderr || `AI client: exited with code ${code}`));
    });

    proc.on('error', (err) => {
      reject(new Error(`AI client: failed to start process: ${err.message}`));
    });
  });
}

/**
 * Sends messages to the AI model via Python script and returns the response.
 * Uses a process pool to reduce startup overhead with improved error handling and retry logic.
 * Implements request queuing and circuit breaker for high concurrency scenarios.
 * @param {Array} messages - Array of message objects { role, content }.
 * @param {Object} [options] - Optional settings.
 * @param {number} [options.timeoutMs=30000] - Timeout in milliseconds (reduced from 90000).
 * @param {number} [options.maxRetries=1] - Maximum number of retries on timeout.
 * @param {boolean} [options.priority=false] - Whether this request should be prioritized in the queue.
 * @param {boolean} [options.bypassCircuitBreaker=false] - Whether to bypass the circuit breaker.
 * @returns {Promise<string>} - AI response content.
 */
async function send(messages, { timeoutMs = 30000, maxRetries = 1, priority = false, bypassCircuitBreaker = false } = {}) {
  // Check circuit breaker first
  if (circuitBreaker.isOpen() && !bypassCircuitBreaker) {
    logger.debug('[aiClient] Circuit breaker is open, fast-failing request');
    return Promise.reject(new Error('AI service is temporarily unavailable due to multiple failures. Please try again later.'));
  }
  
  // Sanitize and simplify messages to reduce payload size if they're too large
  const simplifiedMessages = messages.map(msg => {
    if (!msg.content) return msg;
    
    // Sanitize the content to remove invalid Unicode characters
    let sanitizedContent = sanitizeUnicode(msg.content);
    
    // If content is very large, truncate it
    if (sanitizedContent.length > 4000) {
      logger.debug(`[aiClient] Truncating large message from ${sanitizedContent.length} to 4000 chars`);
      sanitizedContent = sanitizedContent.substring(0, 4000) + '... [truncated]';
    }
    
    return {
      role: msg.role,
      content: sanitizedContent
    };
  });
  
  // If we're under high load, queue the request
  if (processingCount >= MAX_CONCURRENT_REQUESTS || requestQueue.length > 0) {
    logger.debug(`[aiClient] System under load (${processingCount}/${MAX_CONCURRENT_REQUESTS} active, ${requestQueue.length} queued)`);
    
    // If queue is getting too long, start rejecting non-priority requests
    if (requestQueue.length > 10 && !priority) {
      logger.debug('[aiClient] Queue too long, rejecting non-priority request');
      return Promise.reject(new Error('AI service is currently under high load. Please try again later.'));
    }
    
    // If this is a priority request, add it to the front of the queue
    const options = { timeoutMs, maxRetries, bypassCircuitBreaker };
    if (priority) {
      logger.debug('[aiClient] Priority request added to front of queue');
      return new Promise((resolve, reject) => {
        requestQueue.unshift({
          messages: simplifiedMessages,
          options,
          resolve,
          reject,
          timestamp: Date.now()
        });
        processQueue();
      });
    } else {
      return queueRequest(simplifiedMessages, options);
    }
  }
  
  // If we're not under load, process the request immediately
  processingCount++;
  try {
    const result = await processRequestWithRetries(simplifiedMessages, { timeoutMs, maxRetries });
    // Record success in circuit breaker
    circuitBreaker.recordSuccess();
    return result;
  } catch (err) {
    // Record failure in circuit breaker
    circuitBreaker.recordFailure();
    throw err;
  } finally {
    processingCount--;
    
    // Process any queued requests
    if (requestQueue.length > 0) {
      processQueue();
    }
  }
}

/**
 * Get health metrics from Python service
 * @returns {Promise<Object>} Health metrics
 */
async function getHealthMetrics() {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', [
      path.join(__dirname, '../../volcanicEngine/glm_api.py'),
      '--server-mode'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Health check timeout'));
    }, 5000);
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('READY')) {
        // Send health request
        proc.stdin.write(JSON.stringify({ action: 'health' }) + '\n');
        proc.stdin.end();
      } else if (output.startsWith('{') && output.includes('status')) {
        clearTimeout(timeout);
        try {
          const metrics = JSON.parse(output.trim());
          resolve(metrics);
        } catch (e) {
          reject(e);
        }
        proc.kill('SIGTERM');
      }
    });
    
    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    
    proc.on('exit', (code) => {
      if (code !== 0 && !output) {
        clearTimeout(timeout);
        reject(new Error(`Health check failed: ${errorOutput}`));
      }
    });
  });
}

module.exports = { send };
