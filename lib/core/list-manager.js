/**
 * TaskTracker List Manager
 * 
 * Core functionality for listing and filtering tasks
 */

const taskManager = require('./task-manager');
const structuredOutput = require('../utils/structured-output');

/**
 * Validate filter criteria
 * @param {object} criteria Filter criteria
 * @returns {object} Validation result
 */
function validateFilterCriteria(criteria) {
  const validStatuses = ['todo', 'in-progress', 'review', 'done'];
  const validPriorities = ['p0', 'p1', 'p2', 'p3'];
  const errors = [];

  if (criteria.status && !validStatuses.includes(criteria.status.toLowerCase())) {
    errors.push(`Invalid status "${criteria.status}". Valid values: ${validStatuses.join(', ')}`);
  }

  if (criteria.priority && !validPriorities.some(p => criteria.priority.toLowerCase().startsWith(p))) {
    errors.push(`Invalid priority "${criteria.priority}". Valid values: ${validPriorities.join(', ')}`);
  }

  if (criteria.limit && (isNaN(Number(criteria.limit)) || Number(criteria.limit) < 1)) {
    errors.push('Limit must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get filtered tasks based on criteria
 * @param {object} filterCriteria Filter options
 * @param {string} filterCriteria.status Status filter
 * @param {string} filterCriteria.priority Priority filter
 * @param {string} filterCriteria.category Category filter
 * @param {string} filterCriteria.keyword Keyword filter
 * @param {number} filterCriteria.limit Maximum number of tasks to return
 * @returns {object} Result with filtered tasks and metadata
 */
function getFilteredTasks(filterCriteria = {}) {
  try {
    // Validate filter criteria
    const validation = validateFilterCriteria(filterCriteria);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join('; '),
        metadata: {
          errorCode: 'INVALID_FILTER',
          validationErrors: validation.errors
        }
      };
    }

    // Use task manager's filtering mechanism for consistent behavior
    const tasks = taskManager.filterTasks(filterCriteria);

    // Get task statistics
    const stats = getTaskStats(tasks);

    // Apply limit if provided
    const limit = filterCriteria.limit;
    const limitedTasks = limit && !isNaN(Number(limit)) && Number(limit) > 0 
      ? tasks.slice(0, Number(limit)) 
      : tasks;

    // Sort tasks by ID
    const sortedTasks = limitedTasks.sort((a, b) => a.id - b.id);

    // Return result with metadata
    return {
      success: true,
      tasks: sortedTasks,
      metadata: {
        total: tasks.length,
        displayed: sortedTasks.length,
        filtered: !!(filterCriteria.status || filterCriteria.priority || filterCriteria.category || filterCriteria.keyword),
        filters: {
          status: filterCriteria.status,
          priority: filterCriteria.priority,
          category: filterCriteria.category,
          keyword: filterCriteria.keyword
        },
        limit: limit ? Number(limit) : null,
        stats
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metadata: {
        errorCode: 'FILTER_ERROR'
      }
    };
  }
}

/**
 * Get task statistics
 * @param {Array} tasks List of tasks
 * @returns {object} Task statistics
 */
function getTaskStats(tasks) {
  return {
    byStatus: tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {}),
    byPriority: tasks.reduce((acc, task) => {
      if (task.priority) {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
      }
      return acc;
    }, {}),
    byCategory: tasks.reduce((acc, task) => {
      if (task.category) {
        acc[task.category] = (acc[task.category] || 0) + 1;
      }
      return acc;
    }, {})
  };
}

/**
 * Format tasks for output based on options
 * @param {Array} tasks Tasks to format
 * @param {object} options Output options
 * @param {boolean} options.json Output as JSON
 * @param {boolean} options.minimal Output minimal format
 * @returns {object} Formatted result
 */
function formatTaskOutput(tasks, options = {}) {
  try {
    if (options.json) {
      return structuredOutput.formatTaskList(tasks, {
        minimal: options.minimal,
        metadata: {
          ...options.metadata,
          timestamp: new Date().toISOString(),
          command: 'list'
        }
      });
    }

    // For minimal output, return tasks with basic formatting
    if (options.minimal) {
      return {
        success: true,
        tasks,
        formattedTasks: tasks.map(task => structuredOutput.formatMinimalTask(task))
      };
    }

    // Return tasks with full details for table display
    return {
      success: true,
      tasks,
      formattedTasks: tasks.map(task => ({
        ...structuredOutput.formatFullTask(task),
        status: formatStatus(task.status),
        priority: formatPriority(task.priority)
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metadata: {
        errorCode: 'FORMAT_ERROR'
      }
    };
  }
}

/**
 * Format status with visual indicators
 * @param {string} status Task status
 * @returns {string} Formatted status
 */
function formatStatus(status) {
  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case 'TODO':
      return '⬜ TODO';
    case 'IN-PROGRESS':
    case 'INPROGRESS':
      return '🔵 IN-PROG';
    case 'REVIEW':
      return '🟡 REVIEW';
    case 'DONE':
      return '✅ DONE';
    default:
      return statusUpper;
  }
}

/**
 * Format priority with visual indicators
 * @param {string} priority Task priority
 * @returns {string} Formatted priority
 */
function formatPriority(priority) {
  if (!priority) return '';
  
  if (priority.startsWith('p0')) {
    return '🔴 ' + priority;
  } else if (priority.startsWith('p1')) {
    return '🟠 ' + priority;
  } else if (priority.startsWith('p2')) {
    return '🟢 ' + priority;
  }
  return '⚪ ' + priority;
}

module.exports = {
  getFilteredTasks,
  formatTaskOutput,
  validateFilterCriteria
}; 