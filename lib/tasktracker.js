#!/usr/bin/env node

/**
 * TaskTracker - Unified Command Line Interface
 * 
 * A lightweight task management system for developers.
 * This script provides a single entry point to all TaskTracker functionality.
 * 
 * Usage: ./tasktracker <command> [options]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');
const chalk = require('chalk');

// Handle potential chalk compatibility issues
let chalkEnabled = true;
try {
  // Test chalk functionality
  chalk.green('test');
} catch (error) {
  console.warn('⚠️ Chalk library disabled due to compatibility issues. Using plain text output.');
  chalkEnabled = false;
}

// Constants
const TASKTRACKER_DIR = '.tasktracker';
const CONFIG_PATH = path.join(TASKTRACKER_DIR, 'config.json');
const TASKS_PATH = path.join(TASKTRACKER_DIR, 'tasks.json');
const FILE_HASHES_PATH = path.join(TASKTRACKER_DIR, 'file_hashes.json');
const SNAPSHOTS_PATH = path.join(TASKTRACKER_DIR, 'snapshots.json');
const REPORTS_DIR = path.join(TASKTRACKER_DIR, 'reports');
const STATS_DIR = path.join(TASKTRACKER_DIR, 'stats');

// Available commands and their scripts
const COMMANDS = {
  // Core task management
  'init': { script: 'tasktracker.js', description: 'Initialize TaskTracker in the current directory' },
  'add': { script: 'tasktracker.js', description: 'Add a new task (interactive)' },
  'quick': { script: 'quick-task.js', description: 'Quickly add a task (non-interactive)' },
  'update': { script: 'tasktracker.js', description: 'Update an existing task' },
  'list': { script: 'tasktracker.js', description: 'List all tasks' },
  'view': { script: 'tasktracker.js', description: 'View details of a specific task' },
  'import': { script: 'tasktracker.js', description: 'Import multiple tasks from a file' },
  'changes': { script: 'tasktracker.js', description: 'Track file changes' },
  'release': { script: 'tasktracker.js', description: 'Create a new release' },
  'ai-context': { script: 'tasktracker.js', description: 'Generate AI-friendly context from tasks' },
  'code-health': { script: 'tasktracker.js', description: 'Analyze code health metrics for technical debt' },
  'onboard': { script: 'tasktracker.js', description: 'Interactive onboarding process for new users' },
  
  // Statistics and reporting
  'snapshot': { script: 'stats-tracker.js', description: 'Take a snapshot of the current project state' },
  'report': { script: 'stats-tracker.js', description: 'Generate a report (text, html, json)' },
  'compare': { script: 'stats-tracker.js', description: 'Compare with a previous snapshot' },
  'trends': { script: 'stats-tracker.js', description: 'Show task completion trends' },
  
  // Setup and utilities
  'setup': { script: 'install.js', description: 'Set up TaskTracker in a project' },
  'automate': { script: 'auto-tracker.sh', description: 'Set up Git hooks and automation', shell: true },
  'help': { description: 'Show help information' }
};

// Find the script directory
const scriptDir = __dirname;

// Process command line arguments
const args = process.argv.slice(2);
const command = args[0];
const commandArgs = args.slice(1);

// Show help if no command is provided
if (!command || command === 'help') {
  showHelp();
  process.exit(0);
}

// Handle init command directly in this script
if (command === 'init') {
  initializeTaskTracker();
  process.exit(0);
}

// Handle add command directly in this script
if (command === 'add') {
  addTaskInteractive();
  process.exit(0);
}

// Handle list command directly in this script
if (command === 'list') {
  try {
    const statusFilter = commandArgs[0] !== '--current' && commandArgs[0] !== '--full' ? commandArgs[0] : null;
    const showCurrentOnly = commandArgs.includes('--current');
    const showFull = commandArgs.includes('--full');
    listTasks(statusFilter, showCurrentOnly, showFull);
    process.exit(0);
  } catch (error) {
    console.error(colorize(`❌ Error listing tasks: ${error.message}`, 'error'));
    process.exit(1);
  }
}

// Handle view command directly in this script
if (command === 'view') {
  viewTask(commandArgs[0]); // Task ID
  process.exit(0);
}

// Handle update command directly in this script
if (command === 'update') {
  updateTask(commandArgs[0], commandArgs[1], commandArgs.slice(2)); // Task ID, field, values
  process.exit(0);
}

// Handle changes command directly in this script
if (command === 'changes') {
  trackChanges(commandArgs[0]); // Optional path filter
  process.exit(0);
}

// Handle import command directly in this script
if (command === 'import') {
  importTasks(commandArgs[0]); // File path
  process.exit(0);
}

// Handle release command directly in this script
if (command === 'release') {
  createRelease(commandArgs[0]); // Version override (optional)
  process.exit(0);
}

// Handle ai-context command directly in this script
if (command === 'ai-context') {
  generateAIContext(commandArgs[0]); // Task ID (optional)
  process.exit(0);
}

// Handle code-health command directly in this script
if (command === 'code-health') {
  analyzeCodeHealth(commandArgs[0]); // Path (optional)
  process.exit(0);
}

// Handle onboard command directly in this script
if (command === 'onboard') {
  runOnboarding();
  process.exit(0);
}

// Handle snapshot command directly in this script
if (command === 'snapshot') {
  takeSnapshot(commandArgs[0]); // Output format (optional)
  process.exit(0);
}

// Special case for quick task (pass all arguments)
if (command === 'quick') {
  const quickTaskPath = path.join(scriptDir, 'quick-task.js');
  if (fs.existsSync(quickTaskPath)) {
    const result = spawnSync('node', [quickTaskPath, ...commandArgs], { stdio: 'inherit' });
    process.exit(result.status);
  } else {
    console.error('❌ quick-task.js not found!');
    process.exit(1);
  }
}

// Execute the appropriate script for the command
if (COMMANDS[command]) {
  const cmd = COMMANDS[command];
  
  if (cmd.shell) {
    // Execute shell command
    const scriptPath = path.join(scriptDir, cmd.script);
    if (fs.existsSync(scriptPath)) {
      try {
        execSync(`bash ${scriptPath} ${commandArgs.join(' ')}`, { stdio: 'inherit' });
      } catch (error) {
        process.exit(1);
      }
    } else {
      console.error(`❌ ${cmd.script} not found!`);
      process.exit(1);
    }
  } else {
    // Execute Node.js script
    const scriptPath = path.join(scriptDir, cmd.script);
    if (fs.existsSync(scriptPath)) {
      // For commands that use the original scripts, translate the command
      let scriptCommand = command;
      if (cmd.script === 'tasktracker.js' && command !== 'init') {
        // Use the command as-is for tasktracker.js
      } else if (cmd.script === 'stats-tracker.js') {
        // For stats commands, the command becomes the first argument
        commandArgs.unshift(command);
        scriptCommand = '';
      }
      
      const cmdArgs = [scriptPath, scriptCommand, ...commandArgs].filter(Boolean);
      const result = spawnSync('node', cmdArgs, { stdio: 'inherit' });
      process.exit(result.status);
    } else {
      console.error(`❌ ${cmd.script} not found!`);
      process.exit(1);
    }
  }
} else {
  console.error(`❌ Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}

// Initialize TaskTracker in the current directory
function initializeTaskTracker() {
  console.log('📦 Initializing TaskTracker...');

  // Create main directory if it doesn't exist
  if (!fs.existsSync(TASKTRACKER_DIR)) {
    fs.mkdirSync(TASKTRACKER_DIR);
    console.log(`✅ Created ${TASKTRACKER_DIR} directory`);
  }

  // Create subdirectories
  [REPORTS_DIR, STATS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created ${dir} directory`);
    }
  });
  
  // Check Git availability
  let gitAvailable = false;
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    gitAvailable = true;
    console.log('✅ Git repository detected');
  } catch (error) {
    console.log('ℹ️ Not a Git repository. Some Git-dependent features will be limited.');
    console.log('ℹ️ TaskTracker will use file-based tracking instead of Git integration.');
  }
  
  // Auto-detect project type
  const projectType = detectProjectType();
  console.log(`🔍 Detected project type: ${projectType.type}`);

  // Create config file if it doesn't exist
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = {
      projectName: path.basename(process.cwd()),
      projectType: projectType.type,
      versioningType: 'semver',
      currentVersion: '0.1.0',
      taskCategories: ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore', 'technical-debt'],
      taskStatuses: ['todo', 'in-progress', 'review', 'done'],
      priorityLevels: ['p0-critical', 'p1-high', 'p2-medium', 'p3-low'],
      effortEstimation: ['1-trivial', '2-small', '3-medium', '5-large', '8-xlarge', '13-complex'],
      changelogSections: ['Added', 'Changed', 'Fixed', 'Deprecated', 'Removed', 'Security'],
      gitIntegration: gitAvailable
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    console.log(`✅ Created default ${CONFIG_PATH}`);
  } else {
    // Update existing config with Git availability
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (config.gitIntegration !== gitAvailable) {
        config.gitIntegration = gitAvailable;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log(`✅ Updated Git integration setting in config`);
      }
    } catch (error) {
      console.error(`⚠️ Error updating config: ${error.message}`);
    }
  }

  // Create tasks file if it doesn't exist
  if (!fs.existsSync(TASKS_PATH)) {
    const emptyTasks = {
      lastId: 0,
      tasks: []
    };

    fs.writeFileSync(TASKS_PATH, JSON.stringify(emptyTasks, null, 2));
    console.log(`✅ Created empty ${TASKS_PATH}`);
  }

  // Create file hashes file if it doesn't exist
  if (!fs.existsSync(FILE_HASHES_PATH)) {
    fs.writeFileSync(FILE_HASHES_PATH, JSON.stringify({}, null, 2));
    console.log(`✅ Created empty ${FILE_HASHES_PATH}`);
  }

  // Create snapshots file if it doesn't exist
  if (!fs.existsSync(SNAPSHOTS_PATH)) {
    fs.writeFileSync(SNAPSHOTS_PATH, JSON.stringify([], null, 2));
    console.log(`✅ Created empty ${SNAPSHOTS_PATH}`);
  }

  console.log('\n🎉 TaskTracker initialized successfully!');
  console.log('\nQuick Start:');
  console.log('  ./bin/tasktracker add         Create a new task');
  console.log('  ./bin/tasktracker list        List all tasks');
  console.log('  ./bin/tasktracker update      Update a task status');
  
  if (!gitAvailable) {
    console.log('\nNote: Since this is not a Git repository, TaskTracker will:');
    console.log('  • Use file timestamp tracking instead of Git for change detection');
    console.log('  • Display "Unknown" for username and branch information');
    console.log('  • Skip Git-specific features like tagging releases');
    console.log('\nThese limitations will not affect your ability to track tasks.');
  }
}

// Add a task interactively
function addTaskInteractive() {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
    process.exit(1);
  }

  try {
    // Load config to get valid categories and statuses
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const categories = config.taskCategories.join(', ');
    const statuses = config.taskStatuses.join(', ');
    
    // Simple readline-based interactive prompt
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n📝 Interactive Task Creation');
    console.log('---------------------------');
    
    let task = {
      title: '',
      description: '',
      category: 'feature',
      status: 'todo',
      priority: 'p2-medium',
      effort: '3-medium',
      relatedFiles: [],
      comments: []
    };
    
    // Get username from Git if available
    try {
      task.createdBy = execSync('git config --get user.name').toString().trim();
    } catch (error) {
      task.createdBy = 'Unknown';
    }
    
    // Get branch from Git if available
    try {
      task.branch = execSync('git branch --show-current').toString().trim();
    } catch (error) {
      task.branch = 'Unknown';
    }
    
    // Collect task information
    rl.question(`Title: `, (title) => {
      if (!title.trim()) {
        console.error('❌ Title is required');
        rl.close();
        process.exit(1);
      }
      
      task.title = title;
      
      rl.question(`Description (optional): `, (description) => {
        task.description = description;
        
        rl.question(`Category [${categories}] (default: feature): `, (category) => {
          if (category && !config.taskCategories.includes(category)) {
            console.error(`❌ Invalid category. Valid options: ${categories}`);
            rl.close();
            process.exit(1);
          }
          
          if (category) {
            task.category = category;
          }
          
          rl.question(`Status [${statuses}] (default: todo): `, (status) => {
            if (status && !config.taskStatuses.includes(status)) {
              console.error(`❌ Invalid status. Valid options: ${statuses}`);
              rl.close();
              process.exit(1);
            }
            
            if (status) {
              task.status = status;
            }
            
            const priorities = config.priorityLevels.join(', ');
            rl.question(`Priority [${priorities}] (default: p2-medium): `, (priority) => {
              if (priority && !config.priorityLevels.includes(priority)) {
                console.error(`❌ Invalid priority. Valid options: ${priorities}`);
                rl.close();
                process.exit(1);
              }
              
              if (priority) {
                task.priority = priority;
              }
              
              const efforts = config.effortEstimation.join(', ');
              rl.question(`Effort [${efforts}] (default: 3-medium): `, (effort) => {
                if (effort && !config.effortEstimation.includes(effort)) {
                  console.error(`❌ Invalid effort. Valid options: ${efforts}`);
                  rl.close();
                  process.exit(1);
                }
                
                if (effort) {
                  task.effort = effort;
                }
                
                rl.question(`Related files (comma-separated, optional): `, (files) => {
                  if (files.trim()) {
                    task.relatedFiles = files.split(',').map(file => file.trim());
                  }
                  
                  // Save the task
                  const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
                  
                  const newTask = {
                    id: taskData.lastId + 1,
                    title: task.title,
                    description: task.description,
                    category: task.category,
                    status: task.status,
                    priority: task.priority,
                    effort: task.effort,
                    created: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    createdBy: task.createdBy,
                    branch: task.branch,
                    relatedFiles: task.relatedFiles,
                    comments: task.comments,
                    checklists: []
                  };
                  
                  taskData.tasks.push(newTask);
                  taskData.lastId = newTask.id;
                  
                  fs.writeFileSync(TASKS_PATH, JSON.stringify(taskData, null, 2));
                  
                  console.log(`\n✅ Created task #${newTask.id}: [${newTask.category}] ${newTask.title}`);
                  
                  if (newTask.relatedFiles.length > 0) {
                    console.log(`📎 Linked files: ${newTask.relatedFiles.join(', ')}`);
                  }
                  
                  rl.close();
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ Error creating task:', error.message);
    process.exit(1);
  }
}

// Color formatting with error handling
function colorize(text, type, category) {
  // If chalk is disabled, return plain text with simple formatting
  if (!chalkEnabled) {
    // Simple fallback for terminal styling without chalk
    switch (type) {
      case 'status':
        return text.toUpperCase();
      case 'category':
        return `[${text}]`;
      case 'priority':
        return `P:${text}`;
      case 'effort':
        return `E:${text}`;
      case 'id': 
        return `#${text}`;
      default:
        return text;
    }
  }

  // Use chalk when available
  try {
    // Status coloring
    if (type === 'status') {
      if (text === 'todo') return chalk.yellow(text);
      if (text === 'in-progress') return chalk.blue(text);
      if (text === 'review') return chalk.magenta(text);
      if (text === 'done') return chalk.green(text);
      return chalk.white(text);
    }
    // Category coloring
    else if (type === 'category') {
      if (category === 'feature') return chalk.green(text);
      if (category === 'bugfix') return chalk.red(text);
      if (category === 'refactor') return chalk.cyan(text);
      if (category === 'docs') return chalk.yellow(text);
      if (category === 'test') return chalk.blue(text);
      if (category === 'technical-debt') return chalk.bgRed.white(text);
      if (category === 'chore') return chalk.gray(text);
      return chalk.white(text);
    }
    // Priority coloring
    else if (type === 'priority') {
      if (text.startsWith('p0')) return chalk.bgRed.white(text);
      if (text.startsWith('p1')) return chalk.red(text);
      if (text.startsWith('p2')) return chalk.yellow(text);
      if (text.startsWith('p3')) return chalk.green(text);
      return chalk.white(text);
    }
    // Effort coloring
    else if (type === 'effort') {
      if (text.startsWith('1')) return chalk.green(text);
      if (text.startsWith('3')) return chalk.yellow(text);
      if (text.startsWith('5')) return chalk.red(text);
      return chalk.white(text);
    }
    else if (type === 'title') {
      return chalk.bold(chalk.cyan(text));
    }
    else if (type === 'date') {
      return chalk.white(text);
    }
    else if (type === 'heading') {
      return chalk.bold(chalk.white(text));
    }
    else if (type === 'success') {
      return chalk.green(text);
    }
    else if (type === 'error') {
      return chalk.red(text);
    }
    else if (type === 'warning') {
      return chalk.yellow(text);
    }
    else if (type === 'info') {
      return chalk.blue(text);
    }
    
    // Fallback in case of chalk errors
    return text;
  } catch (error) {
    // If chalk fails, return plain text
    return text;
  }
}

// List tasks, optionally filtered by status
function listTasks(statusFilter, showCurrentOnly = false, showFull = false) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    console.error(colorize('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init', 'error'));
    process.exit(1);
  }

  try {
    // Load tasks
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    if (taskData.tasks.length === 0) {
      console.log(colorize('📋 No tasks found. Create a task with "./bin/tasktracker add" or "./bin/tasktracker quick"', 'info'));
      return;
    }

    // Filter tasks if a status is provided
    let tasks = statusFilter && statusFilter !== '--current'
      ? taskData.tasks.filter(task => task.status === statusFilter)
      : taskData.tasks;
    
    // If showCurrentOnly is true, only show in-progress tasks or first todo task
    if (showCurrentOnly) {
      const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
      if (inProgressTasks.length > 0) {
        // Show the first in-progress task
        const currentTask = inProgressTasks[0];
        console.log(`${currentTask.id}: [${currentTask.status}] ${currentTask.title}`);
        return;
      } else {
        // If no in-progress tasks, show the first todo task
        const todoTasks = tasks.filter(task => task.status === 'todo');
        if (todoTasks.length > 0) {
          const nextTask = todoTasks[0];
          console.log(`${nextTask.id}: [${nextTask.status}] ${nextTask.title}`);
          return;
        } else {
          console.log('No current task');
          return;
        }
      }
    }
    
    if (tasks.length === 0) {
      console.log(colorize(`📋 No tasks with status "${statusFilter}" found.`, 'warning'));
      return;
    }

    // Column widths for better formatting
    const COL_ID_WIDTH = 4;
    const COL_STATUS_WIDTH = 12;
    const COL_TITLE_WIDTH = showFull ? 25 : 39;
    const COL_CATEGORY_WIDTH = 14;
    const COL_PRIORITY_WIDTH = 12;
    const COL_EFFORT_WIDTH = 10;
    
    // Calculate total width
    const TABLE_WIDTH = showFull 
      ? COL_ID_WIDTH + COL_STATUS_WIDTH + COL_TITLE_WIDTH + COL_CATEGORY_WIDTH + COL_PRIORITY_WIDTH + COL_EFFORT_WIDTH + 13 // +13 for separators
      : COL_ID_WIDTH + COL_STATUS_WIDTH + COL_TITLE_WIDTH + COL_CATEGORY_WIDTH + 7; // +7 for separators
    
    // Format string with correct spacing
    const formatCol = (text, width, align = 'left') => {
      try {
        text = String(text);
        if (align === 'right') {
          return text.padStart(width);
        }
        return text.padEnd(width);
      } catch (error) {
        // Fallback for formatting errors
        console.error(`Warning: Column formatting error: ${error.message}`);
        return String(text);
      }
    };
    
    // Create horizontal line
    let hLine, hLineMiddle, hLineBottom;
    
    if (showFull) {
      hLine = chalk.dim(`┌${'─'.repeat(COL_ID_WIDTH)}┬${'─'.repeat(COL_STATUS_WIDTH)}┬${'─'.repeat(COL_TITLE_WIDTH)}┬${'─'.repeat(COL_CATEGORY_WIDTH)}┬${'─'.repeat(COL_PRIORITY_WIDTH)}┬${'─'.repeat(COL_EFFORT_WIDTH)}┐`);
      hLineMiddle = chalk.dim(`├${'─'.repeat(COL_ID_WIDTH)}┼${'─'.repeat(COL_STATUS_WIDTH)}┼${'─'.repeat(COL_TITLE_WIDTH)}┼${'─'.repeat(COL_CATEGORY_WIDTH)}┼${'─'.repeat(COL_PRIORITY_WIDTH)}┼${'─'.repeat(COL_EFFORT_WIDTH)}┤`);
      hLineBottom = chalk.dim(`└${'─'.repeat(COL_ID_WIDTH)}┴${'─'.repeat(COL_STATUS_WIDTH)}┴${'─'.repeat(COL_TITLE_WIDTH)}┴${'─'.repeat(COL_CATEGORY_WIDTH)}┴${'─'.repeat(COL_PRIORITY_WIDTH)}┴${'─'.repeat(COL_EFFORT_WIDTH)}┘`);
    } else {
      hLine = chalk.dim(`┌${'─'.repeat(COL_ID_WIDTH)}┬${'─'.repeat(COL_STATUS_WIDTH)}┬${'─'.repeat(COL_TITLE_WIDTH)}┬${'─'.repeat(COL_CATEGORY_WIDTH)}┐`);
      hLineMiddle = chalk.dim(`├${'─'.repeat(COL_ID_WIDTH)}┼${'─'.repeat(COL_STATUS_WIDTH)}┼${'─'.repeat(COL_TITLE_WIDTH)}┼${'─'.repeat(COL_CATEGORY_WIDTH)}┤`);
      hLineBottom = chalk.dim(`└${'─'.repeat(COL_ID_WIDTH)}┴${'─'.repeat(COL_STATUS_WIDTH)}┴${'─'.repeat(COL_TITLE_WIDTH)}┴${'─'.repeat(COL_CATEGORY_WIDTH)}┘`);
    }
    
    // Format row data
    const formatRow = (id, status, title, category, priority = '', effort = '') => {
      try {
        let truncatedTitle = title;
        if (title.length > COL_TITLE_WIDTH) {
          truncatedTitle = title.substring(0, COL_TITLE_WIDTH - 3) + '...';
        }
        
        const coloredId = colorize(id, 'id');
        const coloredStatus = colorize(status, 'status');
        const coloredTitle = colorize(truncatedTitle, 'title');
        const coloredCategory = colorize(category, 'category');
        const coloredPriority = priority ? colorize(priority, 'priority') : '';
        const coloredEffort = effort ? colorize(effort, 'effort') : '';
        
        if (!showFull) {
          return chalk.dim(`│ `) + formatCol(coloredId, COL_ID_WIDTH - 1) + 
                chalk.dim(` │ `) + formatCol(coloredStatus, COL_STATUS_WIDTH - 1) + 
                chalk.dim(` │ `) + formatCol(coloredTitle, COL_TITLE_WIDTH - 1) + 
                chalk.dim(` │ `) + formatCol(coloredCategory, COL_CATEGORY_WIDTH - 1) + 
                chalk.dim(` │`);
        }
        
        return chalk.dim(`│ `) + formatCol(coloredId, COL_ID_WIDTH - 1) + 
              chalk.dim(` │ `) + formatCol(coloredStatus, COL_STATUS_WIDTH - 1) + 
              chalk.dim(` │ `) + formatCol(coloredTitle, COL_TITLE_WIDTH - 1) + 
              chalk.dim(` │ `) + formatCol(coloredCategory, COL_CATEGORY_WIDTH - 1) + 
              chalk.dim(` │ `) + formatCol(coloredPriority, COL_PRIORITY_WIDTH - 1) + 
              chalk.dim(` │ `) + formatCol(coloredEffort, COL_EFFORT_WIDTH - 1) + 
              chalk.dim(` │`);
      } catch (error) {
        // Fallback for formatting errors
        console.error(`Warning: Row formatting error: ${error.message}`);
        return `│ ${id} │ ${status} │ ${title} │ ${category} │ ${priority} │ ${effort} │`;
      }
    };
    
    // Display tasks in a table format
    console.log('\n' + colorize('📋 Task List:', 'header'));
    
    try {
      console.log(hLine);
      if (showFull) {
        console.log(formatRow(colorize('ID', 'header'), colorize('Status', 'header'), colorize('Title', 'header'), colorize('Category', 'header'), colorize('Priority', 'header'), colorize('Effort', 'header')));
      } else {
        console.log(formatRow(colorize('ID', 'header'), colorize('Status', 'header'), colorize('Title', 'header'), colorize('Category', 'header')));
      }
      console.log(hLineMiddle);
      
      tasks.forEach(task => {
        console.log(formatRow(
          task.id, 
          task.status, 
          task.title, 
          task.category,
          task.priority,
          task.effort
        ));
      });
      
      console.log(hLineBottom);
      console.log(colorize(`Total: ${tasks.length} tasks${statusFilter ? ` with status "${statusFilter}"` : ''}`, 'info'));
    } catch (error) {
      // Fallback to simpler table if fancy formatting fails
      console.error(`Warning: Table formatting error: ${error.message}`);
      console.log('ID | Status      | Title                             | Category');
      console.log('---+-------------+-----------------------------------+------------');
      
      tasks.forEach(task => {
        const truncatedTitle = task.title.length > 35 
          ? task.title.substring(0, 32) + '...' 
          : task.title.padEnd(35);
        console.log(`${String(task.id).padEnd(3)}| ${task.status.padEnd(12)}| ${truncatedTitle}| ${task.category}`);
      });
      
      console.log(`\nTotal: ${tasks.length} tasks${statusFilter ? ` with status "${statusFilter}"` : ''}`);
    }
    
  } catch (error) {
    console.error(colorize('❌ Error listing tasks: ' + error.message, 'error'));
    process.exit(1);
  }
}

// View details of a specific task
function viewTask(taskId) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
    process.exit(1);
  }

  // Validate task ID
  if (!taskId) {
    console.error('❌ Missing task ID. Usage: ./bin/tasktracker view <id>');
    process.exit(1);
  }

  try {
    // Load tasks
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const task = taskData.tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      console.error(`❌ Task with ID ${taskId} not found.`);
      process.exit(1);
    }
    
    // Format dates for better readability
    const created = new Date(task.created).toLocaleString();
    const updated = new Date(task.lastUpdated).toLocaleString();
    
    // Display task details
    console.log('\n📝 Task Details:');
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log(`║ Task #${task.id}: ${task.title}`);
    console.log('╠════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║ Status: ${task.status}                 Category: ${task.category}`);
    if (task.priority) {
      console.log(`║ Priority: ${task.priority}           Effort: ${task.effort || 'Unestimated'}`);
    }
    console.log(`║ Created: ${created}`);
    console.log(`║ Updated: ${updated}`);
    console.log(`║ Created by: ${task.createdBy || 'Unknown'}`);
    console.log(`║ Branch: ${task.branch || 'Unknown'}`);
    console.log('╠════════════════════════════════════════════════════════════════════════════╣');
    
    if (task.description && task.description.trim() !== '') {
      console.log('║ Description:');
      console.log(`║ ${task.description}`);
      console.log('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      console.log('║ Related Files:');
      task.relatedFiles.forEach(file => {
        console.log(`║   - ${file}`);
      });
      console.log('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    if (task.comments && task.comments.length > 0) {
      console.log('║ Comments:');
      task.comments.forEach(comment => {
        let timestamp = comment.timestamp || comment.date; // Handle both timestamp and date fields
        const commentDate = new Date(timestamp);
        console.log(`║   [${commentDate.toLocaleString()}] ${comment.author}: ${comment.text}`);
      });
      console.log('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    // Display checklists if any exist
    if (task.checklists && task.checklists.length > 0) {
      console.log('║ Checklists:');
      task.checklists.forEach((checklist, idx) => {
        const completedCount = checklist.items.filter(item => item.completed).length;
        const totalCount = checklist.items.length;
        const progressText = totalCount > 0 ? `[${completedCount}/${totalCount}]` : '[0/0]';
        
        console.log(`║ ┌─ ${idx}. ${checklist.title} ${progressText} ${'─'.repeat(Math.max(0, 50 - checklist.title.length - progressText.length - 5))}┐`);
        
        if (checklist.items.length === 0) {
          console.log('║ │ No items yet                                               │');
        } else {
          checklist.items.forEach((item, itemIdx) => {
            const checkbox = item.completed ? '✅' : '⬜';
            const itemText = item.text.length > 46 ? item.text.substring(0, 43) + '...' : item.text;
            const padding = ' '.repeat(Math.max(0, 46 - itemText.length));
            console.log(`║ │ ${checkbox} ${itemIdx}. ${itemText}${padding} │`);
          });
        }
        
        console.log(`║ └${'─'.repeat(64)}┘`);
      });
      console.log('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('❌ Error viewing task:', error.message);
    process.exit(1);
  }
}

// Update a task
function updateTask(taskId, field, values) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
    process.exit(1);
  }

  // Validate inputs
  if (!taskId) {
    // Show interactive update if no task ID provided
    console.log('Interactive task update:');
    listTasks(); // Show tasks to pick from
    console.log('\nUsage: ./bin/tasktracker update <id> <field> <value>');
    console.log('\nFields:');
    console.log('  status     - Change task status (todo, in-progress, review, done)');
    console.log('  category   - Change task category (feature, bugfix, etc.)');
    console.log('  priority   - Set task priority (p0-critical, p1-high, p2-medium, p3-low)');
    console.log('  effort     - Set effort estimation (1-trivial, 2-small, 3-medium, etc.)');
    console.log('  title      - Change task title');
    console.log('  desc       - Set task description');
    console.log('  add-file   - Add related file to task');
    console.log('  comment    - Add a comment to task');
    console.log('  checklist  - Add or manage checklists');
    console.log('\nExamples:');
    console.log('  ./bin/tasktracker update 1 status done');
    console.log('  ./bin/tasktracker update 2 category feature');
    console.log('  ./bin/tasktracker update 3 priority p1-high');
    console.log('  ./bin/tasktracker update 4 effort 5-large');
    console.log('  ./bin/tasktracker update 5 add-file src/app.js');
    console.log('  ./bin/tasktracker update 5 checklist create "Implementation Steps"');
    console.log('  ./bin/tasktracker update 5 checklist add 0 "Write unit tests"');
    process.exit(0);
  }

  try {
    // Load tasks
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const taskIndex = taskData.tasks.findIndex(t => t.id === parseInt(taskId));
    
    if (taskIndex === -1) {
      console.error(`❌ Task with ID ${taskId} not found.`);
      process.exit(1);
    }

    const task = taskData.tasks[taskIndex];
    let updated = false;

    // Load config to get valid categories and statuses
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // Process update based on field
    switch (field) {
      case 'status':
        const newStatus = values[0];
        if (!newStatus) {
          console.error('❌ Missing status value. Example: ./bin/tasktracker update 1 status done');
          process.exit(1);
        }
        
        if (!config.taskStatuses.includes(newStatus)) {
          console.error(`❌ Invalid status. Valid options: ${config.taskStatuses.join(', ')}`);
          process.exit(1);
        }
        
        task.status = newStatus;
        updated = true;
        break;
        
      case 'priority':
        const newPriority = values[0];
        if (!newPriority) {
          console.error('❌ Missing priority value. Example: ./bin/tasktracker update 1 priority p1-high');
          process.exit(1);
        }
        
        if (!config.priorityLevels.includes(newPriority)) {
          console.error(`❌ Invalid priority. Valid options: ${config.priorityLevels.join(', ')}`);
          process.exit(1);
        }
        
        task.priority = newPriority;
        updated = true;
        break;
        
      case 'effort':
        const newEffort = values[0];
        if (!newEffort) {
          console.error('❌ Missing effort value. Example: ./bin/tasktracker update 1 effort 5-large');
          process.exit(1);
        }
        
        if (!config.effortEstimation.includes(newEffort)) {
          console.error(`❌ Invalid effort. Valid options: ${config.effortEstimation.join(', ')}`);
          process.exit(1);
        }
        
        task.effort = newEffort;
        updated = true;
        break;
        
      case 'category':
        const newCategory = values[0];
        if (!newCategory) {
          console.error('❌ Missing category value. Example: ./bin/tasktracker update 1 category feature');
          process.exit(1);
        }
        
        if (!config.taskCategories.includes(newCategory)) {
          console.error(`❌ Invalid category. Valid options: ${config.taskCategories.join(', ')}`);
          process.exit(1);
        }
        
        task.category = newCategory;
        updated = true;
        break;
        
      case 'title':
        const newTitle = values.join(' ');
        if (!newTitle) {
          console.error('❌ Missing title. Example: ./bin/tasktracker update 1 title "New title"');
          process.exit(1);
        }
        
        task.title = newTitle;
        updated = true;
        break;
        
      case 'desc':
      case 'description':
        const newDescription = values.join(' ');
        if (!newDescription) {
          console.error('❌ Missing description. Example: ./bin/tasktracker update 1 desc "New description"');
          process.exit(1);
        }
        
        task.description = newDescription;
        updated = true;
        break;
        
      // Support both 'addfile' (old) and 'add-file' (new)
      case 'addfile':
      case 'add-file':
        const filePath = values.join(' ');
        if (!filePath) {
          console.error('❌ Missing file path. Example: ./bin/tasktracker update 1 add-file src/app.js');
          process.exit(1);
        }
        
        if (!task.relatedFiles) {
          task.relatedFiles = [];
        }
        
        if (!task.relatedFiles.includes(filePath)) {
          task.relatedFiles.push(filePath);
          updated = true;
        } else {
          console.log(`ℹ️ File ${filePath} is already linked to this task.`);
        }
        break;
        
      case 'comment':
        const commentText = values.join(' ');
        if (!commentText) {
          console.error('❌ Missing comment text. Example: ./bin/tasktracker update 1 comment "Fixed the issue"');
          process.exit(1);
        }
        
        if (!task.comments) {
          task.comments = [];
        }
        
        // Get username from Git if available
        let username = 'Unknown';
        try {
          // Check if we're in a Git repository first
          execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
          username = execSync('git config --get user.name').toString().trim();
        } catch (error) {
          // Git not available, use default or environment variable
          username = process.env.USER || process.env.USERNAME || 'Unknown';
        }
        
        task.comments.push({
          author: username,
          date: new Date().toISOString(),
          text: commentText
        });
        
        updated = true;
        break;
        
      default:
        console.error(`❌ Unknown field: ${field}`);
        console.log('Valid fields: status, category, title, desc, add-file, comment');
        process.exit(1);
    }
    
    if (updated) {
      // Update timestamp
      task.lastUpdated = new Date().toISOString();
      
      // Save changes
      fs.writeFileSync(TASKS_PATH, JSON.stringify(taskData, null, 2));
      console.log(`✅ Task #${taskId} updated successfully.`);
      
      // Show the updated task
      viewTask(taskId);
    }
    
  } catch (error) {
    console.error('❌ Error updating task:', error.message);
    process.exit(1);
  }
}

// Track file changes and link them to tasks
function trackChanges(pathFilter) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH) || !fs.existsSync(FILE_HASHES_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
    process.exit(1);
  }

  try {
    // Load current file hashes
    const fileHashes = JSON.parse(fs.readFileSync(FILE_HASHES_PATH, 'utf8'));
    
    // Get tasks with related files
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const tasksWithFiles = taskData.tasks.filter(task => 
      task.relatedFiles && task.relatedFiles.length > 0
    );
    
    // If using Git, get changed files from Git
    let changedFiles = [];
    let usingGit = false;
    
    try {
      // Check if we're in a Git repository first
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
      
      // Get files tracked by Git that have changed since last commit or are untracked
      const gitOutput = execSync('git ls-files --modified --others --exclude-standard').toString().trim();
      if (gitOutput) {
        changedFiles = gitOutput.split('\n');
        usingGit = true;
      }
      
      console.log(`📊 Found ${changedFiles.length} changed files from Git.`);
    } catch (error) {
      console.log('ℹ️ Git not available or not a Git repository. Using file hash tracking instead.');
      
      // Implement manual file tracking when Git is not available
      changedFiles = findChangedFilesByHash(fileHashes, pathFilter);
      
      console.log(`📊 Found ${changedFiles.length} changed files by comparing timestamps/hashes.`);
    }
    
    // Filter changed files if a path filter is provided
    if (pathFilter && usingGit) {
      changedFiles = changedFiles.filter(file => file.includes(pathFilter));
      console.log(`📊 Filtered to ${changedFiles.length} files matching "${pathFilter}".`);
    }
    
    if (changedFiles.length === 0) {
      console.log('📊 No changed files detected.');
      return;
    }
    
    // Find tasks related to the changed files
    const relatedTasks = new Map();
    
    changedFiles.forEach(file => {
      tasksWithFiles.forEach(task => {
        if (task.relatedFiles.some(relatedFile => 
          file === relatedFile || file.includes(relatedFile) || relatedFile.includes(file)
        )) {
          if (!relatedTasks.has(file)) {
            relatedTasks.set(file, []);
          }
          relatedTasks.get(file).push(task);
        }
      });
    });
    
    // Display results
    console.log('\n📊 Changed Files:');
    console.log('┌────────────────────────────────────────────┬────────────────────────────┐');
    console.log('│ File                                       │ Related Tasks              │');
    console.log('├────────────────────────────────────────────┼────────────────────────────┤');
    
    changedFiles.forEach(file => {
      const related = relatedTasks.has(file) 
        ? relatedTasks.get(file).map(task => `#${task.id} (${task.status})`).join(', ')
        : 'No related tasks';
      
      const fileName = file.length > 44 ? '...' + file.substring(file.length - 41) : file.padEnd(44);
      const tasks = related.length > 28 ? related.substring(0, 25) + '...' : related.padEnd(28);
      
      console.log(`│ ${fileName} │ ${tasks} │`);
    });
    
    console.log('└────────────────────────────────────────────┴────────────────────────────┘');
    
    // Update file hashes for next comparison
    updateFileHashes(changedFiles, fileHashes);
    
    // Save updated file hashes
    fs.writeFileSync(FILE_HASHES_PATH, JSON.stringify(fileHashes, null, 2));
    
  } catch (error) {
    console.error('❌ Error tracking changes:', error.message);
    process.exit(1);
  }
}

// Helper function to find changed files using file stats when Git is not available
function findChangedFilesByHash(fileHashes, pathFilter) {
  const changedFiles = [];
  const checkedDirs = new Set();
  
  // Get all directories that contain related files in tasks
  try {
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const relatedFiles = new Set();
    
    // Collect all related files mentioned in tasks
    taskData.tasks.forEach(task => {
      if (task.relatedFiles && task.relatedFiles.length > 0) {
        task.relatedFiles.forEach(file => {
          relatedFiles.add(file);
          // Add the directory containing this file
          const dir = path.dirname(file);
          checkedDirs.add(dir);
        });
      }
    });
    
    // Also add common source directories
    ['src', 'lib', 'bin', 'app', 'components', 'util'].forEach(dir => {
      if (fs.existsSync(dir)) {
        checkedDirs.add(dir);
      }
    });
    
    // Process the directories to find changed files
    checkedDirs.forEach(dir => {
      processDirectory(dir, fileHashes, changedFiles, pathFilter);
    });
    
    // If no directories had task files, check current directory
    if (checkedDirs.size === 0) {
      processDirectory('.', fileHashes, changedFiles, pathFilter);
    }
    
  } catch (error) {
    console.error('⚠️ Error searching for changed files:', error.message);
  }
  
  return changedFiles;
}

// Helper function to recursively process directories for changed files
function processDirectory(dirPath, fileHashes, changedFiles, pathFilter) {
  try {
    // Skip node_modules and hidden directories
    if (dirPath.includes('node_modules') || dirPath.startsWith('.') || dirPath.includes('/.')) {
      return;
    }
    
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      
      // Skip if path filter is provided and file doesn't match
      if (pathFilter && !filePath.includes(pathFilter)) {
        return;
      }
      
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          // Recursively process subdirectories
          processDirectory(filePath, fileHashes, changedFiles, pathFilter);
        } else if (stats.isFile()) {
          // Check if file has changed
          const lastModified = stats.mtime.toISOString();
          
          if (!fileHashes[filePath] || 
              (fileHashes[filePath].lastModified !== lastModified)) {
            changedFiles.push(filePath);
          }
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    });
  } catch (error) {
    // Skip directories that can't be accessed
  }
}

// Helper function to update file hashes
function updateFileHashes(changedFiles, fileHashes) {
  changedFiles.forEach(file => {
    try {
      const stats = fs.statSync(file);
      
      fileHashes[file] = {
        lastModified: stats.mtime.toISOString(),
        size: stats.size
      };
    } catch (error) {
      // Skip files that can't be accessed
    }
  });
}

// Import multiple tasks from a JSON or CSV file
function importTasks(filePath) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
    process.exit(1);
  }

  // Validate file path
  if (!filePath) {
    console.error('❌ Missing file path. Usage: ./bin/tasktracker import <file>');
    console.log('\nSupported formats:');
    console.log('  - JSON: Array of task objects');
    console.log('  - CSV: Headers and task data');
    console.log('\nExample JSON format:');
    console.log(`[
  {
    "title": "Task 1",
    "description": "Description for task 1",
    "category": "feature",
    "status": "todo"
  },
  {
    "title": "Task 2",
    "description": "Description for task 2",
    "category": "bugfix",
    "status": "in-progress"
  }
]`);
    console.log('\nExample CSV format:');
    console.log('title,description,category,status');
    console.log('"Task 1","Description for task 1","feature","todo"');
    console.log('"Task 2","Description for task 2","bugfix","in-progress"');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    // Load config to get valid categories and statuses
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // Load existing tasks
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    // Get username from Git if available
    let username = 'Unknown';
    try {
      username = execSync('git config --get user.name').toString().trim();
    } catch (error) {
      // Git not available, use default
    }
    
    // Get branch from Git if available
    let branch = 'Unknown';
    try {
      branch = execSync('git branch --show-current').toString().trim();
    } catch (error) {
      // Git not available, use default
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let importedTasks = [];
    
    // Process based on file extension
    if (filePath.endsWith('.json')) {
      // Parse JSON
      importedTasks = JSON.parse(fileContent);
      
      // Validate it's an array
      if (!Array.isArray(importedTasks)) {
        console.error('❌ Invalid JSON format. Expected an array of task objects.');
        process.exit(1);
      }
    } else if (filePath.endsWith('.csv')) {
      // Simple CSV parsing - this could be improved with a CSV parsing library
      const lines = fileContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        console.error('❌ Invalid CSV format. Expected header row and at least one data row.');
        process.exit(1);
      }
      
      // Parse headers
      const headers = parseCSVLine(lines[0]);
      
      // Check required headers
      if (!headers.includes('title')) {
        console.error('❌ Invalid CSV format. Missing required "title" column.');
        process.exit(1);
      }
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          console.warn(`⚠️ Skipping line ${i+1}: Column count mismatch`);
          continue;
        }
        
        // Create task object
        const task = {};
        for (let j = 0; j < headers.length; j++) {
          task[headers[j]] = values[j];
        }
        
        importedTasks.push(task);
      }
    } else {
      console.error('❌ Unsupported file format. Use .json or .csv files.');
      process.exit(1);
    }
    
    // Validate and process imported tasks
    let successCount = 0;
    let failCount = 0;
    
    for (const importedTask of importedTasks) {
      // Validate required fields
      if (!importedTask.title) {
        console.warn(`⚠️ Skipping task: Missing title`);
        failCount++;
        continue;
      }
      
      // Validate category if present
      if (importedTask.category && !config.taskCategories.includes(importedTask.category)) {
        console.warn(`⚠️ Invalid category "${importedTask.category}" for task "${importedTask.title}". Using default.`);
        importedTask.category = 'feature';
      }
      
      // Validate status if present
      if (importedTask.status && !config.taskStatuses.includes(importedTask.status)) {
        console.warn(`⚠️ Invalid status "${importedTask.status}" for task "${importedTask.title}". Using default.`);
        importedTask.status = 'todo';
      }
      
      // Create new task with defaults for missing fields
      const newTask = {
        id: taskData.lastId + 1,
        title: importedTask.title,
        description: importedTask.description || '',
        category: importedTask.category || 'feature',
        status: importedTask.status || 'todo',
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        createdBy: username,
        branch: branch,
        relatedFiles: importedTask.relatedFiles || [],
        comments: [],
        checklists: []
      };
      
      // Add task
      taskData.tasks.push(newTask);
      taskData.lastId = newTask.id;
      successCount++;
    }
    
    // Save tasks
    fs.writeFileSync(TASKS_PATH, JSON.stringify(taskData, null, 2));
    
    console.log(`\n✅ Imported ${successCount} tasks successfully (${failCount} skipped)`);
    
    // Show tasks
    listTasks();
    
  } catch (error) {
    console.error('❌ Error importing tasks:', error.message);
    process.exit(1);
  }
}

// Helper function to parse CSV line considering quoted values
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last value
  result.push(current);
  
  // Clean up values (remove quotes)
  return result.map(val => {
    if (val.startsWith('"') && val.endsWith('"')) {
      return val.substring(1, val.length - 1);
    }
    return val;
  });
}

// Create a new release
function createRelease(versionOverride) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(CONFIG_PATH) || !fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
    process.exit(1);
  }

  try {
    // Load config and tasks
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    // Check for completed tasks not yet included in a release
    const completedTasks = taskData.tasks.filter(task => 
      task.status === 'done' && !task.releaseVersion
    );
    
    if (completedTasks.length === 0) {
      console.log('❌ No completed tasks available for release. Complete some tasks first.');
      process.exit(0);
    }
    
    // Determine the next version number
    let currentVersion = config.currentVersion || '0.1.0';
    let newVersion;
    
    if (versionOverride) {
      // Use the version provided by the user
      newVersion = versionOverride;
    } else {
      // Calculate next version based on versioning type
      const versionParts = currentVersion.split('.').map(Number);
      
      if (config.versioningType === 'semver') {
        // Simple semantic versioning - increment minor version
        versionParts[1]++;
        versionParts[2] = 0;
      } else {
        // Simple incremental versioning
        versionParts[versionParts.length - 1]++;
      }
      
      newVersion = versionParts.join('.');
    }
    
    // Create a changelog entry
    const changelogPath = 'CHANGELOG.md';
    let changelog = '';
    
    // Read existing changelog if it exists
    if (fs.existsSync(changelogPath)) {
      changelog = fs.readFileSync(changelogPath, 'utf8');
    } else {
      changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }
    
    // Create new changelog section
    const releaseDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let newEntry = `\n## [${newVersion}] - ${releaseDate}\n\n`;
    
    // Group tasks by category
    const tasksBySection = {};
    
    // Initialize sections from config
    config.changelogSections.forEach(section => {
      tasksBySection[section] = [];
    });
    
    // Map task categories to changelog sections
    const categoryToSection = {
      'feature': 'Added',
      'bugfix': 'Fixed',
      'refactor': 'Changed',
      'docs': 'Added',
      'test': 'Changed',
      'chore': 'Changed'
    };
    
    // Populate sections with tasks
    completedTasks.forEach(task => {
      const section = categoryToSection[task.category] || 'Changed';
      if (tasksBySection[section]) {
        tasksBySection[section].push(task);
      }
    });
    
    // Add task entries to each section
    Object.keys(tasksBySection).forEach(section => {
      const tasks = tasksBySection[section];
      if (tasks.length > 0) {
        newEntry += `### ${section}\n\n`;
        tasks.forEach(task => {
          newEntry += `- ${task.title} (#${task.id})\n`;
        });
        newEntry += '\n';
      }
    });
    
    // Update changelog
    const updatedChangelog = changelog.replace('# Changelog', '# Changelog\n\n## [Unreleased]') + newEntry;
    fs.writeFileSync(changelogPath, updatedChangelog);
    
    // Mark tasks as released
    completedTasks.forEach(task => {
      task.releaseVersion = newVersion;
    });
    
    // Update config with new version
    config.currentVersion = newVersion;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    
    // Save updated tasks
    fs.writeFileSync(TASKS_PATH, JSON.stringify(taskData, null, 2));
    
    // Create tag in Git if available
    try {
      execSync(`git tag -a "v${newVersion}" -m "Release ${newVersion}"`);
      console.log(`✅ Created Git tag v${newVersion}`);
    } catch (error) {
      console.log(`⚠️ Could not create Git tag: ${error.message}`);
    }
    
    // Show release summary
    console.log('\n🚀 Release created successfully!');
    console.log(`\nVersion: ${newVersion}`);
    console.log(`Date: ${releaseDate}`);
    console.log(`Tasks included: ${completedTasks.length}`);
    console.log('\nChangelog updated. Summary of changes:');
    console.log(newEntry);
    
    // Suggest next steps
    console.log('\nNext steps:');
    console.log('  1. Review the updated CHANGELOG.md file');
    console.log('  2. Commit changes: git commit -am "Release ' + newVersion + '"');
    console.log('  3. Push changes and tags: git push && git push --tags');
    
  } catch (error) {
    console.error('❌ Error creating release:', error.message);
    process.exit(1);
  }
}

// Take a statistical snapshot of the project state
function takeSnapshot(format = 'text') {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH) || !fs.existsSync(SNAPSHOTS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
    process.exit(1);
  }

  try {
    // Load task data
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // Generate timestamp
    const now = new Date();
    const timestamp = now.toISOString();
    const formattedDate = now.toLocaleString();
    
    // Calculate statistics
    const totalTasks = taskData.tasks.length;
    
    // Count tasks by status
    const tasksByStatus = {};
    config.taskStatuses.forEach(status => {
      tasksByStatus[status] = 0;
    });
    
    taskData.tasks.forEach(task => {
      if (tasksByStatus[task.status] !== undefined) {
        tasksByStatus[task.status]++;
      }
    });
    
    // Count tasks by category
    const tasksByCategory = {};
    config.taskCategories.forEach(category => {
      tasksByCategory[category] = 0;
    });
    
    taskData.tasks.forEach(task => {
      if (tasksByCategory[task.category] !== undefined) {
        tasksByCategory[task.category]++;
      }
    });
    
    // Get completion rate
    const completedTasks = tasksByStatus['done'] || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Get tasks created in the last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTasks = taskData.tasks.filter(task => 
      new Date(task.created) > sevenDaysAgo
    ).length;
    
    // Get tasks completed in the last 7 days
    const recentlyCompleted = taskData.tasks.filter(task => 
      task.status === 'done' && new Date(task.lastUpdated) > sevenDaysAgo
    ).length;
    
    // Calculate velocity (tasks completed per day)
    const velocityPerDay = Math.round((recentlyCompleted / 7) * 10) / 10;
    
    // Calculate estimated completion time for remaining tasks
    const remainingTasks = totalTasks - completedTasks;
    const estimatedDays = velocityPerDay > 0 ? Math.ceil(remainingTasks / velocityPerDay) : '∞';
    
    // Calculate estimated completion date
    const estimatedCompletionDate = velocityPerDay > 0 ? 
      new Date(now.getTime() + (estimatedDays * 24 * 60 * 60 * 1000)).toLocaleDateString() : 
      'Unknown';
    
    // Create snapshot object
    const snapshot = {
      timestamp,
      projectName: config.currentVersion,
      version: config.currentVersion,
      statistics: {
        totalTasks,
        tasksByStatus,
        tasksByCategory,
        completionRate,
        recentTasks,
        recentlyCompleted,
        velocityPerDay,
        estimatedDays,
        estimatedCompletionDate
      }
    };
    
    // Get file statistics if Git is available
    try {
      // Count total files
      const filesOutput = execSync('git ls-files').toString().trim();
      const files = filesOutput.split('\n');
      snapshot.statistics.totalFiles = files.length;
      
      // Count files by type
      const filesByType = {};
      files.forEach(file => {
        const ext = path.extname(file);
        if (ext) {
          if (!filesByType[ext]) {
            filesByType[ext] = 0;
          }
          filesByType[ext]++;
        }
      });
      snapshot.statistics.filesByType = filesByType;
      
      // Get commit count
      const commitCount = parseInt(execSync('git rev-list --count HEAD').toString().trim());
      snapshot.statistics.commitCount = commitCount;
      
      // Get contributor count
      const contributorCount = execSync('git shortlog -s HEAD | wc -l').toString().trim();
      snapshot.statistics.contributorCount = parseInt(contributorCount);
      
    } catch (error) {
      // Git not available, skip file statistics
      snapshot.statistics.gitAvailable = false;
    }
    
    // Save snapshot to history
    const snapshots = JSON.parse(fs.readFileSync(SNAPSHOTS_PATH, 'utf8'));
    snapshots.push(snapshot);
    fs.writeFileSync(SNAPSHOTS_PATH, JSON.stringify(snapshots, null, 2));
    
    // Save individual snapshot file
    const snapshotFilename = `snapshot_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.json`;
    const snapshotPath = path.join(STATS_DIR, snapshotFilename);
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    
    // Display snapshot based on format
    if (format.toLowerCase() === 'json') {
      // Output JSON format
      console.log(JSON.stringify(snapshot, null, 2));
    } else {
      // Output text format (default)
      console.log('\n📊 Project Snapshot');
      console.log('─────────────────────────────────────────────────────');
      console.log(`Date: ${formattedDate}`);
      console.log(`Project: ${config.projectName} (v${config.currentVersion})`);
      console.log('─────────────────────────────────────────────────────');
      
      console.log('\n📋 Task Statistics:');
      console.log(`Total Tasks: ${totalTasks}`);
      console.log(`Completion Rate: ${completionRate}%`);
      
      console.log('\n📊 Tasks by Status:');
      Object.keys(tasksByStatus).forEach(status => {
        const count = tasksByStatus[status];
        const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
        console.log(`  ${status}: ${count} (${percentage}%)`);
      });
      
      console.log('\n📊 Tasks by Category:');
      Object.keys(tasksByCategory).forEach(category => {
        const count = tasksByCategory[category];
        const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
        console.log(`  ${category}: ${count} (${percentage}%)`);
      });
      
      console.log('\n📈 Project Velocity:');
      console.log(`  Last 7 Days: ${recentlyCompleted} tasks completed (${velocityPerDay} per day)`);
      console.log(`  New Tasks: ${recentTasks} created in last 7 days`);
      
      console.log('\n🔮 Projections:');
      console.log(`  Remaining Tasks: ${remainingTasks}`);
      console.log(`  Estimated Completion: ${estimatedDays} days (${estimatedCompletionDate})`);
      
      if (snapshot.statistics.gitAvailable !== false) {
        console.log('\n📁 Repository Statistics:');
        console.log(`  Total Files: ${snapshot.statistics.totalFiles}`);
        console.log(`  Total Commits: ${snapshot.statistics.commitCount}`);
        console.log(`  Contributors: ${snapshot.statistics.contributorCount}`);
        
        console.log('\n📁 Files by Type:');
        const fileTypes = Object.keys(snapshot.statistics.filesByType).sort((a, b) => 
          snapshot.statistics.filesByType[b] - snapshot.statistics.filesByType[a]
        );
        fileTypes.slice(0, 5).forEach(ext => {
          console.log(`  ${ext}: ${snapshot.statistics.filesByType[ext]}`);
        });
      }
      
      console.log('\n✅ Snapshot saved to:', snapshotPath);
    }
    
  } catch (error) {
    console.error('❌ Error creating snapshot:', error.message);
    process.exit(1);
  }
}

// Generate AI-friendly context from tasks
function generateAIContext(taskId) {
  try {
    // Check if TaskTracker is initialized
    if (!fs.existsSync(TASKS_PATH)) {
      console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
      process.exit(1);
    }

    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    console.log('\n🤖 Generating AI Context\n');
    
    // If taskId is provided, generate context for a specific task
    if (taskId) {
      const task = taskData.tasks.find(t => t.id.toString() === taskId.toString());
      if (!task) {
        console.error(`❌ Task #${taskId} not found!`);
        process.exit(1);
      }
      
      outputTaskContext(task, config);
    } else {
      // Generate context for active tasks
      const activeTasks = taskData.tasks.filter(t => t.status !== 'done');
      
      if (activeTasks.length === 0) {
        console.log('📝 No active tasks found.');
        return;
      }
      
      console.log(`Found ${activeTasks.length} active tasks:\n`);
      
      activeTasks.forEach(task => {
        outputTaskContext(task, config);
        console.log('\n---\n');
      });
      
      // Additional context for the project
      console.log('Project Overview Context:');
      console.log('```context');
      console.log(`Project: ${config.projectName}`);
      console.log(`Version: ${config.currentVersion}`);
      console.log(`Active Tasks: ${activeTasks.length}`);
      console.log(`Total Tasks: ${taskData.tasks.length}`);
      
      // Group tasks by category
      const categoryCounts = {};
      activeTasks.forEach(task => {
        categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
      });
      
      console.log('\nTask Categories:');
      Object.keys(categoryCounts).forEach(category => {
        console.log(`- ${category}: ${categoryCounts[category]}`);
      });
      
      // Technical debt focus if any exist
      const techDebtTasks = activeTasks.filter(t => t.category === 'technical-debt');
      if (techDebtTasks.length > 0) {
        console.log('\nTechnical Debt Focus:');
        techDebtTasks.forEach(task => {
          console.log(`- #${task.id}: ${task.title}`);
        });
      }
      
      console.log('```');
    }
  } catch (error) {
    console.error('❌ Error generating AI context:', error.message);
    process.exit(1);
  }
}

// Helper function to output AI context for a single task
function outputTaskContext(task, config) {
  // Get the related files' content if they exist
  const fileContents = {};
  
  if (task.relatedFiles && task.relatedFiles.length > 0) {
    task.relatedFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          // Only include the first 20 lines of each file to keep context manageable
          fileContents[file] = fs.readFileSync(file, 'utf8')
            .split('\n')
            .slice(0, 20)
            .join('\n');
        }
      } catch (error) {
        // Silently ignore file read errors
      }
    });
  }
  
  // Get any changed files associated with this task from tracking data
  let changedFiles = [];
  if (fs.existsSync(FILE_HASHES_PATH)) {
    try {
      const fileHashes = JSON.parse(fs.readFileSync(FILE_HASHES_PATH, 'utf8'));
      if (fileHashes.changesByTask && fileHashes.changesByTask[task.id]) {
        changedFiles = fileHashes.changesByTask[task.id];
      }
    } catch (error) {
      // Silently ignore parse errors
    }
  }
  
  // Format the date
  const created = new Date(task.created);
  const formattedDate = created.toLocaleDateString();
  
  // Output task context in a format suitable for AI assistants
  console.log(`Task #${task.id}: ${task.title}`);
  console.log('```context');
  console.log(`ID: ${task.id}`);
  console.log(`Title: ${task.title}`);
  console.log(`Status: ${task.status}`);
  console.log(`Category: ${task.category}`);
  if (task.priority) {
    console.log(`Priority: ${task.priority}`);
  }
  if (task.effort) {
    console.log(`Effort: ${task.effort}`);
  }
  console.log(`Created: ${formattedDate}`);
  console.log(`Created By: ${task.createdBy || 'Unknown'}`);
  console.log(`Branch: ${task.branch || 'Unknown'}`);
  
  if (task.description) {
    console.log('\nDescription:');
    console.log(task.description);
  }
  
  if (task.comments && task.comments.length > 0) {
    console.log('\nComments:');
    task.comments.forEach(comment => {
      let timestamp = comment.timestamp || comment.date; // Handle both timestamp and date fields
      const commentDate = new Date(timestamp);
      console.log(`- [${commentDate.toLocaleString()}] ${comment.author}: ${comment.text}`);
    });
  }
  
  // Display checklists if any exist
  if (task.checklists && task.checklists.length > 0) {
    console.log('║ Checklists:');
    task.checklists.forEach((checklist, idx) => {
      const completedCount = checklist.items.filter(item => item.completed).length;
      const totalCount = checklist.items.length;
      const progressText = totalCount > 0 ? `[${completedCount}/${totalCount}]` : '[0/0]';
      
      console.log(`║ ┌─ ${idx}. ${checklist.title} ${progressText} ${'─'.repeat(Math.max(0, 50 - checklist.title.length - progressText.length - 5))}┐`);
      
      if (checklist.items.length === 0) {
        console.log('║ │ No items yet                                               │');
      } else {
        checklist.items.forEach((item, itemIdx) => {
          const checkbox = item.completed ? '✅' : '⬜';
          const itemText = item.text.length > 46 ? item.text.substring(0, 43) + '...' : item.text;
          const padding = ' '.repeat(Math.max(0, 46 - itemText.length));
          console.log(`║ │ ${checkbox} ${itemIdx}. ${itemText}${padding} │`);
        });
      }
      
      console.log(`║ └${'─'.repeat(64)}┘`);
    });
    console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  }
  
  if (changedFiles.length > 0) {
    console.log('\nFiles Changed for this Task:');
    changedFiles.forEach(file => {
      console.log(`- ${file}`);
    });
  }
  
  if (task.relatedFiles && task.relatedFiles.length > 0) {
    console.log('\nRelated Files:');
    task.relatedFiles.forEach(file => {
      console.log(`- ${file}`);
    });
  }
  
  // Include relevant file content snippets
  if (Object.keys(fileContents).length > 0) {
    console.log('\nFile Snippets (first 20 lines):');
    for (const [file, content] of Object.entries(fileContents)) {
      console.log(`\n--- ${file} ---`);
      console.log(content);
    }
  }
  
  console.log('```');
  
  // Generate code templates if it's a technical debt or feature task
  if (task.category === 'technical-debt') {
    console.log('\nTechnical Debt Refactoring Template:');
    console.log('```javascript');
    console.log('/**');
    console.log(` * Task #${task.id}: ${task.title}`);
    console.log(' * Refactoring to address technical debt');
    console.log(' * ');
    console.log(' * Original code issues:');
    console.log(' * - [describe the issue with the current implementation]');
    console.log(' * - [identify performance/maintenance/scalability problems]');
    console.log(' * ');
    console.log(' * Improvement strategy:');
    console.log(' * - [describe the approach to fix the debt]');
    console.log(' * - [list expected improvements]');
    console.log(' */');
    console.log('```');
  } else if (task.category === 'feature') {
    console.log('\nFeature Implementation Template:');
    console.log('```javascript');
    console.log('/**');
    console.log(` * Task #${task.id}: ${task.title}`);
    console.log(' * Feature implementation');
    console.log(' * ');
    console.log(' * Requirements:');
    console.log(' * - [list main functional requirements]');
    console.log(' * ');
    console.log(' * Dependencies:');
    console.log(' * - [list any dependencies or related components]');
    console.log(' */');
    console.log('```');
  }
}

