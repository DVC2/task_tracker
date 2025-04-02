/**
 * TaskTracker Stats Command
 * 
 * Displays statistics for tasks in the project
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output, formatCategory, getStatusEmoji } = require('../core/formatting');
const configManager = require('../core/config-manager');
const taskManager = require('../core/task-manager');

// Data paths (will be initialized if needed)
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
 * Show task statistics for the project
 * @param {object} options Options for displaying statistics
 * @returns {object} Result with statistics data
 */
function showTaskStats(options = {}) {
  try {
    if (!fs.existsSync(TASKS_PATH)) {
      output('❌ No tasks found. Initialize TaskTracker first: tasktracker init', 'error', { globalOptions: options });
      return { success: false, error: 'Tasks not initialized' };
    }
    
    // Load tasks - we use direct file access here to keep the stats command independent
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const tasks = tasksData.tasks;
    
    if (tasks.length === 0) {
      output('📊 Task Statistics: No tasks found', 'info', { globalOptions: options });
      output('Run `tt quick "Your first task" feature` to create your first task.', 'info', { globalOptions: options });
      return { success: true, stats: { totalTasks: 0 } };
    }
    
    // Calculate statistics
    const totalTasks = tasks.length;
    const statusCounts = {};
    const categoryCounts = {};
    let completionRate = 0;
    
    // Get config for valid statuses and categories
    const config = configManager.loadConfig();
    
    // Initialize counts with zeros for all possible values
    config.taskStatuses.forEach(status => {
      statusCounts[status] = 0;
    });
    
    config.taskCategories.forEach(category => {
      categoryCounts[category] = 0;
    });
    
    // Count tasks by status and category
    tasks.forEach(task => {
      // Count by status
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      } else {
        statusCounts[task.status] = 1;
      }
      
      // Count by category
      if (categoryCounts[task.category] !== undefined) {
        categoryCounts[task.category]++;
      } else {
        categoryCounts[task.category] = 1;
      }
    });
    
    // Calculate completion rate
    const completedTasks = statusCounts['done'] || 0;
    completionRate = (completedTasks / totalTasks) * 100;
    
    // Create statistics object to return
    const statistics = {
      totalTasks,
      completionRate: completionRate.toFixed(1),
      statusCounts,
      categoryCounts
    };
    
    // JSON output if requested
    if (options.json) {
      output(statistics, 'data', { globalOptions: options });
      return { success: true, stats: statistics };
    }
    
    // Display statistics
    output('\n📊 Task Statistics Summary:', 'info', { globalOptions: options });
    output('------------------------', 'info', { globalOptions: options });
    output(`Total Tasks: ${totalTasks}`, 'info', { globalOptions: options });
    output(`Completion Rate: ${completionRate.toFixed(1)}%`, 'info', { globalOptions: options });
    
    // Status breakdown
    output('\nTasks by Status:', 'info', { globalOptions: options });
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        const statusEmoji = getStatusEmoji(status);
        const percentage = ((count / totalTasks) * 100).toFixed(1);
        output(`  ${statusEmoji} ${status}: ${count} (${percentage}%)`, 'info', { globalOptions: options });
      }
    });
    
    // Category breakdown
    output('\nTasks by Category:', 'info', { globalOptions: options });
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > 0) {
        const percentage = ((count / totalTasks) * 100).toFixed(1);
        output(`  ${formatCategory(category)}: ${count} (${percentage}%)`, 'info', { globalOptions: options });
      }
    });
    
    // Add a reminder for more detailed stats
    output('\nFor more detailed statistics, run: `tt snapshot`', 'info', { globalOptions: options });
    
    return { success: true, stats: statistics };
  } catch (error) {
    output(`❌ Error showing task statistics: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initPaths,
  showTaskStats
}; 