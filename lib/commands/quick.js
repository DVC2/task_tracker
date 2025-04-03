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
    // Fix: Process the title argument properly - if it has quotes, use it directly
    // If not, join all non-flag arguments until a known flag or category is found
    const allArgs = [...args]; // Clone to avoid modifying original args
    let title = allArgs[0];
    let remainingArgs = allArgs.slice(1);
    
    // Get configuration for validation
    const config = configManager.loadConfig();
    
    // Fix: Check for category/status flags to help determine title boundaries
    const flagKeywords = [
      '--desc', '--description', '--file', '-f', '--priority', '--effort',
      ...config.taskCategories, ...config.taskStatuses, 
      ...config.priorityLevels, ...config.effortEstimation
    ];
    
    // If title doesn't start with a quote, collect words until we hit a known flag
    if (!title.startsWith('"') && !title.endsWith('"')) {
      let titleParts = [title];
      let i = 0;
      
      // Keep adding words to title until we hit a known flag/category/status
      while (i < remainingArgs.length && !flagKeywords.includes(remainingArgs[i])) {
        titleParts.push(remainingArgs[i]);
        i++;
      }
      
      // Update title and remaining arguments
      title = titleParts.join(' ');
      remainingArgs = remainingArgs.slice(titleParts.length - 1);
    } else {
      // Remove quotes if present
      title = title.replace(/^"|"$/g, '');
    }
    
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
    
    // Process additional arguments from the remaining arguments
    for (let i = 0; i < remainingArgs.length; i++) {
      const arg = remainingArgs[i];
      
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
        if (i + 1 < remainingArgs.length) {
          taskData.description = remainingArgs[i + 1];
          i++; // Skip the description value
        }
        continue;
      }
      
      // Handle priority flag with equals
      if (arg.startsWith('--priority=')) {
        taskData.priority = arg.split('=')[1];
        continue;
      }
      
      // Check if this is a file flag
      if (arg === '--file' || arg === '-f') {
        // Get the next argument as a file path
        if (i + 1 < remainingArgs.length) {
          taskData.relatedFiles.push(remainingArgs[i + 1]);
          i++; // Skip the file path value
        }
        continue;
      }
      
      // If none of the above, treat as additional description information
      if (taskData.description) {
        taskData.description += ' ' + arg;
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