// Analyze code health metrics for technical debt
function analyzeCodeHealth(targetPath = '.') {
  try {
    // Check if TaskTracker is initialized
    if (!fs.existsSync(TASKTRACKER_DIR)) {
      console.error('❌ TaskTracker not initialized! Please run: ./bin/tasktracker init');
      process.exit(1);
    }

    console.log('🔍 Analyzing code health metrics for technical debt...\n');
    
    // This will store our metrics
    const metrics = {
      totalFiles: 0,
      totalLines: 0,
      languages: {},
      complexityScores: {},
      duplicationRate: 0,
      potentialDebtFiles: []
    };
    
    // Create recursive function to analyze files
    function analyzeDirectory(dirPath) {
      try {
        // Read all files in the directory
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          
          // Skip hidden files and directories
          if (file.startsWith('.') || file === 'node_modules' || file === 'dist' || file === 'build') {
            continue;
          }
          
          // If it's a directory, analyze recursively
          if (stats.isDirectory()) {
            analyzeDirectory(filePath);
            continue;
          }
          
          // Get file extension to determine language
          const ext = path.extname(filePath).toLowerCase();
          
          // Skip binary files and non-code files
          if (['.jpg', '.png', '.gif', '.pdf', '.zip', '.exe'].includes(ext)) {
            continue;
          }
          
          metrics.totalFiles++;
          
          // Read file content
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          metrics.totalLines += lines.length;
          
          // Track languages
          metrics.languages[ext] = (metrics.languages[ext] || 0) + 1;
          
          // Simple complexity analysis
          let complexity = 0;
          let longFunctions = 0;
          let nestedControlFlow = 0;
          let tooDeeplyNested = 0;
          let longLines = 0;
          
          // Track current nesting level
          let nestingLevel = 0;
          let maxNestingLevel = 0;
          let currentFunctionLines = 0;
          let inFunction = false;
          
          for (const line of lines) {
            // Check for long lines
            if (line.length > 100) {
              longLines++;
            }
            
            // Count function declarations
            if (line.match(/function |=>|def |class |impl |fn |func /)) {
              inFunction = true;
              currentFunctionLines = 0;
            }
            
            // Count control flow statements
            if (line.match(/if |for |while |switch |catch |try |elsif |when /)) {
              nestingLevel++;
              maxNestingLevel = Math.max(maxNestingLevel, nestingLevel);
              nestedControlFlow++;
            }
            
            // Track end of blocks
            if (line.match(/}|\bend\b|elsif|else|catch|finally/)) {
              nestingLevel = Math.max(0, nestingLevel - 1);
            }
            
            if (inFunction) {
              currentFunctionLines++;
              
              // Check if function ended
              if (line.match(/}|\bend\b/) && nestingLevel === 0) {
                inFunction = false;
                
                // Check if it was a long function
                if (currentFunctionLines > 50) {
                  longFunctions++;
                }
              }
            }
          }
          
          // Too deeply nested functions are a sign of complexity
          if (maxNestingLevel > 3) {
            tooDeeplyNested = maxNestingLevel;
          }
          
          // Calculate complexity score (simple heuristic)
          complexity = (nestedControlFlow * 0.5) + (longFunctions * 2) + (tooDeeplyNested * 1.5) + (longLines * 0.2);
          
          // Store complexity score
          metrics.complexityScores[filePath] = complexity;
          
          // Files with high complexity are potential debt
          if (complexity > 10) {
            metrics.potentialDebtFiles.push({
              path: filePath,
              complexity,
              lines: lines.length,
              nestedControlFlow,
              longFunctions,
              nestingDepth: tooDeeplyNested,
              longLines
            });
          }
        }
      } catch (error) {
        console.error(`Warning: Error analyzing directory: ${dirPath}: ${error.message}`);
      }
    }
    
    // Start analysis from target path
    analyzeDirectory(targetPath);
    
    // Calculate overall duplication rate (simplified estimate)
    metrics.duplicationRate = metrics.potentialDebtFiles.length > 0 
      ? Math.min(80, Math.round((metrics.potentialDebtFiles.length / metrics.totalFiles) * 100))
      : 0;
    
    // Sort the potential debt files by complexity
    metrics.potentialDebtFiles.sort((a, b) => b.complexity - a.complexity);
    
    // Display the metrics
    console.log('📊 Code Health Summary:');
    console.log(`  Total Files: ${metrics.totalFiles}`);
    console.log(`  Total Lines of Code: ${metrics.totalLines}`);
    
    console.log('\n🔤 Languages:');
    Object.keys(metrics.languages).sort().forEach(lang => {
      console.log(`  ${lang || 'unknown'}: ${metrics.languages[lang]} files`);
    });
    
    console.log('\n⚠️ Estimated Technical Debt:');
    console.log(`  Potential Debt Files: ${metrics.potentialDebtFiles.length} (${Math.round((metrics.potentialDebtFiles.length / metrics.totalFiles) * 100)}% of codebase)`);
    console.log(`  Overall Health Score: ${100 - metrics.duplicationRate}%`);
    
    // Show top files with potential technical debt
    console.log('\n📋 Top Technical Debt Candidates:');
    metrics.potentialDebtFiles.slice(0, 10).forEach(file => {
      console.log(`  ${chalk.red('!')} ${file.path} - Complexity Score: ${chalk.red(file.complexity.toFixed(1))}`);
      console.log(`    Lines: ${file.lines}, Nested Blocks: ${file.nestedControlFlow}, Deep Nesting: ${file.nestingDepth > 0 ? chalk.yellow('Yes') : 'No'}`);
      console.log(`    Long Functions: ${file.longFunctions > 0 ? chalk.yellow(file.longFunctions) : '0'}, Long Lines: ${file.longLines}`);
    });
    
    // Save results for tracking and create technical debt tasks
    const debtMetricsPath = path.join(TASKTRACKER_DIR, 'code_health.json');
    fs.writeFileSync(debtMetricsPath, JSON.stringify(metrics, null, 2));
    console.log(`\n✅ Code health metrics saved to ${debtMetricsPath}`);
    
    // Ask if we should create technical debt tasks
    if (metrics.potentialDebtFiles.length > 0) {
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\nDo you want to create technical debt tasks for the top candidates? (y/n): ', answer => {
        if (answer.toLowerCase() === 'y') {
          console.log('\nCreating technical debt tasks...');
          
          const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
          const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
          
          let createdTasks = 0;
          
          metrics.potentialDebtFiles.slice(0, 5).forEach(file => {
            const complexityLevel = file.complexity > 20 ? 'high' : (file.complexity > 15 ? 'medium' : 'low');
            const priorityLevel = file.complexity > 20 ? 'p1-high' : (file.complexity > 15 ? 'p2-medium' : 'p3-low');
            const effortLevel = file.complexity > 20 ? '8-xlarge' : (file.complexity > 15 ? '5-large' : '3-medium');
            
            // Create a technical debt task
            const newTask = {
              id: taskData.lastId + 1,
              title: `Refactor ${path.basename(file.path)} - complexity issues`,
              description: `Technical debt identified by code health analysis.\n\nIssues:\n- Complexity score: ${file.complexity.toFixed(1)} (${complexityLevel})\n- ${file.longFunctions} long function(s)\n- Nesting depth: ${file.nestingDepth}\n- ${file.longLines} long lines`,
              category: 'technical-debt',
              status: 'todo',
              priority: priorityLevel,
              effort: effortLevel,
              created: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              createdBy: 'code-health',
              branch: 'main',
              relatedFiles: [file.path],
              comments: [{
                author: 'code-health',
                timestamp: new Date().toISOString(),
                text: `Technical debt template:\n* File/Component: ${file.path}\n* Technical Debt Type: complexity\n* Impact Level: ${complexityLevel}\n* Estimated Refactoring Effort: ${effortLevel}\n* Risk of Not Fixing: Increased maintenance costs and potential bugs\n* Proposed Solution: Refactor to reduce complexity, break down into smaller functions, reduce nesting`
              }],
              checklists: []
            };
            
            taskData.tasks.push(newTask);
            taskData.lastId = newTask.id;
            
            console.log(`  ✅ Created task #${newTask.id}: ${newTask.title}`);
            createdTasks++;
          });
          
          // Save the updated task data
          fs.writeFileSync(TASKS_PATH, JSON.stringify(taskData, null, 2));
          console.log(`\n✅ Created ${createdTasks} technical debt tasks`);
          rl.close();
        } else {
          console.log('\n✅ No tasks created');
          rl.close();
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error analyzing code health:', error.message);
    process.exit(1);
  }
}

