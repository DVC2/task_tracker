/**
 * TaskTracker Structured Output
 * 
 * Provides consistent structured output formats for commands,
 * especially useful for AI agent integration and non-interactive usage.
 */

// Cache for storing serialized results to avoid redundant operations
const serializationCache = new Map();

/**
 * Safely serialize data, handling non-JSON serializable values
 * @param {any} data Data to serialize
 * @returns {any} Safely serializable value
 */
function safeSerialize(data) {
  // For null, undefined, primitives, return directly
  if (data === null || data === undefined || typeof data !== 'object') {
    return data === undefined ? null : data;
  }
  
  // Generate a cache key for objects
  const cacheKey = getCacheKeyForData(data);
  
  // Check cache first
  if (serializationCache.has(cacheKey)) {
    return serializationCache.get(cacheKey);
  }
  
  const seen = new WeakSet();
  
  try {
    const result = JSON.parse(JSON.stringify(data, (key, value) => {
      // Handle undefined
      if (value === undefined) return null;
      
      // Handle functions
      if (typeof value === 'function') return '[Function]';
      
      // Handle error objects
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      return value;
    }));
    
    // Cache the result for performance
    if (cacheKey) {
      serializationCache.set(cacheKey, result);
      
      // Limit cache size to avoid memory issues
      if (serializationCache.size > 1000) {
        // Remove oldest entries
        const oldestKey = serializationCache.keys().next().value;
        serializationCache.delete(oldestKey);
      }
    }
    
    return result;
  } catch (error) {
    // Fallback for serialization errors
    console.warn(`Serialization error: ${error.message}`);
    return simpleSerialize(data);
  }
}

/**
 * Generate a cache key for data
 * @param {any} data Data to generate key for
 * @returns {string|null} Cache key or null if not cacheable
 */
function getCacheKeyForData(data) {
  // Simple objects can use their type + JSON representation as cache key
  if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length < 20) {
    try {
      return `${data.constructor.name}:${Object.keys(data).sort().join(',')}`;
    } catch (e) {
      return null; // Non-cacheable
    }
  }
  return null; // Don't cache complex objects
}

/**
 * Simplified serialization for fallback
 * @param {any} data Data to serialize
 * @returns {any} Basic serialized form
 */
function simpleSerialize(data) {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => typeof item === 'object' && item !== null ? '[Object]' : item);
  }
  
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => typeof value !== 'function')
      .map(([key, value]) => [
        key, 
        typeof value === 'object' && value !== null ? 
          value instanceof Error ? { message: value.message } : '[Object]'
          : value
      ])
  );
}

/**
 * Format a result into a standardized JSON structure
 * @param {any} data Result data to format
 * @param {object} options Formatting options
 * @returns {object} Standardized JSON object
 */
function formatJsonResult(data, options = {}) {
  try {
    // Check if data already has a standardized format
    if (data && typeof data === 'object' && 'success' in data) {
      // Just ensure consistent structure
      return {
        success: !!data.success,
        data: safeSerialize(data.data || data.result || null),
        error: data.error || null,
        metadata: {
          ...safeSerialize(data.metadata || {}),
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Format data into standardized structure
    return {
      success: !options.error, 
      data: safeSerialize(data),
      error: options.error || null,
      metadata: {
        timestamp: new Date().toISOString(),
        ...safeSerialize(options.metadata || {})
      }
    };
  } catch (error) {
    // Provide a fallback if serialization fails
    return {
      success: false,
      data: null,
      error: `Failed to serialize data: ${error.message}`,
      metadata: {
        timestamp: new Date().toISOString(),
        originalDataType: data === null ? 'null' : typeof data,
        isArray: Array.isArray(data)
      }
    };
  }
}

/**
 * Format a task list into a standardized structure
 * @param {Array} tasks List of tasks
 * @param {object} options Formatting options
 * @returns {object} Standardized tasks object
 */
function formatTaskList(tasks, options = {}) {
  if (!Array.isArray(tasks)) {
    return formatJsonResult([], {
      error: 'Expected tasks array but received ' + (tasks === null ? 'null' : typeof tasks),
      ...options
    });
  }
  
  const filteredTasks = tasks.map(task => sanitizeTaskForOutput(task, options));
    
  return formatJsonResult(filteredTasks, {
    metadata: {
      count: filteredTasks.length,
      filtered: options.filtered || false,
      ...options.metadata
    }
  });
}

/**
 * Format a single task into a standardized structure
 * @param {object} task Task object
 * @param {object} options Formatting options
 * @returns {object} Standardized task object
 */
function formatTask(task, options = {}) {
  if (!task) {
    return formatJsonResult(null, {
      error: 'Task not found',
      ...options
    });
  }
  
  const sanitizedTask = sanitizeTaskForOutput(task, options);
  return formatJsonResult(sanitizedTask, options);
}

/**
 * Format an error into a standardized structure
 * @param {Error|string} error Error to format
 * @param {object} options Formatting options
 * @returns {object} Standardized error object
 */
function formatError(error, options = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return formatJsonResult(null, {
    error: errorMessage,
    metadata: {
      errorCode: options.errorCode || 'UNKNOWN_ERROR',
      errorType: error instanceof Error ? error.constructor.name : 'String',
      ...options.metadata
    }
  });
}

/**
 * Format a command result into a standardized structure
 * @param {string} command Command that was executed
 * @param {any} result Result of the command
 * @param {object} options Formatting options
 * @returns {object} Standardized command result
 */
function formatCommandResult(command, result, options = {}) {
  return formatJsonResult(result, {
    metadata: {
      command,
      args: options.args || [],
      executionTime: options.executionTime || null,
      ...options.metadata
    }
  });
}

/**
 * Sanitize a task for output
 * @param {object} task Task to sanitize
 * @param {object} options Sanitization options
 * @returns {object} Sanitized task
 */
function sanitizeTaskForOutput(task, options = {}) {
  if (!task || typeof task !== 'object') {
    return null;
  }
  
  // Create a clean copy with only essential fields
  const sanitized = {
    id: Number(task.id) || 0,
    title: task.title || '',
    status: task.status || 'unknown',
    category: task.category || '',
    priority: task.priority || '',
    effort: task.effort || '',
    created: task.created || null,
    lastUpdated: task.lastUpdated || null
  };
  
  // Add optional fields based on verbosity level
  if (!options.minimal) {
    sanitized.description = task.description || '';
    sanitized.createdBy = task.createdBy || '';
    
    if (Array.isArray(task.relatedFiles)) {
      sanitized.relatedFiles = task.relatedFiles;
    }
    
    if (Array.isArray(task.comments)) {
      sanitized.comments = task.comments;
    }
    
    if (Array.isArray(task.checklists)) {
      sanitized.checklists = task.checklists;
    }
  }
  
  // Add any custom fields specified in options
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(field => {
      if (field in task && !(field in sanitized)) {
        sanitized[field] = task[field];
      }
    });
  }
  
  return sanitized;
}

/**
 * Reset the serialization cache (useful for testing)
 */
function clearCache() {
  serializationCache.clear();
}

module.exports = {
  formatJsonResult,
  formatTaskList,
  formatTask,
  formatError,
  formatCommandResult,
  sanitizeTaskForOutput,
  safeSerialize,
  clearCache // Export for testing purposes
}; 