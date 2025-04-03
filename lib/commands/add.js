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
const { output, reliableChalk } = require('../core/formatting');
const configManager = require('../core/config-manager');
const taskManager = require('../core/task-manager');

/**
 * Display a numbered menu for option selection
 * @param {Array} options Array of options to display
 * @param {string} defaultOption Default option to highlight
 * @returns {string} Display string of numbered options
 */
function displayNumberedMenu(options, defaultOption) {
  let display = '';
  options.forEach((option, index) => {
    const isDefault = option === defaultOption;
    const optionDisplay = isDefault ? 
      reliableChalk.green(`${index + 1}. ${option} (default)`) : 
      `${index + 1}. ${option}`;
    display += (index > 0 ? ', ' : '') + optionDisplay;
  });
  return display;
}

/**
 * Get selection from a numbered menu
 * @param {Array} options Array of available options
 * @param {string} defaultOption Default option to use if input is empty
 * @param {string} input User input
 * @returns {string} Selected option or default
 */
function getSelectionFromNumberedMenu(options, defaultOption, input) {
  if (!input || input.trim() === '') {
    return defaultOption;
  }

  // If the input is a number, use it as an index (1-based)
  const numInput = parseInt(input, 10);
  if (!isNaN(numInput) && numInput >= 1 && numInput <= options.length) {
    return options[numInput - 1];
  }

  // If the input matches one of the options directly, use that
  if (options.includes(input)) {
    return input;
  }

  // If the input is the beginning of one option, use that (for auto-complete)
  const matchingOption = options.find(opt => 
    opt.toLowerCase().startsWith(input.toLowerCase())
  );
  
  if (matchingOption) {
    return matchingOption;
  }

  // If no match found, return the input as is (validation happens later)
  return input;
}

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
    const categories = config.taskCategories;
    const statuses = config.taskStatuses;
    const priorities = config.priorityLevels;
    const efforts = config.effortEstimation;
    
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
        
        // Get category with numbered selection
        const categoryMenu = displayNumberedMenu(categories, task.category);
        console.log(`Category options: ${categoryMenu}`);
        const categoryInput = await askQuestion(`Category (number or name): `);
        const selectedCategory = getSelectionFromNumberedMenu(categories, task.category, categoryInput);
        
        if (!categories.includes(selectedCategory)) {
          rl.close();
          output(`❌ Invalid category. Valid options: ${categories.join(', ')}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid category: ${selectedCategory}` };
        }
        task.category = selectedCategory;
        
        // Get status with numbered selection
        const statusMenu = displayNumberedMenu(statuses, task.status);
        console.log(`Status options: ${statusMenu}`);
        const statusInput = await askQuestion(`Status (number or name): `);
        const selectedStatus = getSelectionFromNumberedMenu(statuses, task.status, statusInput);
        
        if (!statuses.includes(selectedStatus)) {
          rl.close();
          output(`❌ Invalid status. Valid options: ${statuses.join(', ')}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid status: ${selectedStatus}` };
        }
        task.status = selectedStatus;
        
        // Get priority with numbered selection
        const priorityMenu = displayNumberedMenu(priorities, task.priority);
        console.log(`Priority options: ${priorityMenu}`);
        const priorityInput = await askQuestion(`Priority (number or name): `);
        const selectedPriority = getSelectionFromNumberedMenu(priorities, task.priority, priorityInput);
        
        if (!priorities.includes(selectedPriority)) {
          rl.close();
          output(`❌ Invalid priority. Valid options: ${priorities.join(', ')}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid priority: ${selectedPriority}` };
        }
        task.priority = selectedPriority;
        
        // Get effort with numbered selection
        const effortMenu = displayNumberedMenu(efforts, task.effort);
        console.log(`Effort options: ${effortMenu}`);
        const effortInput = await askQuestion(`Effort (number or name): `);
        const selectedEffort = getSelectionFromNumberedMenu(efforts, task.effort, effortInput);
        
        if (!efforts.includes(selectedEffort)) {
          rl.close();
          output(`❌ Invalid effort. Valid options: ${efforts.join(', ')}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid effort: ${selectedEffort}` };
        }
        task.effort = selectedEffort;
        
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
  addTaskInteractive,
  displayNumberedMenu,
  getSelectionFromNumberedMenu
}; 