// Display help information
function showHelp() {
  const logo = `
╔════════════════════════════════════════╗
║   _____         _    _____             ║
║  |_   _|_ _ ___| | _|_   _| __ __ _    ║
║    | |/ _\` / __| |/ / | || '__/ _\` |   ║
║    | | (_| \\__ \\   <  | || | | (_| |   ║
║    |_|\\__,_|___/_|\\_\\ |_||_|  \\__,_|   ║
║                                        ║
╚════════════════════════════════════════╝`;

  console.log(logo);
  console.log('\nUsage: ./bin/tasktracker <command> [options]');
  console.log('\nTask Management:');
  console.log('  init                   Initialize TaskTracker in the current directory');
  console.log('  add                    Add a new task (interactive)');
  console.log('  quick "Task" [cat]     Quickly add a task (non-interactive)');
  console.log('  update                 Update an existing task');
  console.log('  list [status]          List all tasks or filter by status');
  console.log('  list --full            List tasks with priority and effort details');
  console.log('  view <id>              View details of a specific task');
  console.log('  import <file>          Import multiple tasks from JSON or CSV file');
  console.log('  changes                Check which files have changed');
  console.log('  release                Create a new release');
  console.log('  ai-context [id]        Generate AI-friendly context from tasks');
  console.log('  code-health [path]     Analyze code health metrics for technical debt');
  
  console.log('\nStatistics and Reporting:');
  console.log('  snapshot               Take a snapshot of the current project state');
  console.log('  report [type]          Generate a report (text, html, json)');
  console.log('  compare [days]         Compare with a snapshot from N days ago');
  console.log('  trends                 Show task completion trends');
  
  console.log('\nSetup and Utilities:');
  console.log('  setup                  Set up TaskTracker in a project');
  console.log('  automate               Configure Git hooks and automation');
  console.log('  onboard                Interactive guided setup for new users');
  console.log('  help                   Show this help information');
  
  console.log('\nExamples:');
  console.log('  ./bin/tasktracker init');
  console.log('  ./bin/tasktracker quick "Fix login button" bugfix');
  console.log('  ./bin/tasktracker list todo');
  console.log('  ./bin/tasktracker import tasks.json');
  console.log('  ./bin/tasktracker ai-context 19');
}

