const { spawn } = require('child_process');
const path = require('path');
const { performance } = require('perf_hooks');

// Process pool for Python processes
const processPool = [];
const MAX_POOL_SIZE = 3; // Reduced to prevent resource exhaustion
let isInitialized = false;
let requestQueue = [];
let processingCount = 0;
const MAX_CONCURRENT_REQUESTS = 5; // Reduced to prevent overwhelming the system

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
      console.log(`[aiClient] Circuit breaker opened after ${this.failureCount} failures`);
      this.state = 'OPEN';
    }
  },
  
  // Record a success and potentially close the circuit
  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      console.log('[aiClient] Circuit breaker closed after successful request');
      this.state = 'CLOSED';
      this.failureCount = 0;
    }
  },
  
  // Check if the circuit is open
  isOpen() {
    if (this.state === 'OPEN') {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        console.log('[aiClient] Circuit breaker transitioning to HALF_OPEN state');
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
function initializePool() {
  if (isInitialized) return;
  console.log('[aiClient] Initializing Python process pool');
  isInitialized = true;
  
  // Clean up the pool on process exit
  process.on('exit', () => {
    console.log('[aiClient] Cleaning up Python process pool');
    processPool.forEach(proc => {
      try {
        proc.kill();
      } catch (err) {
        // Ignore errors during cleanup
      }
    });
  });
}

/**
 * Get a Python process from the pool or create a new one
 * @private
 * @returns {Promise<ChildProcess>} A Python process
 */
async function getProcess() {
  if (!isInitialized) {
    initializePool();
  }
  
  // Get a process from the pool if available
  if (processPool.length > 0) {
    const proc = processPool.pop();
    console.log(`[aiClient] Reusing Python process from pool (${processPool.length} remaining)`);
    return proc;
  }
  
  // Create a new process
  console.log('[aiClient] Creating new Python process');
  const scriptPath = path.join(__dirname, '../../volcanicEngine/glm_api.py');
  const proc = spawn('python', [scriptPath, '--server-mode']);
  
  // Set up error handling
  proc.on('error', (err) => {
    console.error(`[aiClient] Process error: ${err.message}`);
  });
  
  // Wait for the process to initialize
  return new Promise((resolve, reject) => {
    let initialized = false;
    
    proc.stdout.once('data', (data) => {
      const output = data.toString();
      if (output.includes('READY')) {
        initialized = true;
        resolve(proc);
      }
    });
    
    proc.stderr.once('data', (data) => {
      if (!initialized) {
        reject(new Error(`Failed to initialize Python process: ${data.toString()}`));
      }
    });
    
    // Set a timeout for initialization
    setTimeout(() => {
      if (!initialized) {
        reject(new Error('Timeout waiting for Python process to initialize'));
      }
    }, 5000);
  });
}

/**
 * Release a process back to the pool or destroy it
 * @private
 * @param {ChildProcess} proc - The process to release
 */
function releaseProcess(proc) {
  if (processPool.length < MAX_POOL_SIZE) {
    console.log(`[aiClient] Returning process to pool (${processPool.length + 1} total)`);
    processPool.push(proc);
  } else {
    console.log('[aiClient] Pool full, destroying process');
    proc.kill();
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
    console.log(`[aiClient] Request queued. Queue length: ${requestQueue.length}`);
    
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
  console.log(`[aiClient] Processing request. Queue length: ${requestQueue.length}, Active: ${processingCount}/${MAX_CONCURRENT_REQUESTS}`);
  
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
  const t0 = performance.now();
  let proc = null;
  let retryCount = 0;
  let lastError = null;
  
  // Use a shorter timeout for the first attempt to fail fast if the system is overloaded
  let currentTimeoutMs = Math.min(timeoutMs, 15000); // Start with a shorter timeout
  
  // Implement retry logic
  while (retryCount <= maxRetries) {
    try {
      // If this is a retry, log it
      if (retryCount > 0) {
        console.log(`[aiClient] Retry attempt ${retryCount}/${maxRetries} after error: ${lastError?.message}`);
        // Use full timeout for retries
        currentTimeoutMs = timeoutMs;
      }
      
      // Get a process from the pool or create a new one if needed
      try {
        proc = await Promise.race([
          getProcess(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Process acquisition timeout')), 5000))
        ]);
      } catch (procError) {
        console.error(`[aiClient] Failed to acquire process: ${procError.message}`);
        // If we can't get a process, try fallback immediately
        if (retryCount >= maxRetries) {
          console.log('[aiClient] All process acquisition attempts failed, using fallback');
          return fallbackSend(messages, { timeoutMs: currentTimeoutMs });
        }
        
        // Increment retry count and continue
        retryCount++;
        continue;
      }
      
      // Process the request with timeout
      console.log(`[aiClient] Using timeout of ${currentTimeoutMs}ms for attempt ${retryCount + 1}/${maxRetries + 1}`);
      
      // Process the request
      const result = await processRequest(proc, messages, currentTimeoutMs, t0);
      
      // Return the result
      return result;
    } catch (err) {
      lastError = err;
      console.error(`[aiClient] Error in attempt ${retryCount + 1}/${maxRetries + 1}: ${err.message}`);
      
      // If we have a process and it failed, don't reuse it
      if (proc) {
        try {
          console.log('[aiClient] Killing failed process');
          proc.kill('SIGKILL');
        } catch (killErr) {
          console.error(`[aiClient] Error killing process: ${killErr.message}`);
        }
      }
      
      // If we've reached the max retries, try fallback or throw the error
      if (retryCount >= maxRetries) {
        // For timeout errors, try the fallback implementation as a last resort
        if (err.message && err.message.includes('timeout')) {
          console.log('[aiClient] All attempts timed out, using fallback implementation');
          try {
            return await fallbackSend(messages, { timeoutMs: currentTimeoutMs });
          } catch (fallbackErr) {
            console.error(`[aiClient] Fallback also failed: ${fallbackErr.message}`);
            throw new Error(`AI service unavailable: ${fallbackErr.message}`);
          }
        }
        throw err;
      }
      
      // Increment retry count
      retryCount++;
      
      // Wait before retrying (exponential backoff)
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`[aiClient] Waiting ${backoffMs}ms before retrying...`);
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
 * @returns {Promise<string>} - AI response content
 */
async function processRequest(proc, messages, timeoutMs, t0) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let isCompleted = false;
    
    // Send the request to the Python process
    const request = JSON.stringify({ messages });
    proc.stdin.write(request + '\n');
    
    // Set up data handlers for this request
    const dataHandler = (data) => {
      stdout += data.toString();
      
      // Check if we have a complete response
      try {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.trim() && line.includes('"response":')) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                // Mark as completed to prevent multiple resolutions
                if (isCompleted) return;
                isCompleted = true;
                
                // Clean up listeners
                cleanup();
                
                // Release the process back to the pool
                releaseProcess(proc);
                
                console.log(`[aiClient] Request completed in ${(performance.now() - t0).toFixed(1)}ms`);
                return resolve(parsed.response);
              }
            } catch (parseErr) {
              console.warn(`[aiClient] Error parsing response line: ${parseErr.message}`);
              // Continue trying other lines
            }
          }
        }
      } catch (err) {
        // Ignore parsing errors for incomplete data
        console.warn(`[aiClient] Error processing stdout: ${err.message}`);
      }
    };
    
    const errorHandler = (data) => {
      stderr += data.toString();
      console.error(`[aiClient] Error from Python process: ${data.toString().trim()}`);
    };
    
    // Handle process exit during request
    const exitHandler = (code) => {
      if (isCompleted) return;
      
      cleanup();
      reject(new Error(stderr || `AI client: process exited with code ${code} during request`));
    };
    
    // Clean up all listeners
    const cleanup = () => {
      clearTimeout(timer);
      proc.stdout.removeListener('data', dataHandler);
      proc.stderr.removeListener('data', errorHandler);
      proc.removeListener('exit', exitHandler);
    };
    
    // Add listeners
    proc.stdout.on('data', dataHandler);
    proc.stderr.on('data', errorHandler);
    proc.once('exit', exitHandler);
    
    // Set a timeout with detailed error
    const timer = setTimeout(() => {
      if (isCompleted) return;
      
      // Generate a more detailed timeout error message
      let timeoutError = `AI client: timeout after ${timeoutMs}ms`;
      if (stderr) {
        timeoutError += `\nPython stderr: ${stderr}`;
      }
      if (stdout) {
        // Include a truncated version of stdout to help with debugging
        const truncatedStdout = stdout.length > 500 ? stdout.substring(0, 500) + '...' : stdout;
        timeoutError += `\nPartial stdout: ${truncatedStdout}`;
      }
      
      cleanup();
      
      // Kill the process on timeout (don't return to pool)
      try {
        proc.kill('SIGKILL'); // Force kill to ensure it terminates
      } catch (e) {
        console.error(`[aiClient] Error killing process on timeout: ${e.message}`);
      }
      
      reject(new Error(timeoutError));
    }, timeoutMs);
  });
}

