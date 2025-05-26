/**
 * File system utilities with optimized operations
 * Provides better performing file operations with caching and streaming
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Read JSON file with error handling
 * @param {string} filePath - Path to JSON file
 * @param {*} defaultValue - Default value if file doesn't exist or is invalid
 * @returns {Promise<Object>} - Parsed JSON data
 */
async function readJsonFile(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Warning: Could not read JSON file ${filePath}: ${error.message}`);
    return defaultValue;
  }
}

/**
 * Write JSON file with directory creation
 * @param {string} filePath - Path to save JSON file
 * @param {Object} data - Data to save
 * @param {boolean} pretty - Whether to pretty-print the JSON
 * @returns {Promise<boolean>} - Success status
 */
async function writeJsonFile(filePath, data, pretty = true) {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Write the file
    const jsonData = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await fs.promises.writeFile(filePath, jsonData);
    return true;
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Count lines in a file using streaming for better performance
 * @param {string} filePath - Path to the file
 * @returns {Promise<number>} - Number of lines
 */
async function countFileLines(filePath) {
  return new Promise((resolve) => {
    let lineCount = 0;
    
    try {
      if (!fs.existsSync(filePath)) {
        resolve(0);
        return;
      }
      
      const readStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity
      });
      
      rl.on('line', () => lineCount++);
      rl.on('close', () => resolve(lineCount));
      rl.on('error', () => resolve(0));
    } catch (error) {
      console.warn(`Warning: Could not count lines in ${filePath}: ${error.message}`);
      resolve(0);
    }
  });
}

/**
 * Batch process files for operations like counting lines
 * @param {Array<string>} filePaths - Array of file paths
 * @param {Function} operation - Function to apply to each file
 * @param {number} batchSize - Number of files to process concurrently
 * @returns {Promise<Array>} - Results array
 */
async function batchProcessFiles(filePaths, operation, batchSize = 20) {
  const results = [];
  
  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Ensure directories exist
 * @param {string|Array<string>} directories - Directory or array of directories
 * @returns {Promise<void>}
 */
async function ensureDirectories(directories) {
  const dirs = Array.isArray(directories) ? directories : [directories];
  
  await Promise.all(dirs.map(async (dir) => {
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }));
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  countFileLines,
  batchProcessFiles,
  ensureDirectories
}; 