// Run the interactive onboarding process
function runOnboarding() {
  console.log('\n🚀 Welcome to TaskTracker Onboarding!');
  console.log('This guide will help you set up TaskTracker for your project.\n');
  
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Check if TaskTracker is already initialized
  const isInitialized = fs.existsSync(TASKTRACKER_DIR);
  
  if (isInitialized) {
    rl.question('TaskTracker is already initialized. Do you want to reconfigure it? (y/n): ', answer => {
      if (answer.toLowerCase() !== 'y') {
        console.log('\n✅ Keeping existing configuration.');
        showQuickStartGuide();
        rl.close();
        return;
      }
      
      // Continue with reconfiguration
      configureTaskTracker(rl);
    });
  } else {
    console.log('It looks like TaskTracker has not been initialized yet.');
    rl.question('Do you want to initialize TaskTracker now? (y/n): ', answer => {
      if (answer.toLowerCase() !== 'y') {
        console.log('\n❌ Onboarding cancelled.');
        rl.close();
        return;
      }
      
      // Initialize and then configure
      initializeTaskTracker();
      configureTaskTracker(rl);
    });
  }
}

// Configure TaskTracker interactively
function configureTaskTracker(rl) {
  // Load current config
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    config = {
      projectName: path.basename(process.cwd()),
      versioningType: 'semver',
      currentVersion: '0.1.0',
      taskCategories: ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore', 'technical-debt'],
      taskStatuses: ['todo', 'in-progress', 'review', 'done'],
      priorityLevels: ['p0-critical', 'p1-high', 'p2-medium', 'p3-low'],
      effortEstimation: ['1-trivial', '2-small', '3-medium', '5-large', '8-xlarge', '13-complex'],
      changelogSections: ['Added', 'Changed', 'Fixed', 'Deprecated', 'Removed', 'Security'],
      gitIntegration: true
    };
  }
  
  console.log('\n📝 Project Configuration:');
  
  // Step 1: Project Name
  rl.question(`Project name (${config.projectName}): `, projectName => {
    config.projectName = projectName || config.projectName;
    
    // Step 2: Current Version
    rl.question(`Current version (${config.currentVersion}): `, version => {
      config.currentVersion = version || config.currentVersion;
      
      // Step 3: Git Integration
      rl.question(`Enable Git integration? (y/n) (${config.gitIntegration ? 'y' : 'n'}): `, gitAnswer => {
        if (gitAnswer) {
          config.gitIntegration = gitAnswer.toLowerCase() === 'y';
        }
        
        // Step 4: Customize Categories
        const categories = config.taskCategories.join(', ');
        rl.question(`Task categories (comma-separated) (${categories}): `, categoriesAnswer => {
          if (categoriesAnswer) {
            config.taskCategories = categoriesAnswer.split(',').map(c => c.trim());
          }
          
          // Step 5: IDE Integration
          detectAndConfigureIDE(config, () => {
            // Step 6: Save Configuration
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            console.log('\n✅ Configuration saved successfully!');
            
            // Step 7: Import Existing Tasks
            checkExistingIssues(rl, config);
          });
        });
      });
    });
  });
}