/**
 * Fallback implementation that creates a new process for each request
 * @private
 * @param {Array} messages - Array of message objects { role, content }.
 * @param {Object} options - Optional settings.
 * @returns {Promise<string>} - AI response content.
 */
async function fallbackSend(messages, { timeoutMs = 60000 } = {}) {
  console.log('[aiClient] Using fallback implementation');
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
      console.error(`AI client error: ${data.toString()}`);
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
    console.log('[aiClient] Circuit breaker is open, fast-failing request');
    return Promise.reject(new Error('AI service is temporarily unavailable due to multiple failures. Please try again later.'));
  }
  
  // Simplify messages to reduce payload size if they're too large
  const simplifiedMessages = messages.map(msg => {
    // If content is very large, truncate it
    if (msg.content && msg.content.length > 4000) {
      console.log(`[aiClient] Truncating large message from ${msg.content.length} to 4000 chars`);
      return {
        role: msg.role,
        content: msg.content.substring(0, 4000) + '... [truncated]'
      };
    }
    return msg;
  });
  
  // If we're under high load, queue the request
  if (processingCount >= MAX_CONCURRENT_REQUESTS || requestQueue.length > 0) {
    console.log(`[aiClient] System under load (${processingCount}/${MAX_CONCURRENT_REQUESTS} active, ${requestQueue.length} queued)`);
    
    // If queue is getting too long, start rejecting non-priority requests
    if (requestQueue.length > 10 && !priority) {
      console.log('[aiClient] Queue too long, rejecting non-priority request');
      return Promise.reject(new Error('AI service is currently under high load. Please try again later.'));
    }
    
    // If this is a priority request, add it to the front of the queue
    const options = { timeoutMs, maxRetries, bypassCircuitBreaker };
    if (priority) {
      console.log('[aiClient] Priority request added to front of queue');
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

module.exports = { send };
