/**
 * TaskTracker View Command
 * 
 * Displays detailed information about a specific task
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { 
  output, 
  getTerminalDimensions, 
  getStatusEmoji,
  getPriorityLabel,
  wrapText,
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
 * View details of a specific task
 * @param {array} args Command arguments
 * @param {object} options Display options
 * @returns {object} Result with task data and status
 */
function viewTask(args, options = {}) {
  try {
    const taskId = args && args.length > 0 ? args[0] : null;
    
    if (!taskId) {
      output('❌ Task ID required', 'error', { globalOptions: options });
      return { success: false, error: 'Task ID required' };
    }
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const task = tasksData.tasks.find(t => t.id.toString() === taskId.toString());
    
    if (!task) {
      output(`❌ Task #${taskId} not found`, 'error', { globalOptions: options });
      return { success: false, error: `Task #${taskId} not found` };
    }
    
    // If JSON output is requested
    if (options.json) {
      const result = {
        success: true,
        data: {
          task: task
        }
      };
      output(JSON.stringify(result, null, 2), 'data', { globalOptions: options });
      return { success: true, task };
    }
    
    // Clean up title for display
    const cleanTitle = task.title.replace(/\s+/g, ' ').trim();
    
    // Check if verbose output is requested
    const isVerbose = options.verbose;
    
    // Load dependencies if available
    let dependencies = [];
    let blockedBy = [];
    try {
      // In a real implementation, you would load dependency info here
      // For now, just use what's available on the task itself
      dependencies = task.dependencies || [];
      blockedBy = task.blockedBy || [];
    } catch (error) {
      if (isVerbose) {
        output(`⚠️ Could not load dependencies: ${error.message}`, 'warning', { globalOptions: options });
      }
    }
    
    // If JSON output is requested
    if (options.json) {
      output(task, 'data', { globalOptions: options });
      return { success: true, task };
    }
    
    // If description is missing, set to a default message
    const taskDescription = task.description || 'No description provided.';
    
    // Get status emoji for visual status indication
    const statusEmoji = getStatusEmoji(task.status);
    
    // Format priority label with emoji
    const priorityLabel = task.priority ? getPriorityLabel(task.priority) : 'None';
    
    // Get terminal width for layout calculations
    const termWidth = getTerminalDimensions().width;
    const isNarrow = termWidth < 80;
    
    // Colorize the task title
    const taskTitleColored = colorize(cleanTitle || 'Untitled Task', task.status, task.category);
    
    // Create separator line
    const separatorLine = '─'.repeat(Math.min(termWidth - 2, 80));
    
    output('\n┌' + separatorLine + '┐', 'info', { globalOptions: options });
    output('│ ' + taskTitleColored + ' '.repeat(Math.max(2, separatorLine.length - taskTitleColored.length)) + '│', 'info', { globalOptions: options });
    output('├' + separatorLine + '┤', 'info', { globalOptions: options });
    
    // Status and metadata
    output(`│ Status: ${statusEmoji} ${colorize(task.status, task.status)}${' '.repeat(Math.max(2, separatorLine.length - 10 - task.status.length))}│`, 'info', { globalOptions: options });
    output(`│ Category: ${task.category || 'None'}${' '.repeat(Math.max(2, separatorLine.length - 11 - (task.category || 'None').length))}│`, 'info', { globalOptions: options });
    
    if (task.priority) {
      output(`│ Priority: ${priorityLabel}${' '.repeat(Math.max(2, separatorLine.length - 11 - priorityLabel.length))}│`, 'info', { globalOptions: options });
    }
    
    if (task.effort) {
      output(`│ Effort: ${task.effort}${' '.repeat(Math.max(2, separatorLine.length - 9 - task.effort.length))}│`, 'info', { globalOptions: options });
    }
    
    // Created date
    if (task.createdAt || task.created) {
      const createdDate = new Date(task.createdAt || task.created).toLocaleString();
      output(`│ Created: ${createdDate}${' '.repeat(Math.max(2, separatorLine.length - 10 - createdDate.length))}│`, 'info', { globalOptions: options });
    }
    
    // Updated date
    if (task.updatedAt || task.lastUpdated) {
      const updatedDate = new Date(task.updatedAt || task.lastUpdated).toLocaleString();
      output(`│ Updated: ${updatedDate}${' '.repeat(Math.max(2, separatorLine.length - 10 - updatedDate.length))}│`, 'info', { globalOptions: options });
    }
    
    // Display dependencies
    if (dependencies.length > 0) {
      const dependsOnStr = `Depends on: #${dependencies.join(', #')}`;
      output(`│ ${dependsOnStr}${' '.repeat(Math.max(2, separatorLine.length - 2 - dependsOnStr.length))}│`, 'info', { globalOptions: options });
    }
    
    // Display tasks that are blocked by this one
    if (blockedBy.length > 0) {
      const blockedByStr = `Blocks: #${blockedBy.join(', #')}`;
      output(`│ ${blockedByStr}${' '.repeat(Math.max(2, separatorLine.length - 2 - blockedByStr.length))}│`, 'info', { globalOptions: options });
    }
    
    output('├' + separatorLine + '┤', 'info', { globalOptions: options });
    
    // Description
    const descLines = wrapText(taskDescription, Math.min(termWidth - 6, 78));
    output(`│ Description:${' '.repeat(Math.max(2, separatorLine.length - 13))}│`, 'info', { globalOptions: options });
    descLines.forEach(line => {
      output(`│   ${line}${' '.repeat(Math.max(2, separatorLine.length - 3 - line.length))}│`, 'info', { globalOptions: options });
    });
    
    // Related files
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      output('├' + separatorLine + '┤', 'info', { globalOptions: options });
      output(`│ Related Files:${' '.repeat(Math.max(2, separatorLine.length - 15))}│`, 'info', { globalOptions: options });
      
      task.relatedFiles.forEach(file => {
        const displayFile = file.length > separatorLine.length - 5 ? 
          '...' + file.substring(file.length - (separatorLine.length - 8)) : file;
        
        output(`│   ${displayFile}${' '.repeat(Math.max(2, separatorLine.length - 3 - displayFile.length))}│`, 'info', { globalOptions: options });
      });
    }
    
    // Comments
    if (task.comments && task.comments.length > 0) {
      output('├' + separatorLine + '┤', 'info', { globalOptions: options });
      output(`│ Comments:${' '.repeat(Math.max(2, separatorLine.length - 10))}│`, 'info', { globalOptions: options });
      
      task.comments.forEach(comment => {
        // In different task data structures, the timestamp field might be called timestamp or date
        const commentDate = new Date(comment.timestamp || comment.date).toLocaleString();
        const commentHeader = `[${commentDate}]`;
        output(`│ ${commentHeader}${' '.repeat(Math.max(2, separatorLine.length - 2 - commentHeader.length))}│`, 'info', { globalOptions: options });
        
        const commentLines = wrapText(comment.text, Math.min(termWidth - 6, 78));
        commentLines.forEach(line => {
          output(`│   ${line}${' '.repeat(Math.max(2, separatorLine.length - 3 - line.length))}│`, 'info', { globalOptions: options });
        });
      });
    }
    
    output('└' + separatorLine + '┘\n', 'info', { globalOptions: options });
    
    return { success: true, task };
  } catch (error) {
    output('❌ Error viewing task: ' + error.message, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initPaths,
  viewTask
}; 