// Check for existing issues to import
function checkExistingIssues(rl, config) {
  let hasGitIssues = false;
  let hasGithubIssues = false;
  
  // Check if git is available
  try {
    if (config.gitIntegration) {
      const gitResult = execSync('git rev-parse --is-inside-work-tree 2>/dev/null', { stdio: 'pipe' });
      hasGitIssues = gitResult.toString().trim() === 'true';
    }
  } catch (error) {
    // Git not available
  }
  
  // Check for GitHub issues if this is a GitHub repo
  try {
    if (hasGitIssues) {
      const remoteUrl = execSync('git remote get-url origin', { stdio: 'pipe' }).toString().trim();
      hasGithubIssues = remoteUrl.includes('github.com');
    }
  } catch (error) {
    // Not a GitHub repo or no remote
  }
  
  if (hasGithubIssues) {
    rl.question('\nDo you want to import GitHub issues as tasks? (y/n): ', answer => {
      if (answer.toLowerCase() === 'y') {
        console.log('\n📥 GitHub issues import is coming in a future version.');
      }
      
      askForSampleTasks(rl);
    });
  } else if (hasGitIssues) {
    console.log('\nGit repository detected. You can use git-integration for automatic changelog generation.');
    askForSampleTasks(rl);
  } else {
    askForSampleTasks(rl);
  }
}

