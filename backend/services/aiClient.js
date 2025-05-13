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
 * Uses a process pool to reduce startup overhead.
 * @param {Array} messages - Array of message objects { role, content }.
 * @param {Object} [options] - Optional settings.
 * @param {number} [options.timeoutMs=30000] - Timeout in milliseconds.
 * @returns {Promise<string>} - AI response content.
 */
async function send(messages, { timeoutMs = 60000 } = {}) {
  const t0 = performance.now();
  let proc = null;
  
  try {
    // Get a process from the pool
    proc = await getProcess();
    
    return await new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
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
              const parsed = JSON.parse(line);
              if (parsed.response) {
                // Clean up listeners
                proc.stdout.removeListener('data', dataHandler);
                proc.stderr.removeListener('data', errorHandler);
                clearTimeout(timer);
                
                // Release the process back to the pool
                releaseProcess(proc);
                
                console.log(`[aiClient] Request completed in ${(performance.now() - t0).toFixed(1)}ms`);
                return resolve(parsed.response);
              }
            }
          }
        } catch (err) {
          // Ignore parsing errors for incomplete data
        }
      };
      
      const errorHandler = (data) => {
        stderr += data.toString();
        console.error(`[aiClient] Error: ${data.toString()}`);
      };
      
      proc.stdout.on('data', dataHandler);
      proc.stderr.on('data', errorHandler);
      
      // Set a timeout
      const timer = setTimeout(() => {
        proc.stdout.removeListener('data', dataHandler);
        proc.stderr.removeListener('data', errorHandler);
        
        // Kill the process on timeout (don't return to pool)
        proc.kill();
        reject(new Error(`AI client: timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      // Handle process exit
      proc.once('exit', (code) => {
        if (code !== 0) {
          clearTimeout(timer);
          proc.stdout.removeListener('data', dataHandler);
          proc.stderr.removeListener('data', errorHandler);
          reject(new Error(stderr || `AI client: process exited with code ${code}`));
        }
      });
    });
  } catch (err) {
    // If we failed to get or use a process, fall back to the original implementation
    console.error(`[aiClient] Process pool error: ${err.message}. Falling back to one-time process.`);
    
    // Clean up the process if we got one but failed to use it
    if (proc) {
      try { proc.kill(); } catch (e) { /* ignore */ }
    }
    
    // Fall back to the original implementation
    return fallbackSend(messages, { timeoutMs });
  }
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
