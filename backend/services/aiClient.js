const { spawn } = require('child_process');
const path = require('path');
const { performance } = require('perf_hooks');

// Process pool for Python processes
const processPool = [];
const MAX_POOL_SIZE = 2; // Adjust based on server capacity
let isInitialized = false;

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
 * Sends messages to the AI model via Python script and returns the response.
 * Uses a process pool to reduce startup overhead with improved error handling and retry logic.
 * @param {Array} messages - Array of message objects { role, content }.
 * @param {Object} [options] - Optional settings.
 * @param {number} [options.timeoutMs=90000] - Timeout in milliseconds.
 * @param {number} [options.maxRetries=1] - Maximum number of retries on timeout.
 * @returns {Promise<string>} - AI response content.
 */
async function send(messages, { timeoutMs = 90000, maxRetries = 1 } = {}) {
  const t0 = performance.now();
  let proc = null;
  let retryCount = 0;
  let lastError = null;
  
  // Implement retry logic
  while (retryCount <= maxRetries) {
    try {
      // If this is a retry, log it
      if (retryCount > 0) {
        console.log(`[aiClient] Retry attempt ${retryCount}/${maxRetries} after error: ${lastError?.message}`);
      }
      
      // Get a process from the pool
      proc = await getProcess();
      
      // Calculate timeout for this attempt (progressive backoff)
      const attemptTimeout = Math.min(timeoutMs, timeoutMs * (1 + (retryCount * 0.5)));
      console.log(`[aiClient] Using timeout of ${attemptTimeout}ms for attempt ${retryCount + 1}/${maxRetries + 1}`);
      
      // Process the request
      const result = await processRequest(proc, messages, attemptTimeout, t0);
      
      // If we get here, the request was successful
      return result;
    } catch (err) {
      lastError = err;
      
      // Clean up the process if we got one but failed to use it
      if (proc) {
        try { 
          // Don't return timed-out processes to the pool
          if (err.message && err.message.includes('timeout')) {
            console.log(`[aiClient] Killing timed-out process instead of returning to pool`);
            proc.kill(); 
          } else {
            // For other errors, we might still be able to reuse the process
            console.log(`[aiClient] Returning process to pool despite error`);
            releaseProcess(proc);
          }
        } catch (e) { 
          console.error(`[aiClient] Error cleaning up process: ${e.message}`);
        }
      }
      
      // If we've exhausted retries or this isn't a timeout error, don't retry
      if (retryCount >= maxRetries || !(err.message && err.message.includes('timeout'))) {
        break;
      }
      
      // Increment retry counter
      retryCount++;
    }
  }
  
  // If we get here, all retries failed or we had a non-timeout error
  console.error(`[aiClient] All attempts failed or non-retryable error. Falling back to one-time process.`);
  console.error(`[aiClient] Last error: ${lastError?.message}`);
  
  // Fall back to the original implementation
  return fallbackSend(messages, { timeoutMs });
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

module.exports = { send };
