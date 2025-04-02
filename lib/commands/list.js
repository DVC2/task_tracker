/**
 * TaskTracker List Command
 * 
 * Lists tasks with various filtering and output options
 */

const fs = require('fs');
const path = require('path');

// Import dependencies (these paths will need to be adjusted based on final structure)
const { 
  output, 
  getTerminalDimensions, 
  formatCategory, 
  colorize 
} = require('../core/formatting');

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
}

/**
 * List tasks with filtering options
 * @param {object} options Options for filtering and display
 * @returns {object} Result with tasks and status
 */
function listTasks(options = {}) {
  try {
    if (!fs.existsSync(TASKS_PATH)) {
      output('❌ No tasks found. Initialize TaskTracker first: tasktracker init', 'error', { globalOptions: options });
      return { success: false, error: 'Tasks not initialized' };
    }
    
    // Destructure options
    const { 
      statusFilter, 
      priorityFilter, 
      categoryFilter, 
      keywordFilter,
      showCurrentOnly,
      showFull
    } = options;
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
      output('📋 No tasks found.', 'info', { globalOptions: options });
      return { success: true, tasks: [] };
    }
    
    // Filter tasks based on criteria
    let filteredTasks = tasksData.tasks;
    
    // Apply status filter
    if (statusFilter) {
      filteredTasks = filteredTasks.filter(task => 
        task.status.toLowerCase() === statusFilter.toLowerCase()
      );
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks with status "${statusFilter}" found.`, 'info', { globalOptions: options });
        return { success: true, tasks: [] };
      }
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filteredTasks = filteredTasks.filter(task => 
        task.priority && task.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks with priority "${priorityFilter}" found.`, 'info', { globalOptions: options });
        return { success: true, tasks: [] };
      }
    }
    
    // Apply category filter
    if (categoryFilter) {
      filteredTasks = filteredTasks.filter(task => 
        task.category.toLowerCase() === categoryFilter.toLowerCase()
      );
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks in category "${categoryFilter}" found.`, 'info', { globalOptions: options });
        return { success: true, tasks: [] };
      }
    }
    
    // Apply keyword filter
    if (keywordFilter) {
      const searchTerm = keywordFilter.toLowerCase();
      filteredTasks = filteredTasks.filter(task => {
        // Search in title, description, and comments
        const titleMatch = task.title.toLowerCase().includes(searchTerm);
        const descMatch = task.description && task.description.toLowerCase().includes(searchTerm);
        
        // Search in comments if they exist
        let commentMatch = false;
        if (task.comments && task.comments.length > 0) {
          commentMatch = task.comments.some(comment => 
            comment.text.toLowerCase().includes(searchTerm)
          );
        }
        
        return titleMatch || descMatch || commentMatch;
      });
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks matching keyword "${keywordFilter}" found.`, 'info', { globalOptions: options });
        return { success: true, tasks: [] };
      }
    }
    
    // Sort tasks by ID
    filteredTasks = filteredTasks.sort((a, b) => a.id - b.id);
    
    // Get terminal dimensions for display formatting
    const terminalDims = getTerminalDimensions();
    
    // Output as JSON if requested
    if (options.json) {
      const result = {
        success: true,
        data: {
          tasks: filteredTasks
        },
        errors: []
      };
      
      output(result, 'data', { globalOptions: options });
      return { success: true, tasks: filteredTasks };
    }
    
    // Output as minimal text if requested
    if (options.minimal) {
      output(`Total: ${filteredTasks.length} tasks`, 'info', { globalOptions: options });
      
      filteredTasks.forEach(task => {
        output(`#${task.id} [${task.status.toUpperCase()}] ${task.title} ${formatCategory(task.category, true)}${task.priority ? ` (${task.priority})` : ''}`, 'info', { globalOptions: options });
      });
      
      return { success: true, tasks: filteredTasks };
    }
    
    // Format tasks for display
    output(`\n📋 Task List:`, 'info', { globalOptions: options });
    
    // Get terminal dimensions
    const termDimensions = getTerminalDimensions();
    const isCompactMode = termDimensions.width < 80;
    
    // Calculate dynamic column widths based on terminal width and content
    let idColWidth, statusColWidth, titleColWidth, categoryColWidth;
    let priorityColWidth, effortColWidth;
    
    // Determine the longest content in each column to set appropriate widths
    const longestId = Math.max(...filteredTasks.map(task => task.id.toString().length));
    const longestStatus = Math.max(...filteredTasks.map(task => task.status.length));
    const longestCategory = Math.max(...filteredTasks.map(task => task.category ? task.category.length : 0));
    const longestTitle = Math.max(...filteredTasks.map(task => task.title ? task.title.length : 0));
    const longestPriority = filteredTasks.some(task => task.priority) ? 
      Math.max(...filteredTasks.filter(task => task.priority).map(task => task.priority.length)) : 0;
    const longestEffort = filteredTasks.some(task => task.effort) ? 
      Math.max(...filteredTasks.filter(task => task.effort).map(task => task.effort.length)) : 0;
    
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
      const includeExtendedInfo = termDimensions.width >= 120 && !showCurrentOnly;
      
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
      // Truncate title if needed
      let displayTitle = title;
      if (title.length > titleColWidth) {
        displayTitle = title.substring(0, titleColWidth - 3) + '...';
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
    filteredTasks.forEach(task => {
      // Map status to consistent formats with color hints
      let statusDisplay = task.status.toUpperCase();
      
      // Format status with color hint characters
      if (statusDisplay === 'TODO') {
        statusDisplay = '⬜ TODO';
      } else if (statusDisplay === 'IN-PROGRESS') {
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
      
      const row = createRow(
        `#${task.id}`,
        statusDisplay,
        task.title,
        formatCategory(task.category),
        priorityDisplay,
        task.effort || ''
      );
      
      output(row, 'info', { globalOptions: options });
    });
    
    // Display the table footer
    output(bottomLine, 'info', { globalOptions: options });
    output(`Total: ${filteredTasks.length} tasks`, 'info', { globalOptions: options });
    
    // Show help for filtering if applicable
    if (!statusFilter && !priorityFilter && !categoryFilter && !keywordFilter) {
      output(`\nHint: Filter using status, --priority=X, --category=Y, or --keyword=Z`, 'info', { globalOptions: options });
    }
    
    // If show full details is requested, show detailed view for each task
    if (showFull) {
      output('\nDetailed views:', 'info', { globalOptions: options });
      filteredTasks.forEach(task => {
        // We would call viewTask here, but that will be in a separate module
        // For now, just note that we need to show detail views
        output(`Detailed view for task #${task.id} would be shown here`, 'info', { globalOptions: options });
      });
    }
    
    return { success: true, tasks: filteredTasks };
  } catch (error) {
    output(`❌ Error listing tasks: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initPaths,
  listTasks
}; 