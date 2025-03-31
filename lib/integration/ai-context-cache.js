#!/usr/bin/env node

/**
 * TaskTracker - AI Context Caching
 * 
 * Implements a simple caching system for AI context to reduce API calls.
 * Caches context based on file content hashes and invalidates when files change.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Constants
const DATA_DIR = path.join(process.cwd(), '.tasktracker');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const FILE_HASHES_PATH = path.join(DATA_DIR, 'file-hashes.json');

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Generate a cache key for a file
 * 
 * @param {string} filePath - Path to the file
 * @param {Object} options - Additional options that affect the context
 * @returns {string} Cache key
 */
function generateCacheKey(filePath, options = {}) {
  try {
    // Get file stat info
    const stats = fs.statSync(filePath);
    
    // Calculate content hash
    const content = fs.readFileSync(filePath, 'utf8');
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    
    // Create base key from file path and content hash
    const baseKey = `${filePath}:${contentHash}`;
    
    // Add options to key if they exist
    let optionsStr = '';
    if (options && Object.keys(options).length > 0) {
      optionsStr = JSON.stringify(options);
    }
    
    // Generate final key
    const finalKey = crypto.createHash('md5')
      .update(`${baseKey}:${optionsStr}`)
      .digest('hex');
    
    return finalKey;
  } catch (error) {
    console.warn(`⚠️ Error generating cache key for ${filePath}: ${error.message}`);
    // If we can't generate a cache key, return a fallback based on file path
    return crypto.createHash('md5').update(filePath).digest('hex');
  }
}

/**
 * Check if a cached context is valid
 * 
 * @param {string} cacheKey - The cache key
 * @returns {boolean} True if cache is valid
 */
function isCacheValid(cacheKey) {
  try {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    
    // Check if cache file exists
    if (!fs.existsSync(cachePath)) {
      return false;
    }
    
    // Check cache metadata
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    
    // Check expiration
    if (cacheData.expires && new Date(cacheData.expires) < new Date()) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn(`⚠️ Error checking cache validity: ${error.message}`);
    return false;
  }
}

/**
 * Get context from cache
 * 
 * @param {string} cacheKey - The cache key
 * @returns {any} The cached context or null if not found/invalid
 */
function getFromCache(cacheKey) {
  try {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    
    // Validate cache first
    if (!isCacheValid(cacheKey)) {
      return null;
    }
    
    // Read and parse cache file
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    
    // Return the context data
    return cacheData.context;
  } catch (error) {
    console.warn(`⚠️ Error reading from cache: ${error.message}`);
    return null;
  }
}

/**
 * Save context to cache
 * 
 * @param {string} cacheKey - The cache key
 * @param {any} context - The context data to cache
 * @param {Object} options - Cache options
 * @returns {boolean} True if successful
 */
function saveToCache(cacheKey, context, options = {}) {
  try {
    ensureCacheDir();
    
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    
    // Calculate expiration (default to 24 hours)
    const ttlMs = options.ttl ? options.ttl * 1000 : 24 * 60 * 60 * 1000;
    const expires = new Date(Date.now() + ttlMs).toISOString();
    
    // Create cache data structure
    const cacheData = {
      key: cacheKey,
      created: new Date().toISOString(),
      expires: expires,
      options: options,
      context: context
    };
    
    // Write to cache file
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    
    return true;
  } catch (error) {
    console.warn(`⚠️ Error saving to cache: ${error.message}`);
    return false;
  }
}

/**
 * Clear expired cache entries
 * 
 * @returns {number} Number of entries cleared
 */
function clearExpiredCache() {
  try {
    ensureCacheDir();
    
    let clearedCount = 0;
    
    // List all files in cache directory
    const cacheFiles = fs.readdirSync(CACHE_DIR)
      .filter(file => file.endsWith('.json'));
    
    // Check each file
    cacheFiles.forEach(file => {
      try {
        const cachePath = path.join(CACHE_DIR, file);
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        
        // Check if expired
        if (cacheData.expires && new Date(cacheData.expires) < new Date()) {
          // Delete expired cache
          fs.unlinkSync(cachePath);
          clearedCount++;
        }
      } catch (error) {
        // Silently skip problematic files
      }
    });
    
    return clearedCount;
  } catch (error) {
    console.warn(`⚠️ Error clearing expired cache: ${error.message}`);
    return 0;
  }
}

/**
 * Get cached AI context for a file
 * 
 * @param {string} filePath - Path to the file
 * @param {function} generateFunc - Function to generate context if cache miss
 * @param {Object} options - Options for context generation and caching
 * @returns {Promise<any>} The context (from cache or freshly generated)
 */
async function getCachedContext(filePath, generateFunc, options = {}) {
  try {
    // Occasionally clear expired cache entries (5% chance)
    if (Math.random() < 0.05) {
      clearExpiredCache();
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(filePath, options);
    
    // Check cache first
    const cachedContext = getFromCache(cacheKey);
    if (cachedContext !== null) {
      console.log(`📦 Using cached context for ${filePath}`);
      return cachedContext;
    }
    
    // Cache miss, generate new context
    console.log(`🔄 Generating fresh context for ${filePath}`);
    const context = await generateFunc(filePath, options);
    
    // Save to cache
    saveToCache(cacheKey, context, options);
    
    return context;
  } catch (error) {
    console.error(`❌ Error getting cached context: ${error.message}`);
    
    // Fall back to direct generation on cache error
    try {
      return await generateFunc(filePath, options);
    } catch (fallbackError) {
      console.error(`❌ Failed to generate context: ${fallbackError.message}`);
      return null;
    }
  }
}

module.exports = {
  generateCacheKey,
  getFromCache,
  saveToCache,
  clearExpiredCache,
  getCachedContext
}; 