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
    if (!args || args.length === 0) {
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
    
    // Apply any options directly passed from the command line
    if (options.status) {
      taskData.status = options.status;
      console.log(`Set status from command line option: ${options.status}`);
    }

    if (options.category) {
      taskData.category = options.category;
      console.log(`Set category from command line option: ${options.category}`);
    }

    if (options.priority) {
      taskData.priority = options.priority;
      console.log(`Set priority from command line option: ${options.priority}`);
    }

    if (options.effort) {
      taskData.effort = options.effort;
      console.log(`Set effort from command line option: ${options.effort}`);
    }
    
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
      
      console.log(`Processing arg: "${arg}"`);
      
      // Check if this is a category
      if (config.taskCategories.includes(arg)) {
        taskData.category = arg;
        console.log(`Set category to ${arg}`);
        continue;
      }
      
      // Check if this is a status
      if (config.taskStatuses.includes(arg)) {
        taskData.status = arg;
        console.log(`Set status to ${arg}`);
        continue;
      }
      
      // Check if this is a priority
      if (config.priorityLevels.includes(arg)) {
        taskData.priority = arg;
        console.log(`Set priority to ${arg}`);
        continue;
      }
      
      // Check if this is an effort level
      if (config.effortEstimation.includes(arg)) {
        taskData.effort = arg;
        console.log(`Set effort to ${arg}`);
        continue;
      }
      
      // Check if this is a description flag
      if (arg === '--desc' || arg === '--description') {
        // Get the next argument as the description
        if (i + 1 < remainingArgs.length) {
          taskData.description = remainingArgs[i + 1];
          console.log(`Set description to ${remainingArgs[i + 1]}`);
          i++; // Skip the description value
        }
        continue;
      }
      
      // Handle flags with equals
      if (arg.includes('=')) {
        const [key, value] = arg.split('=', 2);
        const flagName = key.replace(/^--/, '');
        
        // Handle specific flags
        if (flagName === 'status') {
          taskData.status = value;
          console.log(`Set status to ${value} (via equals)`);
        } else if (flagName === 'priority') {
          taskData.priority = value;
          console.log(`Set priority to ${value} (via equals)`);
        } else if (flagName === 'category') {
          taskData.category = value;
          console.log(`Set category to ${value} (via equals)`);
        } else if (flagName === 'effort') {
          taskData.effort = value;
          console.log(`Set effort to ${value} (via equals)`);
        } else if (flagName === 'description' || flagName === 'desc') {
          taskData.description = value;
          console.log(`Set description to ${value} (via equals)`);
        }
        continue;
      }
      
      // Check regular flags that take a value
      if (arg.startsWith('--')) {
        const flagName = arg.replace(/^--/, '');
        
        // Handle specific flags with next argument as value
        if ((flagName === 'status' || flagName === 'priority' || 
             flagName === 'category' || flagName === 'effort') && 
            i + 1 < remainingArgs.length) {
          
          const value = remainingArgs[i + 1];
          if (flagName === 'status') {
            taskData.status = value;
            console.log(`Set status to ${value} (via flag)`);
          } else if (flagName === 'priority') {
            taskData.priority = value;
            console.log(`Set priority to ${value} (via flag)`);
          } else if (flagName === 'category') {
            taskData.category = value;
            console.log(`Set category to ${value} (via flag)`);
          } else if (flagName === 'effort') {
            taskData.effort = value;
            console.log(`Set effort to ${value} (via flag)`);
          }
          
          i++; // Skip the value
          continue;
        }
      }
      
      // Check if this is a file flag
      if (arg === '--file' || arg === '-f') {
        // Get the next argument as a file path
        if (i + 1 < remainingArgs.length) {
          taskData.relatedFiles.push(remainingArgs[i + 1]);
          console.log(`Added file ${remainingArgs[i + 1]}`);
          i++; // Skip the file path value
        }
        continue;
      }
      
      // If none of the above, treat as additional description information
      if (taskData.description) {
        taskData.description += ' ' + arg;
        console.log(`Appended to description: ${arg}`);
      }
    }
    
    // Now create the task
    try {
      const newTask = taskManager.createTask(taskData);
      
      // Handle JSON output
      if (options.json) {
        const result = {
          success: true,
          data: {
            task: newTask,
            message: `Created task #${newTask.id}: [${newTask.category}] ${newTask.title}`
          }
        };
        output(JSON.stringify(result, null, 2), 'data', { globalOptions: options });
        return { success: true, task: newTask };
      }
      
      // Show success message for normal output
      output(`✅ Created task #${newTask.id}: [${newTask.category}] ${newTask.title}`, 'success', { globalOptions: options });
      
      // Show file links if any
      if (newTask.relatedFiles && newTask.relatedFiles.length > 0) {
        output(`📎 Linked files: ${newTask.relatedFiles.join(', ')}`, 'info', { globalOptions: options });
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