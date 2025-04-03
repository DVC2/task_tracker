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
 * List tasks with filtering options
 * @param {object} options Options for filtering and display
 * @returns {object} Result with tasks and status
 */
function listTasks(options = {}) {
  try {
    if (!fs.existsSync(TASKS_PATH)) {
      const errorMsg = 'No tasks found. Initialize TaskTracker first: tasktracker init';
      output(errorMsg, 'error', { globalOptions: options });
      
      if (options.json) {
        const errorResult = structuredOutput.formatError(errorMsg, { 
          errorCode: 'NOT_INITIALIZED',
          metadata: { command: 'list' }
        });
        output(errorResult, 'data', { globalOptions: options });
      }
      
      return { success: false, error: errorMsg };
    }
    
    // Destructure options
    const { 
      statusFilter, 
      priorityFilter, 
      categoryFilter, 
      keywordFilter,
      showCurrentOnly,
      showFull,
      limit
    } = options;
    
    // Load tasks using task manager to ensure proper validation
    let tasks = [];
    try {
      // Use the task manager's filtering mechanism for consistent behavior
      const filterCriteria = {
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        keyword: keywordFilter
      };
      
      tasks = taskManager.filterTasks(filterCriteria);
    } catch (error) {
      // If there's an error in task loading, provide a useful message
      const errorMsg = `Error loading tasks: ${error.message}`;
      output(errorMsg, 'error', { globalOptions: options });
      
      if (options.json) {
        const errorResult = structuredOutput.formatError(error, { 
          errorCode: 'LOAD_ERROR',
          metadata: { command: 'list' }
        });
        output(errorResult, 'data', { globalOptions: options });
      }
      
      return { success: false, error: errorMsg };
    }
    
    // Apply limit if provided
    if (limit && !isNaN(Number(limit)) && Number(limit) > 0) {
      tasks = tasks.slice(0, Number(limit));
    }
    
    // Handle the case when no tasks match the filters
    if (tasks.length === 0) {
      const noTasksMsg = getNoTasksMessage(statusFilter, priorityFilter, categoryFilter, keywordFilter);
      output(noTasksMsg, 'info', { globalOptions: options });
      
      if (options.json) {
        const result = structuredOutput.formatTaskList([], {
          filtered: !!(statusFilter || priorityFilter || categoryFilter || keywordFilter),
          metadata: {
            filters: {
              status: statusFilter,
              priority: priorityFilter,
              category: categoryFilter,
              keyword: keywordFilter
            }
          }
        });
        
        output(result, 'data', { globalOptions: options });
      }
      
      return { success: true, tasks: [] };
    }
    
    // Sort tasks by ID
    tasks = tasks.sort((a, b) => a.id - b.id);
    
    // Output as JSON if requested
    if (options.json) {
      const result = structuredOutput.formatTaskList(tasks, {
        filtered: !!(statusFilter || priorityFilter || categoryFilter || keywordFilter),
        minimal: options.minimal,
        metadata: {
          filters: {
            status: statusFilter,
            priority: priorityFilter,
            category: categoryFilter,
            keyword: keywordFilter
          },
          limit: limit ? Number(limit) : null
        }
      });
      
      output(result, 'data', { globalOptions: options });
      return { success: true, tasks };
    }
    
    // Output as minimal text if requested
    if (options.minimal) {
      output(`Total: ${tasks.length} tasks`, 'info', { globalOptions: options });
      
      tasks.forEach(task => {
        output(`#${task.id} [${task.status.toUpperCase()}] ${task.title} ${formatCategory(task.category, true)}${task.priority ? ` (${task.priority})` : ''}`, 'info', { globalOptions: options });
      });
      
      return { success: true, tasks };
    }
    
    // Display tasks in table format for human readable output
    displayTaskTable(tasks, options);
    
    return { success: true, tasks };
  } catch (error) {
    const errorMsg = `Error listing tasks: ${error.message}`;
    output(errorMsg, 'error', { globalOptions: options });
    
    if (options.json) {
      const errorResult = structuredOutput.formatError(error, { 
        errorCode: 'COMMAND_ERROR',
        metadata: { command: 'list' }
      });
      output(errorResult, 'data', { globalOptions: options });
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Get an appropriate message when no tasks match the filters
 * @param {string} statusFilter Status filter
 * @param {string} priorityFilter Priority filter
 * @param {string} categoryFilter Category filter
 * @param {string} keywordFilter Keyword filter
 * @returns {string} Message to display
 */
function getNoTasksMessage(statusFilter, priorityFilter, categoryFilter, keywordFilter) {
  if (statusFilter) {
    return `📋 No tasks with status "${statusFilter}" found.`;
  } else if (priorityFilter) {
    return `📋 No tasks with priority "${priorityFilter}" found.`;
  } else if (categoryFilter) {
    return `📋 No tasks in category "${categoryFilter}" found.`;
  } else if (keywordFilter) {
    return `📋 No tasks matching keyword "${keywordFilter}" found.`;
  } else {
    return '📋 No tasks found.';
  }
}

/**
 * Display tasks in a formatted table
 * @param {Array} tasks Tasks to display
 * @param {object} options Display options
 */
function displayTaskTable(tasks, options = {}) {
  // Format tasks for display
  output(`\n📋 Task List:`, 'info', { globalOptions: options });
  
  // Get terminal dimensions
  const termDimensions = getTerminalDimensions();
  const isCompactMode = termDimensions.width < 80;
  
  // Calculate dynamic column widths based on terminal width and content
  let idColWidth, statusColWidth, titleColWidth, categoryColWidth;
  let priorityColWidth, effortColWidth;
  
  // Determine the longest content in each column to set appropriate widths
  const longestId = Math.max(...tasks.map(task => task.id.toString().length));
  const longestStatus = Math.max(...tasks.map(task => task.status.length));
  const longestCategory = Math.max(...tasks.map(task => task.category ? task.category.length : 0));
  const longestTitle = Math.max(...tasks.map(task => task.title ? task.title.length : 0));
  const longestPriority = tasks.some(task => task.priority) ? 
    Math.max(...tasks.filter(task => task.priority).map(task => task.priority.length)) : 0;
  const longestEffort = tasks.some(task => task.effort) ? 
    Math.max(...tasks.filter(task => task.effort).map(task => task.effort.length)) : 0;
  
  // Set base widths (compact mode has smaller columns)
  if (isCompactMode) {
    // Compact mode - minimize column widths for small terminals
    idColWidth = Math.min(Math.max(longestId + 1, 3), 4);
    statusColWidth = Math.min(Math.max(longestStatus + 1, 6), 10);
    categoryColWidth = Math.min(Math.max(longestCategory + 2, 6), 10);
    
    // For compact mode, title gets most of the remaining space
    const availableWidth = termDimensions.width - idColWidth - statusColWidth - categoryColWidth - 7; // 7 for separators and spacing
    titleColWidth = Math.max(15, availableWidth);
    
    // Skip priority and effort columns in compact mode
    priorityColWidth = 0;
    effortColWidth = 0;
  } else {
    // Normal mode - more comfortable column widths
    idColWidth = 5;
    statusColWidth = 12;
    categoryColWidth = 14;
    
    // Check if we should include priority/effort columns
    const includeExtendedInfo = termDimensions.width >= 120 && !options.showCurrentOnly;
    
    if (includeExtendedInfo) {
      priorityColWidth = Math.max(longestPriority + 2, 10);
      effortColWidth = Math.max(longestEffort + 2, 10);
      
      // Calculate title width based on available space
      const availableWidth = termDimensions.width - idColWidth - statusColWidth - 
                            categoryColWidth - priorityColWidth - effortColWidth - 13; // 13 for separators and margins
      titleColWidth = Math.max(20, availableWidth);
    } else {
      priorityColWidth = 0;
      effortColWidth = 0;
      
      // Calculate title width based on available space
      const availableWidth = termDimensions.width - idColWidth - statusColWidth - categoryColWidth - 7;
      titleColWidth = Math.max(25, availableWidth);
    }
  }
  
  // Function to create a boxed table row
  const createRow = (id, status, title, category, priority = '', effort = '') => {
    // Truncate title if needed and ensure spaces are properly normalized
    let displayTitle = title.replace(/\s+/g, ' ').trim();
    if (displayTitle.length > titleColWidth) {
      displayTitle = displayTitle.substring(0, titleColWidth - 3) + '...';
    }
    
    // Format each cell with proper padding
    const idCell = `${id}`.padEnd(idColWidth);
    const statusCell = `${status}`.padEnd(statusColWidth);
    const titleCell = `${displayTitle}`.padEnd(titleColWidth);
    const categoryCell = `${category}`.padEnd(categoryColWidth);
    
    // Build the basic row
    let row = `│ ${idCell} │ ${statusCell} │ ${titleCell} │ ${categoryCell} │`;
    
    // Add priority and effort if applicable
    if (priorityColWidth > 0 && effortColWidth > 0) {
      const priorityCell = `${priority}`.padEnd(priorityColWidth);
      const effortCell = `${effort}`.padEnd(effortColWidth);
      row += ` ${priorityCell} │ ${effortCell} │`;
    }
    
    return row;
  };
  
  // Create header row
  let headerRow = createRow(
    '#ID', 
    'STATUS', 
    'Title', 
    'Category',
    priorityColWidth > 0 ? 'Priority' : '',
    effortColWidth > 0 ? 'Effort' : ''
  );
  
  // Create horizontal separator lines
  const createSeparator = (char, connector) => {
    // Create properly aligned separator line with correct box-drawing characters
    let topChar = connector.charAt(0) || '+';
    let midChar = connector.charAt(1) || '+';
    let botChar = connector.charAt(2) || '+';
    
    // Start with the first column
    let line = `${topChar}${char.repeat(idColWidth + 2)}`;
    
    // Add middle columns
    line += `${midChar}${char.repeat(statusColWidth + 2)}`;
    line += `${midChar}${char.repeat(titleColWidth + 2)}`;
    line += `${midChar}${char.repeat(categoryColWidth + 2)}`;
    
    // Add optional columns
    if (priorityColWidth > 0 && effortColWidth > 0) {
      line += `${midChar}${char.repeat(priorityColWidth + 2)}`;
      line += `${midChar}${char.repeat(effortColWidth + 2)}`;
    }
    
    // End with the last column connector
    line += botChar;
    return line;
  };
  
  // Create the separator lines with proper box-drawing characters
  const topLine = createSeparator('─', isCompactMode ? '++' : '┌┬┐');
  const headerSeparator = createSeparator('─', isCompactMode ? '++' : '├┼┤');
  const bottomLine = createSeparator('─', isCompactMode ? '++' : '└┴┘');
  
  // Display the table header
  output(topLine, 'info', { globalOptions: options });
  output(headerRow, 'info', { globalOptions: options });
  output(headerSeparator, 'info', { globalOptions: options });
  
  // Display each task row
  tasks.forEach(task => {
    // Map status to consistent formats with color hints
    let statusDisplay = task.status.toUpperCase();
    
    // Format status with color hint characters
    if (statusDisplay === 'TODO') {
      statusDisplay = '⬜ TODO';
    } else if (statusDisplay === 'IN-PROGRESS' || statusDisplay === 'INPROGRESS') {
      statusDisplay = '🔵 IN-PROG';
    } else if (statusDisplay === 'REVIEW') {
      statusDisplay = '🟡 REVIEW';
    } else if (statusDisplay === 'DONE') {
      statusDisplay = '✅ DONE';
    }
    
    // Format priority with color hint characters if needed
    let priorityDisplay = '';
    if (task.priority) {
      if (task.priority.startsWith('p0')) {
        priorityDisplay = '🔴 ' + task.priority;
      } else if (task.priority.startsWith('p1')) {
        priorityDisplay = '🟠 ' + task.priority;
      } else if (task.priority.startsWith('p2')) {
        priorityDisplay = '🟢 ' + task.priority;
      } else {
        priorityDisplay = '⚪ ' + task.priority;
      }
    }
    
    // Clean up title for display - normalize whitespace
    const cleanTitle = task.title.replace(/\s+/g, ' ').trim();
    
    const row = createRow(
      `#${task.id}`,
      statusDisplay,
      cleanTitle,
      formatCategory(task.category),
      priorityDisplay,
      task.effort || ''
    );
    
    output(row, 'info', { globalOptions: options });
  });
  
  // Display the table footer
  output(bottomLine, 'info', { globalOptions: options });
  output(`Total: ${tasks.length} tasks`, 'info', { globalOptions: options });
  
  // Show help for filtering if applicable
  if (!options.statusFilter && !options.priorityFilter && !options.categoryFilter && !options.keywordFilter) {
    output(`\nHint: Filter using --status=X, --priority=Y, --category=Z, or --keyword=W`, 'info', { globalOptions: options });
  }
}

module.exports = {
  initPaths,
  listTasks
}; 