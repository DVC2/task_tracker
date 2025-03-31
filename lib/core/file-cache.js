#!/usr/bin/env node

/**
 * TaskTracker - File Cache Utility
 * 
 * Provides optimized file access with caching to avoid repeated reads/writes.
 * Implements smart invalidation and transaction-like writes.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cache storage
const fileCache = new Map();
const CACHE_TTL = 30000; // 30 seconds default cache lifetime

/**
 * Read a JSON file with caching
 * 
 * @param {string} filePath - Path to the file
 * @param {Object} options - Options for reading
 * @returns {Object} Parsed JSON data
 */
function readJsonFile(filePath, options = {}) {
  const { ttl = CACHE_TTL, force = false } = options;
  
  // Normalize path for consistent cache keys
  const normalizedPath = path.normalize(filePath);
  
  // Check if we have a valid cached version
  const now = Date.now();
  if (!force && fileCache.has(normalizedPath)) {
    const cachedData = fileCache.get(normalizedPath);
    
    // If the cache is still valid, return it
    if (now - cachedData.timestamp < ttl) {
      return cachedData.data;
    }
  }
  
  // Cache miss or forced refresh, read from disk
  try {
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`File not found: ${normalizedPath}`);
    }
    
    // Read and parse the file
    const content = fs.readFileSync(normalizedPath, 'utf8');
    const data = JSON.parse(content);
    
    // Calculate hash for change detection
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    
    // Update cache
    fileCache.set(normalizedPath, {
      data,
      content,
      contentHash,
      timestamp: now
    });
    
    return data;
  } catch (error) {
    throw new Error(`Error reading file ${normalizedPath}: ${error.message}`);
  }
}

/**
 * Write data to a JSON file with optimizations
 * 
 * @param {string} filePath - Path to the file
 * @param {Object} data - Data to write
 * @param {Object} options - Write options
 * @returns {boolean} Success status
 */
function writeJsonFile(filePath, data, options = {}) {
  const { prettyPrint = true, onlyIfChanged = true, atomic = true } = options;
  
  // Normalize path
  const normalizedPath = path.normalize(filePath);
  
  try {
    // Convert data to JSON
    const indent = prettyPrint ? 2 : 0;
    const jsonContent = JSON.stringify(data, null, indent);
    
    // Check if content actually changed (avoid disk writes if unchanged)
    if (onlyIfChanged && fileCache.has(normalizedPath)) {
      const cachedData = fileCache.get(normalizedPath);
      const newContentHash = crypto.createHash('md5').update(jsonContent).digest('hex');
      
      if (cachedData.contentHash === newContentHash) {
        // Content hasn't changed, skip writing
        return true;
      }
    }
    
    // Ensure directory exists
    const dirPath = path.dirname(normalizedPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write with atomic option if requested
    if (atomic) {
      // First write to a temp file
      const tempFile = `${normalizedPath}.tmp`;
      fs.writeFileSync(tempFile, jsonContent, 'utf8');
      
      // Then rename (atomic operation on most file systems)
      fs.renameSync(tempFile, normalizedPath);
    } else {
      // Direct write
      fs.writeFileSync(normalizedPath, jsonContent, 'utf8');
    }
    
    // Update cache
    fileCache.set(normalizedPath, {
      data,
      content: jsonContent,
      contentHash: crypto.createHash('md5').update(jsonContent).digest('hex'),
      timestamp: Date.now()
    });
    
    return true;
  } catch (error) {
    throw new Error(`Error writing file ${normalizedPath}: ${error.message}`);
  }
}

/**
 * Clear file cache entries
 * 
 * @param {string} [filePath] - Specific file path to clear, or all if not specified
 */
function clearCache(filePath) {
  if (filePath) {
    // Clear specific file
    const normalizedPath = path.normalize(filePath);
    fileCache.delete(normalizedPath);
  } else {
    // Clear entire cache
    fileCache.clear();
  }
}

/**
 * Batch process multiple file operations
 * 
 * @param {Array} operations - Array of operation objects
 * @returns {boolean} Success status
 */
function batchProcess(operations) {
  // Save original state for rollback
  const originalState = new Map();
  
  try {
    // Execute all read operations first
    for (const op of operations) {
      if (op.type === 'read') {
        op.result = readJsonFile(op.path, op.options);
      }
    }
    
    // Execute update operations (in memory)
    for (const op of operations) {
      if (op.type === 'update' && typeof op.updateFn === 'function') {
        // Get the data first
        const data = readJsonFile(op.path, op.options);
        
        // Save original state for potential rollback
        originalState.set(op.path, JSON.parse(JSON.stringify(data)));
        
        // Apply the update function
        op.result = op.updateFn(data);
      }
    }
    
    // Execute all write operations
    for (const op of operations) {
      if (op.type === 'write' || op.type === 'update') {
        const dataToWrite = op.type === 'update' ? readJsonFile(op.path, op.options) : op.data;
        writeJsonFile(op.path, dataToWrite, op.options);
      }
    }
    
    return true;
  } catch (error) {
    // Rollback changes if transaction-like behavior is needed
    if (originalState.size > 0) {
      console.warn('⚠️ Error in batch processing, rolling back changes');
      
      // Restore original state
      for (const [filePath, data] of originalState.entries()) {
        try {
          writeJsonFile(filePath, data, { atomic: true });
        } catch (rollbackError) {
          console.error(`❌ Rollback failed for ${filePath}: ${rollbackError.message}`);
        }
      }
    }
    
    throw error;
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  clearCache,
  batchProcess
}; 