/**
 * TaskTracker Structured Output
 * 
 * Provides consistent structured output formats for commands,
 * especially useful for AI agent integration and non-interactive usage.
 */

/**
 * Safely serialize data, handling non-JSON serializable values
 * @param {any} data Data to serialize
 * @returns {any} Safely serializable value
 */
function safeSerialize(data) {
  const seen = new WeakSet();
  
  return JSON.parse(JSON.stringify(data, (key, value) => {
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
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    
    return value;
  }));
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
  const filteredTasks = Array.isArray(tasks) 
    ? tasks.map(task => sanitizeTaskForOutput(task, options))
    : [];
    
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

module.exports = {
  formatJsonResult,
  formatTaskList,
  formatTask,
  formatError,
  formatCommandResult,
  sanitizeTaskForOutput
}; 