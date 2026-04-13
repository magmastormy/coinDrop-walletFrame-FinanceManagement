const logger = require('./logger');

/**
 * Utilities for file operations
 */
const fs = require('fs').promises;
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '../reports');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure directories exist
const ensureDirectories = async () => {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
};

// Save buffer to file
const saveBufferToFile = async (buffer, filename) => {
  await ensureDirectories();
  const filePath = path.join(REPORTS_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

// Read file to buffer
const readFileToBuffer = async (filePath) => {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    logger.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

module.exports = {
  REPORTS_DIR,
  UPLOADS_DIR,
  ensureDirectories,
  saveBufferToFile,
  readFileToBuffer
}; 