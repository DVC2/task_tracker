/**
 * TaskTracker Add Command
 * 
 * Interactive task creation functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Import dependencies
const { output } = require('../core/formatting');
const configManager = require('../core/config-manager');
const taskManager = require('../core/task-manager');

/**
 * Add a task interactively
 * @param {object} options Command options
 * @returns {object} Result with created task and status
 */
function addTaskInteractive(options = {}) {
  const nonInteractive = options.nonInteractive || false;
  
  try {
    // Get configuration for categories and statuses
    const config = configManager.loadConfig();
    const categories = config.taskCategories.join(', ');
    const statuses = config.taskStatuses.join(', ');
    const priorities = config.priorityLevels.join(', ');
    const efforts = config.effortEstimation.join(', ');
    
    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Non-interactive mode not supported for add command
    if (nonInteractive) {
      rl.close();
      output('❌ Add command requires interactive mode. Use quick command for non-interactive mode.', 'error', { globalOptions: options });
      return { success: false, error: 'Add command requires interactive mode' };
    }
    
    // Create a task template with defaults
    let task = {
      title: '',
      description: '',
      category: 'feature',
      status: 'todo',
      priority: config.priorityLevels[1] || 'p2-medium', // Default to medium priority
      effort: config.effortEstimation[2] || '3-medium',  // Default to medium effort
      relatedFiles: [],
      comments: [],
      checklists: []
    };
    
    // Get username from Git if available
    try {
      task.createdBy = execSync('git config --get user.name').toString().trim();
    } catch (error) {
      task.createdBy = process.env.USER || process.env.USERNAME || 'Unknown';
    }
    
    // Get branch from Git if available
    try {
      task.branch = execSync('git branch --show-current').toString().trim();
    } catch (error) {
      task.branch = 'None';
    }
    
    console.log('\n📝 Interactive Task Creation');
    console.log('---------------------------');
    
    // Wrap callback hell with promises for better readability
    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, (answer) => {
          resolve(answer);
        });
      });
    };
    
    // Start the interactive prompts
    (async () => {
      try {
        // Get title (required)
        const title = await askQuestion(`Title: `);
        if (!title.trim()) {
          rl.close();
          output('❌ Title is required', 'error', { globalOptions: options });
          return { success: false, error: 'Title is required' };
        }
        task.title = title;
        
        // Get description (optional)
        task.description = await askQuestion(`Description (optional): `);
        
        // Get category with validation
        const categoryInput = await askQuestion(`Category [${categories}] (default: feature): `);
        if (categoryInput && !config.taskCategories.includes(categoryInput)) {
          rl.close();
          output(`❌ Invalid category. Valid options: ${categories}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid category: ${categoryInput}` };
        }
        if (categoryInput) {
          task.category = categoryInput;
        }
        
        // Get status with validation
        const statusInput = await askQuestion(`Status [${statuses}] (default: todo): `);
        if (statusInput && !config.taskStatuses.includes(statusInput)) {
          rl.close();
          output(`❌ Invalid status. Valid options: ${statuses}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid status: ${statusInput}` };
        }
        if (statusInput) {
          task.status = statusInput;
        }
        
        // Get priority with validation
        const priorityInput = await askQuestion(`Priority [${priorities}] (default: ${task.priority}): `);
        if (priorityInput && !config.priorityLevels.includes(priorityInput)) {
          rl.close();
          output(`❌ Invalid priority. Valid options: ${priorities}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid priority: ${priorityInput}` };
        }
        if (priorityInput) {
          task.priority = priorityInput;
        }
        
        // Get effort with validation
        const effortInput = await askQuestion(`Effort [${efforts}] (default: ${task.effort}): `);
        if (effortInput && !config.effortEstimation.includes(effortInput)) {
          rl.close();
          output(`❌ Invalid effort. Valid options: ${efforts}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid effort: ${effortInput}` };
        }
        if (effortInput) {
          task.effort = effortInput;
        }
        
        // Get related files
        const filesInput = await askQuestion(`Related files (comma-separated, optional): `);
        if (filesInput.trim()) {
          task.relatedFiles = filesInput.split(',').map(file => file.trim()).filter(Boolean);
        }
        
        // Now create the task using task manager
        try {
          const newTask = taskManager.createTask({
            title: task.title,
            description: task.description,
            category: task.category,
            status: task.status,
            priority: task.priority,
            effort: task.effort,
            createdBy: task.createdBy,
            branch: task.branch,
            relatedFiles: task.relatedFiles,
            comments: task.comments,
            checklists: task.checklists
          });
          
          rl.close();
          
          output(`\n✅ Created task #${newTask.id}: [${newTask.category}] ${newTask.title}`, 'success', { globalOptions: options });
          
          if (newTask.relatedFiles && newTask.relatedFiles.length > 0) {
            output(`📎 Linked files: ${newTask.relatedFiles.join(', ')}`, 'info', { globalOptions: options });
          }
          
          // Output task as JSON if requested
          if (options.json) {
            output(newTask, 'data', { globalOptions: options });
          }
          
          return { success: true, task: newTask };
        } catch (error) {
          rl.close();
          output(`❌ Error creating task: ${error.message}`, 'error', { globalOptions: options });
          return { success: false, error: error.message };
        }
      } catch (error) {
        rl.close();
        output(`❌ Error during interactive task creation: ${error.message}`, 'error', { globalOptions: options });
        return { success: false, error: error.message };
      }
    })();
    
    // For asynchronous code, always return a promise
    return new Promise((resolve) => {
      // We'll resolve this when rl.close() is called, which happens in the async function above
      rl.on('close', () => {
        resolve({ success: true });
      });
    });
  } catch (error) {
    output(`❌ Error creating task: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  addTaskInteractive
}; 