// Offer to create sample tasks
function askForSampleTasks(rl) {
  rl.question('\nDo you want to create sample tasks to get started? (y/n): ', answer => {
    if (answer.toLowerCase() === 'y') {
      createSampleTasks();
      console.log('\n✅ Sample tasks created!');
    }
    
    // Offer to set up automation
    rl.question('\nDo you want to set up Git hooks for automatic task tracking? (y/n): ', answer => {
      if (answer.toLowerCase() === 'y') {
        try {
          console.log('\n🔄 Setting up Git hooks...');
          const scriptPath = path.join(__dirname, 'auto-tracker.sh');
          if (fs.existsSync(scriptPath)) {
            execSync(`bash ${scriptPath}`, { stdio: 'inherit' });
          } else {
            console.log('❌ auto-tracker.sh not found!');
          }
        } catch (error) {
          console.error('❌ Error setting up Git hooks:', error.message);
        }
      }
      
      // Show quick start guide and finish
      showQuickStartGuide();
      rl.close();
    });
  });
}

// Show quick start guide
function showQuickStartGuide() {
  console.log('\n🚀 Quick Start Guide:');
  console.log('1. Initialize TaskTracker: ./bin/tasktracker init');
  console.log('2. Add a new task: ./bin/tasktracker add');
  console.log('3. List all tasks: ./bin/tasktracker list');
  console.log('4. Update a task status: ./bin/tasktracker update <id> status <status>');
  console.log('5. View task details: ./bin/tasktracker view <id>');
  console.log('6. Track file changes: ./bin/tasktracker changes <path>');
  console.log('7. Import tasks: ./bin/tasktracker import <file>');
  console.log('8. Create a new release: ./bin/tasktracker release <version>');
  console.log('9. Generate AI context: ./bin/tasktracker ai-context <id>');
  console.log('10. Analyze code health: ./bin/tasktracker code-health <path>');
  console.log('11. Run onboarding: ./bin/tasktracker onboard');
}

