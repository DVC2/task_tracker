/**
 * TaskTracker Archive Manager
 * 
 * Handles archiving, restoring, and listing archived tasks
 */

const fs = require('fs');
const path = require('path');

// Import the formatting utils
const { output, getTerminalDimensions } = require('./formatting');

// Root directory of the tasktracker installation (will be initialized later)
let appRoot = '';
let DATA_DIR = '';
let TASKS_PATH = '';
let ARCHIVES_PATH = '';

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  appRoot = rootDir;
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(appRoot, '.tasktracker');
  TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  ARCHIVES_PATH = path.join(DATA_DIR, 'archives.json');
}

/**
 * Archive a task
 * @param {string|number} taskId ID of the task to archive
 * @param {string} reason Reason for archiving (optional)
 * @param {object} options Options for operation
 */
function archiveTask(taskId, reason = '', options = {}) {
  try {
    if (!taskId) {
      output('❌ Task ID required', 'error');
      return;
    }
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const taskIndex = tasksData.tasks.findIndex(t => t.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      output(`❌ Task #${taskId} not found`, 'error');
      return;
    }
    
    // Get the task to archive
    const taskToArchive = tasksData.tasks[taskIndex];
    
    // Add archived metadata
    taskToArchive.archived = {
      date: new Date().toISOString(),
      reason: reason || 'No reason provided'
    };
    
    // Load or initialize archives
    let archivesData = { archives: [] };
    try {
      if (fs.existsSync(ARCHIVES_PATH)) {
        archivesData = JSON.parse(fs.readFileSync(ARCHIVES_PATH, 'utf8'));
      }
    } catch (error) {
      // If error reading archives, just initialize a new one
      archivesData = { archives: [] };
    }
    
    // Add task to archives
    archivesData.archives.push(taskToArchive);
    
    // Remove task from tasks list
    tasksData.tasks.splice(taskIndex, 1);
    
    // Save updated tasks and archives
    fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
    fs.writeFileSync(ARCHIVES_PATH, JSON.stringify(archivesData, null, 2));
    
    output(`✅ Task #${taskId} archived successfully.`, 'info', { globalOptions: options });
    
    // Display task details
    output(`📝 Archived Task Details:`, 'info', { globalOptions: options });
    displayTaskDetails(taskToArchive, options);
    
    return { success: true, task: taskToArchive };
  } catch (error) {
    output(`❌ Error archiving task: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Restore a task from archives
 * @param {string|number} taskId ID of the task to restore
 * @param {object} options Options for operation
 */
function restoreTask(taskId, options = {}) {
  try {
    if (!taskId) {
      output('❌ Task ID required', 'error');
      return { success: false, error: 'Task ID required' };
    }
    
    // Check if archives exist
    if (!fs.existsSync(ARCHIVES_PATH)) {
      output('❌ No archived tasks found', 'error');
      return { success: false, error: 'No archived tasks found' };
    }
    
    // Load archives
    const archivesData = JSON.parse(fs.readFileSync(ARCHIVES_PATH, 'utf8'));
    
    if (!archivesData.archives || archivesData.archives.length === 0) {
      output('❌ No archived tasks found', 'error');
      return { success: false, error: 'No archived tasks found' };
    }
    
    // Find task in archives
    const taskIndex = archivesData.archives.findIndex(t => t.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      output(`❌ Archived task #${taskId} not found`, 'error');
      return { success: false, error: `Archived task #${taskId} not found` };
    }
    
    // Get the task to restore
    const taskToRestore = archivesData.archives[taskIndex];
    
    // Remove archive metadata
    delete taskToRestore.archived;
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    // Check if a task with this ID already exists
    if (tasksData.tasks.some(t => t.id.toString() === taskId.toString())) {
      output(`❌ Cannot restore: A task with ID #${taskId} already exists`, 'error');
      return { success: false, error: `A task with ID #${taskId} already exists` };
    }
    
    // Add task back to tasks list
    tasksData.tasks.push(taskToRestore);
    
    // Remove task from archives
    archivesData.archives.splice(taskIndex, 1);
    
    // Save updated tasks and archives
    fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
    fs.writeFileSync(ARCHIVES_PATH, JSON.stringify(archivesData, null, 2));
    
    output(`✅ Task #${taskId} restored successfully.`, 'info', { globalOptions: options });
    
    // Display task details
    output(`📝 Restored Task Details:`, 'info', { globalOptions: options });
    displayTaskDetails(taskToRestore, options);
    
    return { success: true, task: taskToRestore };
  } catch (error) {
    output(`❌ Error restoring task: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * List all archived tasks
 * @param {object} options Options for output
 */
function listArchivedTasks(options = {}) {
  try {
    // Check if archives exist
    if (!fs.existsSync(ARCHIVES_PATH)) {
      output('📦 No archived tasks found.', 'info', { globalOptions: options });
      return { success: true, tasks: [] };
    }
    
    // Load archives
    const archivesData = JSON.parse(fs.readFileSync(ARCHIVES_PATH, 'utf8'));
    
    if (!archivesData.archives || archivesData.archives.length === 0) {
      output('📦 No archived tasks found.', 'info', { globalOptions: options });
      return { success: true, tasks: [] };
    }
    
    // Sort archives by ID
    const sortedArchives = [...archivesData.archives].sort((a, b) => a.id - b.id);
    
    // Get terminal dimensions for display formatting
    const terminalDims = getTerminalDimensions();
    
    // If JSON output is requested
    if (options.json) {
      output(sortedArchives, 'data', { globalOptions: options });
      return { success: true, tasks: sortedArchives };
    }
    
    // If minimal output is requested
    if (options.minimal) {
      sortedArchives.forEach(task => {
        output(`#${task.id}: ${task.title} [${task.status}] [${task.category}] [Archived: ${new Date(task.archived.date).toLocaleDateString()}]`, 'info', { globalOptions: options });
      });
      return { success: true, tasks: sortedArchives };
    }
    
    // Otherwise, display formatted table
    output('📦 Archived Tasks:', 'info', { globalOptions: options });
    
    // Calculate column widths based on terminal size and content
    const idWidth = 4;  // Fixed width for ID column
    const statusWidth = Math.min(12, Math.floor(terminalDims.width * 0.15));
    const titleWidth = Math.floor(terminalDims.width * 0.5) - 5;
    const categoryWidth = Math.min(15, Math.floor(terminalDims.width * 0.15));
    const dateWidth = Math.min(15, Math.floor(terminalDims.width * 0.15));
    
    // Create table header
    const header = `┌${'─'.repeat(idWidth)}┬${'─'.repeat(statusWidth)}┬${'─'.repeat(titleWidth)}┬${'─'.repeat(categoryWidth)}┬${'─'.repeat(dateWidth)}┐`;
    const headerRow = `│ #ID │ ${'STATUS'.padEnd(statusWidth - 2)} │ ${'Title'.padEnd(titleWidth - 2)} │ ${'[Category]'.padEnd(categoryWidth - 2)} │ ${'Archived Date'.padEnd(dateWidth - 2)} │`;
    const divider = `├${'─'.repeat(idWidth)}┼${'─'.repeat(statusWidth)}┼${'─'.repeat(titleWidth)}┼${'─'.repeat(categoryWidth)}┼${'─'.repeat(dateWidth)}┤`;
    const footer = `└${'─'.repeat(idWidth)}┴${'─'.repeat(statusWidth)}┴${'─'.repeat(titleWidth)}┴${'─'.repeat(categoryWidth)}┴${'─'.repeat(dateWidth)}┘`;
    
    output(header, 'info', { globalOptions: options });
    output(headerRow, 'info', { globalOptions: options });
    output(divider, 'info', { globalOptions: options });
    
    // Create rows for each task
    sortedArchives.forEach(task => {
      const id = `#${task.id}`.padEnd(idWidth - 2);
      const status = task.status.toUpperCase().padEnd(statusWidth - 2);
      
      // Truncate title if needed
      let title = task.title;
      if (title.length > titleWidth - 5) {
        title = title.substring(0, titleWidth - 5) + '...';
      }
      title = title.padEnd(titleWidth - 2);
      
      const category = `[${task.category}]`.padEnd(categoryWidth - 2);
      const date = new Date(task.archived.date).toLocaleDateString().padEnd(dateWidth - 2);
      
      output(`│ ${id} │ ${status} │ ${title} │ ${category} │ ${date} │`, 'info', { globalOptions: options });
    });
    
    output(footer, 'info', { globalOptions: options });
    output(`Total: ${sortedArchives.length} archived tasks\n`, 'info', { globalOptions: options });
    
    return { success: true, tasks: sortedArchives, count: sortedArchives.length };
  } catch (error) {
    output(`❌ Error listing archived tasks: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Display details for a task
 * @param {object} task Task object to display
 * @param {object} options Display options
 */
function displayTaskDetails(task, options = {}) {
  try {
    if (!task) {
      output('No task details available', 'error', { globalOptions: options });
      return;
    }
    
    // If JSON output is requested
    if (options.json) {
      output(task, 'data', { globalOptions: options });
      return;
    }
    
    // Get terminal dimensions for display formatting
    const terminalDims = getTerminalDimensions();
    const width = Math.min(80, terminalDims.width - 2);
    
    // Create box border
    const horizontalLine = '═'.repeat(width);
    const topBorder = `╔${horizontalLine}╗`;
    const bottomBorder = `╚${horizontalLine}╝`;
    const midBorder = `╠${horizontalLine}╣`;
    
    // Format task header
    const taskHeader = `Task #${task.id}: ${task.title}`;
    
    // Output formatted task details
    output(topBorder, 'info', { globalOptions: options });
    output(`║ ${taskHeader.padEnd(width - 1)}║`, 'info', { globalOptions: options });
    output(midBorder, 'info', { globalOptions: options });
    
    // Format task properties
    const status = `Status: ${task.status.padEnd(20)}`;
    const category = `Category: ${task.category}`;
    const priorityText = task.priority ? `Priority: ${task.priority.padEnd(12)}` : ' '.repeat(25);
    const effortText = task.effort ? `Effort: ${task.effort}` : '';
    
    output(`║ ${status} ${category.padEnd(width - status.length - 8)}║`, 'info', { globalOptions: options });
    
    if (task.priority || task.effort) {
      output(`║ ${priorityText} ${effortText.padEnd(width - priorityText.length - 8)}║`, 'info', { globalOptions: options });
    }
    
    // Format dates
    const created = `Created: ${new Date(task.created).toLocaleString()}`;
    const updated = task.lastUpdated ? `Updated: ${new Date(task.lastUpdated).toLocaleString()}` : '';
    
    output(`║ ${created.padEnd(width - 1)}║`, 'info', { globalOptions: options });
    if (updated) {
      output(`║ ${updated.padEnd(width - 1)}║`, 'info', { globalOptions: options });
    }
    
    // Creator and branch info
    if (task.createdBy) {
      output(`║ Created by: ${task.createdBy.padEnd(width - 13)}║`, 'info', { globalOptions: options });
    }
    
    if (task.branch) {
      output(`║ Branch: ${task.branch.padEnd(width - 9)}║`, 'info', { globalOptions: options });
    }
    
    // If archived, show archive info
    if (task.archived) {
      output(midBorder, 'info', { globalOptions: options });
      const archivedDate = `Archived: ${new Date(task.archived.date).toLocaleString()}`;
      output(`║ ${archivedDate.padEnd(width - 1)}║`, 'info', { globalOptions: options });
      if (task.archived.reason) {
        output(`║ Reason: ${task.archived.reason.padEnd(width - 9)}║`, 'info', { globalOptions: options });
      }
    }
    
    // Related files
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      output(midBorder, 'info', { globalOptions: options });
      output(`║ Related Files:${' '.repeat(width - 15)}║`, 'info', { globalOptions: options });
      
      task.relatedFiles.forEach(file => {
        const fileText = `  ${file}`;
        const maxFileLength = width - 3;
        
        if (fileText.length <= maxFileLength) {
          output(`║ ${fileText.padEnd(width - 1)}║`, 'info', { globalOptions: options });
        } else {
          // Truncate long file paths with ellipsis
          const truncated = fileText.substring(0, maxFileLength - 3) + '...';
          output(`║ ${truncated.padEnd(width - 1)}║`, 'info', { globalOptions: options });
        }
      });
    }
    
    // Dependencies section
    if ((task.dependencies && task.dependencies.length > 0) || 
        (task.blockedBy && task.blockedBy.length > 0)) {
      output(midBorder, 'info', { globalOptions: options });
      
      if (task.dependencies && task.dependencies.length > 0) {
        const depsText = `Dependencies: ${task.dependencies.map(id => `#${id}`).join(', ')}`;
        output(`║ ${depsText.padEnd(width - 1)}║`, 'info', { globalOptions: options });
      }
      
      if (task.blockedBy && task.blockedBy.length > 0) {
        const blockersText = `Blocked by: ${task.blockedBy.map(id => `#${id}`).join(', ')}`;
        output(`║ ${blockersText.padEnd(width - 1)}║`, 'info', { globalOptions: options });
      }
    }
    
    // Close box
    output(bottomBorder, 'info', { globalOptions: options });
  } catch (error) {
    output(`❌ Error displaying task details: ${error.message}`, 'error', { globalOptions: options });
  }
}

// Export functions
module.exports = {
  initPaths,
  archiveTask,
  restoreTask,
  listArchivedTasks,
  displayTaskDetails
}; 