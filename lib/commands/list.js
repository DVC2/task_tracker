/**
 * TaskTracker List Command
 * 
 * Lists tasks with various filtering and output options
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { 
  output, 
  getTerminalDimensions, 
  formatCategory, 
  colorize 
} = require('../core/formatting');

const structuredOutput = require('../utils/structured-output');
const listManager = require('../core/list-manager');
const taskManager = require('../core/task-manager');

// Data paths (will be initialized)
let TASKS_PATH = '';
let CONFIG_PATH = '';

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  const DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(rootDir, '.tasktracker');
  TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
  
  // Initialize taskManager paths
  if (taskManager.initPaths) {
    taskManager.initPaths(rootDir);
  }
}

/**
 * List tasks with various filtering and output options
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
async function listTasks(args, options = {}) {
  try {
    // Load tasks
    const tasks = await taskManager.loadTasks();
    if (!tasks || !Array.isArray(tasks.tasks)) {
      throw new Error('Failed to load tasks');
    }

    // Extract task array from data object
    const taskArray = tasks.tasks;

    // Apply status filter
    let filteredByStatus = taskArray;
    if (options.status) {
      filteredByStatus = taskArray.filter(task => {
        const matches = task.status.toLowerCase() === options.status.toLowerCase();
        return matches;
      });
    }

    // Apply category filter
    let filteredByCategory = filteredByStatus;
    if (options.category) {
      filteredByCategory = filteredByStatus.filter(task => {
        const matches = task.category.toLowerCase() === options.category.toLowerCase();
        return matches;
      });
    }

    // Apply priority filter
    let filteredByPriority = filteredByCategory;
    if (options.priority) {
      filteredByPriority = filteredByCategory.filter(task => {
        const matches = task.priority.toLowerCase() === options.priority.toLowerCase();
        return matches;
      });
    }

    // Apply keyword filter
    let filteredTasks = filteredByPriority;
    if (options.keyword) {
      filteredTasks = filteredByPriority.filter(task => {
        const keyword = options.keyword.toLowerCase();
        const searchText = `${task.title} ${task.description || ''} ${task.category || ''} ${task.status || ''}`.toLowerCase();
        const matches = searchText.includes(keyword);
        return matches;
      });
    }

    // Sort tasks
    if (options.sort) {
      const [field, direction = 'asc'] = options.sort.split(':');
      filteredTasks.sort((a, b) => {
        const aVal = (a[field] || '').toString().toLowerCase();
        const bVal = (b[field] || '').toString().toLowerCase();
        return direction === 'desc' 
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      });
    }

    // Prepare metadata for structured output
    const metadata = {
      totalTasks: taskArray.length,
      filteredCount: filteredTasks.length,
      filters: {
        status: options.status || null,
        category: options.category || null,
        priority: options.priority || null,
        keyword: options.keyword || null
      },
      sort: options.sort || null
    };

    // Handle JSON output
    if (options.json) {
      const result = {
        success: true,
        data: {
          tasks: filteredTasks,
          metadata
        }
      };
      output(JSON.stringify(result, null, 2), 'data', { globalOptions: options });
      return { success: true };
    }

    // Handle minimal output
    if (options.minimal) {
      filteredTasks.forEach(task => {
        output(`${task.id}: ${task.title} [${task.status}]`, 'info', { globalOptions: options });
      });
      return { success: true };
    }

    // Standard formatted output
    const formattedTasks = filteredTasks.map(task => {
      const status = getStatusEmoji(task.status);
      const priority = task.priority ? ` [${getPriorityLabel(task.priority)}]` : '';
      const category = task.category ? ` (${formatCategory(task.category)})` : '';
      
      return colorize(
        `${status} #${task.id}: ${task.title}${priority}${category}`,
        task.status
      );
    });

    if (formattedTasks.length === 0) {
      output('No tasks found matching the criteria.', 'info', { globalOptions: options });
    } else {
      output(`Found ${formattedTasks.length} tasks:`, 'info', { globalOptions: options });
      formattedTasks.forEach(task => output(task, 'info', { globalOptions: options }));
    }

    return { success: true };
  } catch (error) {
    output(error.message, 'error', {
      globalOptions: options,
      errorCode: 'LIST_FAILED',
      metadata: { command: 'list' }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Get emoji for task status
 * @param {string} status Task status
 * @returns {string} Status emoji
 */
function getStatusEmoji(status) {
  const statusMap = {
    'todo': '📝',
    'in-progress': '🚧',
    'in_progress': '🚧',
    'inprogress': '🚧',
    'review': '👀',
    'done': '✅',
    'completed': '✅',
    'blocked': '🚫',
    'onhold': '⏸️',
    'on-hold': '⏸️',
    'on_hold': '⏸️',
    'canceled': '❌',
    'cancelled': '❌'
  };
  
  return statusMap[status.toLowerCase()] || '❓';
}

/**
 * Get priority label
 * @param {string} priority Priority value
 * @returns {string} Formatted priority label
 */
function getPriorityLabel(priority) {
  const priorityMap = {
    'p1-critical': 'CRITICAL',
    'p1-high': 'HIGH',
    'p2-medium': 'MEDIUM',
    'p3-low': 'LOW',
    'p4-trivial': 'TRIVIAL'
  };
  
  return priorityMap[priority] || priority.toUpperCase();
}

module.exports = {
  listTasks,
  initPaths
}; 