// Detect the type of project in the current directory
function detectProjectType() {
  const projectFiles = {
    'javascript': ['package.json', 'node_modules'],
    'typescript': ['tsconfig.json', 'tsc', '.ts'],
    'python': ['requirements.txt', 'setup.py', 'Pipfile', '.py'],
    'ruby': ['Gemfile', '.rb', '.gemspec'],
    'java': ['pom.xml', 'build.gradle', '.java'],
    'rust': ['Cargo.toml', '.rs'],
    'go': ['go.mod', '.go'],
    'php': ['composer.json', '.php'],
    'dotnet': ['.csproj', '.vbproj', '.fsproj', '.sln'],
    'flutter': ['pubspec.yaml', '.dart']
  };

  const fileExists = filename => {
    return fs.existsSync(path.join(process.cwd(), filename));
  };

  const hasFileWithExtension = ext => {
    try {
      const files = fs.readdirSync(process.cwd());
      return files.some(file => file.endsWith(ext));
    } catch (error) {
      return false;
    }
  };

  // Try to detect by specific project files
  for (const [type, markers] of Object.entries(projectFiles)) {
    for (const marker of markers) {
      if (marker.startsWith('.')) {
        if (hasFileWithExtension(marker)) {
          return { type, confidence: 'medium' };
        }
      } else if (fileExists(marker)) {
        return { type, confidence: 'high' };
      }
    }
  }

  // Additional special cases
  if (fileExists('docker-compose.yml') || fileExists('Dockerfile')) {
    return { type: 'docker', confidence: 'high' };
  }

  if (fileExists('.github/workflows')) {
    return { type: 'github-actions', confidence: 'medium' };
  }
  
  // Check for possible frontend framework
  if (fileExists('angular.json')) {
    return { type: 'angular', confidence: 'high' };
  }
  
  if (fileExists('vue.config.js') || hasFileWithExtension('.vue')) {
    return { type: 'vue', confidence: 'high' };
  }
  
  if (fileExists('next.config.js')) {
    return { type: 'nextjs', confidence: 'high' };
  }
  
  if (fileExists('gatsby-config.js')) {
    return { type: 'gatsby', confidence: 'high' };
  }

  // If package.json exists, try to extract more info
  if (fileExists('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.react) {
        return { type: 'react', confidence: 'high' };
      }
      
      if (deps.vue) {
        return { type: 'vue', confidence: 'high' };
      }
      
      if (deps.svelte) {
        return { type: 'svelte', confidence: 'high' };
      }
      
      if (deps.express || deps.koa || deps.fastify || deps['@nestjs/core']) {
        return { type: 'node-backend', confidence: 'high' };
      }
    } catch (error) {
      // Ignore JSON parsing error
    }
  }

  // Default fallback
  return { type: 'unknown', confidence: 'low' };
} 