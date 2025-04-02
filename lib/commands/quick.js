/**
 * TaskTracker Quick Command
 * 
 * Non-interactive quick task creation functionality
 */

const { execSync } = require('child_process');

// Import dependencies
const { output } = require('../core/formatting');
const configManager = require('../core/config-manager');
const taskManager = require('../core/task-manager');

/**
 * Create a task quickly with minimal input
 * @param {string[]} args Arguments for quick task creation
 * @param {object} options Command options
 * @returns {object} Result with created task and status
 */
function quickAddTask(args, options = {}) {
  try {
    // At minimum, we need a title
    if (args.length === 0) {
      output('❌ Task title required', 'error', { globalOptions: options });
      return { success: false, error: 'Task title required' };
    }
    
    // First argument is always the title
    const title = args[0];
    
    // Get configuration for validation
    const config = configManager.loadConfig();
    
    // Create a task with defaults
    let taskData = {
      title: title,
      description: '',
      category: 'feature', // Default category
      status: 'todo',      // Default status
      priority: config.priorityLevels[1] || 'p2-medium', // Default to medium priority
      effort: config.effortEstimation[2] || '3-medium',  // Default to medium effort
      relatedFiles: [],
      comments: []
    };
    
    // Get the creator from Git if available
    try {
      taskData.createdBy = execSync('git config --get user.name').toString().trim();
    } catch (error) {
      taskData.createdBy = process.env.USER || process.env.USERNAME || 'Unknown';
    }
    
    // Get the branch from Git if available
    try {
      taskData.branch = execSync('git branch --show-current').toString().trim();
    } catch (error) {
      taskData.branch = 'None';
    }
    
    // Process additional arguments
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      // Check if this is a category
      if (config.taskCategories.includes(arg)) {
        taskData.category = arg;
        continue;
      }
      
      // Check if this is a status
      if (config.taskStatuses.includes(arg)) {
        taskData.status = arg;
        continue;
      }
      
      // Check if this is a priority
      if (config.priorityLevels.includes(arg)) {
        taskData.priority = arg;
        continue;
      }
      
      // Check if this is an effort level
      if (config.effortEstimation.includes(arg)) {
        taskData.effort = arg;
        continue;
      }
      
      // Check if this is a description flag
      if (arg === '--desc' || arg === '--description') {
        // Get the next argument as the description
        if (i + 1 < args.length) {
          taskData.description = args[i + 1];
          i++; // Skip the description value
        }
        continue;
      }
      
      // Check if this is a file flag
      if (arg === '--file' || arg === '-f') {
        // Get the next argument as a file path
        if (i + 1 < args.length) {
          taskData.relatedFiles.push(args[i + 1]);
          i++; // Skip the file path value
        }
        continue;
      }
      
      // If none of the above, treat as additional description/title information
      if (taskData.description) {
        taskData.description += ' ' + arg;
      } else {
        taskData.title += ' ' + arg;
      }
    }
    
    // Now create the task
    try {
      const newTask = taskManager.createTask(taskData);
      
      // Show success message
      output(`✅ Created task #${newTask.id}: [${newTask.category}] ${newTask.title}`, 'success', { globalOptions: options });
      
      // Show file links if any
      if (newTask.relatedFiles && newTask.relatedFiles.length > 0) {
        output(`📎 Linked files: ${newTask.relatedFiles.join(', ')}`, 'info', { globalOptions: options });
      }
      
      // Output JSON if requested
      if (options.json) {
        output(newTask, 'data', { globalOptions: options });
      }
      
      return { success: true, task: newTask };
    } catch (error) {
      output(`❌ Error creating task: ${error.message}`, 'error', { globalOptions: options });
      return { success: false, error: error.message };
    }
  } catch (error) {
    output(`❌ Error creating quick task: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  quickAddTask
}; 