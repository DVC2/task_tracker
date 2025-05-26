/**
 * Common utility functions shared across TaskTracker modules
 * Provides helpers for formatting, error handling, and performance
 */

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} - Formatted string (e.g., "2.5 KB")
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Minutes to format
 * @returns {string} - Formatted string (e.g., "2h 30m")
 */
function formatDuration(minutes) {
  if (minutes < 1) return '< 1m';
  
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatISODate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Safe operation wrapper for error handling
 * @param {Function} operation - Function to execute
 * @param {*} fallback - Fallback value if operation fails
 * @param {boolean} shouldThrow - Whether to rethrow errors
 * @returns {Promise<*>} - Operation result or fallback
 */
async function safeOperation(operation, fallback = null, shouldThrow = false) {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    if (shouldThrow) {
      throw error;
    }
    
    return fallback;
  }
}

/**
 * Create a function wrapper that measures performance
 * @param {Function} fn - Function to measure
 * @param {string} name - Function name for logging
 * @param {number} threshold - Time threshold in ms for logging (default: If longer than 100ms, it logs)
 * @returns {Function} - Wrapped function
 */
function measurePerformance(fn, name, threshold = 100) {
  return async (...args) => {
    const start = Date.now();
    const result = await fn(...args);
    const duration = Date.now() - start;
    
    if (duration > threshold) {
      console.log(`Performance: ${name} took ${duration}ms`);
    }
    
    return result;
  };
}

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} - Debounced function
 */
function debounce(fn, delay) {
  let timeout;
  
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  formatBytes,
  formatDuration,
  formatISODate,
  safeOperation,
  measurePerformance,
  debounce,
  deepClone
}; 