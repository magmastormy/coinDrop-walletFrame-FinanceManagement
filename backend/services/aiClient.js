const { spawn } = require('child_process');
const path = require('path');

/**
 * Sends messages to the AI model via Python script and returns the response.
 * @param {Array} messages - Array of message objects { role, content }.
 * @param {Object} [options] - Optional settings.
 * @param {number} [options.timeoutMs=30000] - Timeout in milliseconds.
 * @returns {Promise<string>} - AI response content.
 */
async function send(messages, { timeoutMs = 30000 } = {}) {
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
