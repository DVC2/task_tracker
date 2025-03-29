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

// Find the application root directory and data directory
const appRoot = process.cwd();
const DATA_DIR = path.join(appRoot, '.tasktracker');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

// Handle potential chalk compatibility issues
let chalkEnabled = true;
let shouldShowChalkWarning = true;

// Try to load config first to check if we should suppress warnings
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    shouldShowChalkWarning = config.showChalkWarnings !== false; // Default to true if not specified
  }
} catch (error) {
  // If we can't read config, default to showing warnings
  shouldShowChalkWarning = true;
}

try {
  // Test chalk functionality
  chalk.green('test');
} catch (error) {
  if (shouldShowChalkWarning) {
    console.warn('⚠️ Chalk library disabled due to compatibility issues. Using plain text output.');
    console.warn('   To suppress this warning, run: tasktracker update-config suppress-chalk-warnings');
  }
  chalkEnabled = false;
}

// Create a more robust chalk-like fallback object 
const reliableChalk = {
  // Base colors
  red: text => chalkEnabled ? chalk.red(text) : `\x1b[31m${text}\x1b[0m`,
  green: text => chalkEnabled ? chalk.green(text) : `\x1b[32m${text}\x1b[0m`,
  yellow: text => chalkEnabled ? chalk.yellow(text) : `\x1b[33m${text}\x1b[0m`,
  blue: text => chalkEnabled ? chalk.blue(text) : `\x1b[34m${text}\x1b[0m`,
  magenta: text => chalkEnabled ? chalk.magenta(text) : `\x1b[35m${text}\x1b[0m`,
  cyan: text => chalkEnabled ? chalk.cyan(text) : `\x1b[36m${text}\x1b[0m`,
  white: text => chalkEnabled ? chalk.white(text) : `\x1b[37m${text}\x1b[0m`,
  gray: text => chalkEnabled ? chalk.gray(text) : `\x1b[90m${text}\x1b[0m`,
  grey: text => chalkEnabled ? chalk.grey(text) : `\x1b[90m${text}\x1b[0m`,
  dim: text => chalkEnabled ? chalk.dim(text) : `\x1b[2m${text}\x1b[0m`,
  bold: text => chalkEnabled ? chalk.bold(text) : `\x1b[1m${text}\x1b[0m`,
  // Compound styles
  bgRed: {
    white: text => chalkEnabled ? chalk.bgRed.white(text) : `\x1b[41m\x1b[37m${text}\x1b[0m`
  }
};

// Replace all direct chalk references with reliableChalk throughout the code

// Constants
const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
const FILE_HASHES_PATH = path.join(DATA_DIR, 'file-hashes.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const REPORTS_DIR = path.join(DATA_DIR, 'reports');
const STATS_DIR = path.join(DATA_DIR, 'stats');
const TASKIGNORE_PATH = path.join(process.cwd(), '.taskignore');

// Default ignore patterns (used when no .taskignore file exists)
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.cache/**',
  '.next/**',
  '.tasktracker/**',
  '**/*.log',
  '**/*.lock',
  '**/*.map'
];

// Available commands and their scripts
const COMMANDS = {
  // Core task management
  'init': { script: 'tasktracker.js', description: 'Initialize TaskTracker in the current directory' },
  'add': { script: 'tasktracker.js', description: 'Add a new task (interactive)' },
  'quick': { script: 'quick-task.js', description: 'Quickly add a task (non-interactive)' },
  'update': { script: 'tasktracker.js', description: 'Update an existing task' },
  'update-config': { script: 'tasktracker.js', description: 'Update configuration settings' },
  'verify': { script: 'tasktracker.js', description: 'Verify TaskTracker installation and configuration' },
  'ignore': { script: 'tasktracker.js', description: 'Manage ignore patterns (.taskignore)' },
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

// Global options
const globalOptions = {
  silent: false,        // Suppress normal console output
  json: false,          // Output results as JSON
  nonInteractive: false // Non-interactive mode (never prompt for input)
};

// Parse global options from command args
function parseGlobalOptions(argArray) {
  const remainingArgs = [];
  
  for (let i = 0; i < argArray.length; i++) {
    const arg = argArray[i];
    
    if (arg === '--silent' || arg === '-s') {
      globalOptions.silent = true;
    } else if (arg === '--json' || arg === '-j') {
      globalOptions.json = true;
      // JSON mode implies silent for normal console output
      globalOptions.silent = true;
    } else if (arg === '--non-interactive' || arg === '--ni') {
      globalOptions.nonInteractive = true;
    } else {
      remainingArgs.push(arg);
    }
  }
  
  return remainingArgs;
}

// Process global options
const filteredCommandArgs = parseGlobalOptions(commandArgs);

// Output handler function to respect silent and JSON modes
function output(data, type = 'info', options = {}) {
  if (globalOptions.json) {
    // In JSON mode, collect data for final output
    if (!global.jsonOutput) {
      global.jsonOutput = {
        success: true,
        data: {},
        errors: []
      };
    }
    
    if (type === 'error') {
      global.jsonOutput.success = false;
      global.jsonOutput.errors.push(data);
    } else if (type === 'data') {
      // Store structured data in the appropriate field
      if (options.field) {
        global.jsonOutput.data[options.field] = data;
      } else {
        // If no field specified, merge with existing data
        if (Array.isArray(data)) {
          if (!global.jsonOutput.data.items) {
            global.jsonOutput.data.items = [];
          }
          global.jsonOutput.data.items = global.jsonOutput.data.items.concat(data);
        } else if (typeof data === 'object') {
          global.jsonOutput.data = {...global.jsonOutput.data, ...data};
        } else {
          global.jsonOutput.data.value = data;
        }
      }
    } else if (type === 'result') {
      if (options.field) {
        global.jsonOutput.data[options.field] = data;
      } else {
        global.jsonOutput.data.result = data;
      }
    }
    
    // Only output when requested (usually at the end of the command)
    if (options.output) {
      console.log(JSON.stringify(global.jsonOutput, null, options.pretty ? 2 : null));
      global.jsonOutput = null; // Reset for next command
    }
  } else if (!globalOptions.silent || type === 'error') {
    // In normal mode or for errors in silent mode, output to console
    if (type === 'error') {
      console.error(data);
    } else {
      console.log(data);
    }
  }
  
  // Return data for chaining or programmatic use
  return data;
}

// Exit handler that respects JSON mode by outputting results first
function exitWithCode(code) {
  if (globalOptions.json && global.jsonOutput) {
    global.jsonOutput.exitCode = code;
    console.log(JSON.stringify(global.jsonOutput));
  }
  process.exit(code);
}

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

// Handle update-config command directly in this script
if (command === 'update-config') {
  const configOption = filteredCommandArgs[0];
  
  if (configOption === 'suppress-chalk-warnings') {
    updateChalkWarningConfig(false);
    process.exit(0);
  } else if (configOption === 'show-chalk-warnings') {
    updateChalkWarningConfig(true);
    process.exit(0);
  } else {
    output('❌ Unknown config option. Available options:', 'error');
    output('  suppress-chalk-warnings - Hide chalk library compatibility warnings');
    output('  show-chalk-warnings - Show chalk library compatibility warnings');
    exitWithCode(1);
  }
}

// Handle list command directly in this script
if (command === 'list') {
  try {
    const statusFilter = filteredCommandArgs[0] !== '--current' && filteredCommandArgs[0] !== '--full' ? filteredCommandArgs[0] : null;
    const showCurrentOnly = filteredCommandArgs.includes('--current');
    const showFull = filteredCommandArgs.includes('--full');
    listTasks(statusFilter, showCurrentOnly, showFull);
    exitWithCode(0);
  } catch (error) {
    output(colorize(`❌ Error listing tasks: ${error.message}`, 'error'), 'error');
    exitWithCode(1);
  }
}

// Handle view command directly in this script
if (command === 'view') {
  viewTask(filteredCommandArgs[0]); // Task ID
  exitWithCode(0);
}

// Handle update command directly in this script
if (command === 'update') {
  updateTask(filteredCommandArgs[0], filteredCommandArgs[1], filteredCommandArgs.slice(2)); // Task ID, field, values
  exitWithCode(0);
}

// Handle changes command directly in this script
if (command === 'changes') {
  trackChanges(filteredCommandArgs[0]); // Optional path filter
  exitWithCode(0);
}

// Handle import command directly in this script
if (command === 'import') {
  importTasks(filteredCommandArgs[0]); // File path
  exitWithCode(0);
}

// Handle release command directly in this script
if (command === 'release') {
  createRelease(filteredCommandArgs[0]); // Version override (optional)
  exitWithCode(0);
}

// Handle ai-context command directly in this script
if (command === 'ai-context') {
  generateAIContext(filteredCommandArgs[0]); // Task ID (optional)
  exitWithCode(0);
}

// Handle code-health command directly in this script
if (command === 'code-health') {
  analyzeCodeHealth(filteredCommandArgs[0]); // Path (optional)
  exitWithCode(0);
}

// Handle onboard command directly in this script
if (command === 'onboard') {
  runOnboarding();
  exitWithCode(0);
}

// Handle snapshot command directly in this script
if (command === 'snapshot') {
  takeSnapshot(filteredCommandArgs[0]); // Output format (optional)
  exitWithCode(0);
}

// Handle verify command directly in this script
if (command === 'verify') {
  const verificationResult = verifyInstallation();
  
  if (globalOptions.json) {
    output(verificationResult, 'data', { output: true });
    exitWithCode(verificationResult.success ? 0 : 1);
    return;
  }
  
  if (verificationResult.success) {
    output('\n✅ TaskTracker verification completed successfully!');
    output('All components are properly installed and configured.');
  } else {
    output('\n⚠️ TaskTracker verification completed with warnings:');
    verificationResult.warnings.forEach(warning => {
      output(`  - ${warning}`);
    });
    output('\nConsider re-initializing with "tasktracker init" or manually fixing the issues.');
  }
  
  exitWithCode(verificationResult.success ? 0 : 1);
}

// Handle ignore command directly in this script
if (command === 'ignore') {
  manageIgnorePatterns(filteredCommandArgs);
  exitWithCode(0);
}

// Manage ignore patterns in .taskignore file
function manageIgnorePatterns(args) {
  try {
    // Determine the action based on arguments
    const action = args[0];
    
    if (!action) {
      // No action specified, show current patterns
      showIgnorePatterns();
      return;
    }
    
    switch (action) {
      case 'add':
        // Add new pattern
        if (!args[1]) {
          output('❌ Missing pattern. Usage: tasktracker ignore add <pattern>', 'error');
          return;
        }
        addIgnorePattern(args[1]);
        break;
      
      case 'remove':
        // Remove pattern
        if (!args[1]) {
          output('❌ Missing pattern. Usage: tasktracker ignore remove <pattern>', 'error');
          return;
        }
        removeIgnorePattern(args[1]);
        break;
      
      case 'init':
        // Create a default .taskignore file
        initializeIgnoreFile();
        break;
      
      case 'list':
        // Show current patterns (alias for no action)
        showIgnorePatterns();
        break;
      
      default:
        output(`❌ Unknown action: ${action}`, 'error');
        output('\nUsage: tasktracker ignore <action> [pattern]');
        output('Actions:');
        output('  list               - Show current ignore patterns');
        output('  add <pattern>      - Add a new ignore pattern');
        output('  remove <pattern>   - Remove an ignore pattern');
        output('  init               - Create a default .taskignore file');
        break;
    }
  } catch (error) {
    output('❌ Error managing ignore patterns: ' + error.message, 'error');
  }
}

// Verify TaskTracker installation and configuration
function verifyInstallation() {
  console.log('\n🔍 Verifying TaskTracker installation...');
  
  const requiredComponents = [
    { name: 'Data directory', path: DATA_DIR, type: 'directory' },
    { name: 'Tasks database', path: TASKS_PATH, type: 'file' },
    { name: 'Configuration', path: CONFIG_PATH, type: 'file' },
    { name: 'File hashes', path: FILE_HASHES_PATH, type: 'file' },
    { name: 'Reports directory', path: REPORTS_DIR, type: 'directory' },
    { name: 'Statistics directory', path: STATS_DIR, type: 'directory' }
  ];
  
  const result = {
    success: true,
    warnings: []
  };
  
  // Check for all required components
  for (const component of requiredComponents) {
    try {
      if (!fs.existsSync(component.path)) {
        result.success = false;
        result.warnings.push(`Missing ${component.type}: ${component.name} (${component.path})`);
        continue;
      }
      
      // Check if component is readable and writable
      try {
        const stats = fs.statSync(component.path);
        
        if (component.type === 'directory' && !stats.isDirectory()) {
          result.success = false;
          result.warnings.push(`${component.name} (${component.path}) exists but is not a directory`);
        } else if (component.type === 'file' && !stats.isFile()) {
          result.success = false;
          result.warnings.push(`${component.name} (${component.path}) exists but is not a file`);
        }
        
        // Check file permissions (read/write)
        fs.accessSync(component.path, fs.constants.R_OK | fs.constants.W_OK);
      } catch (error) {
        result.success = false;
        result.warnings.push(`Permission error for ${component.name}: ${error.message}`);
      }
    } catch (error) {
      result.success = false;
      result.warnings.push(`Error checking ${component.name}: ${error.message}`);
    }
  }
  
  // Check JSON format integrity for config and tasks
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
      try {
        JSON.parse(configContent);
      } catch (error) {
        result.success = false;
        result.warnings.push(`Configuration file contains invalid JSON: ${error.message}`);
      }
    }
    
    if (fs.existsSync(TASKS_PATH)) {
      const tasksContent = fs.readFileSync(TASKS_PATH, 'utf8');
      try {
        const taskData = JSON.parse(tasksContent);
        
        // Basic structure validation
        if (!taskData.hasOwnProperty('lastId') || !Array.isArray(taskData.tasks)) {
          result.success = false;
          result.warnings.push('Tasks file has invalid structure (missing lastId or tasks array)');
        }
      } catch (error) {
        result.success = false;
        result.warnings.push(`Tasks file contains invalid JSON: ${error.message}`);
      }
    }
  } catch (error) {
    result.success = false;
    result.warnings.push(`Error validating JSON files: ${error.message}`);
  }
  
  // Check script dependencies
  const requiredScripts = [
    { name: 'quick-task.js', path: path.join(scriptDir, 'quick-task.js') },
    { name: 'stats-tracker.js', path: path.join(scriptDir, 'stats-tracker.js') }
  ];
  
  for (const script of requiredScripts) {
    if (!fs.existsSync(script.path)) {
      result.success = false;
      result.warnings.push(`Missing required script: ${script.name} (${script.path})`);
    }
  }
  
  // Output verification results
  if (result.success) {
    console.log('✅ All required components verified successfully');
  } else {
    console.log(`⚠️ Found ${result.warnings.length} issue(s) with TaskTracker installation`);
  }
  
  return result;
}

// Add a task interactively
function addTaskInteractive() {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
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
      if (text === 'todo') return reliableChalk.yellow(text);
      if (text === 'in-progress') return reliableChalk.blue(text);
      if (text === 'review') return reliableChalk.magenta(text);
      if (text === 'done') return reliableChalk.green(text);
      return reliableChalk.white(text);
    }
    // Category coloring
    else if (type === 'category') {
      if (category === 'feature') return reliableChalk.green(text);
      if (category === 'bugfix') return reliableChalk.red(text);
      if (category === 'refactor') return reliableChalk.cyan(text);
      if (category === 'docs') return reliableChalk.yellow(text);
      if (category === 'test') return reliableChalk.blue(text);
      if (category === 'technical-debt') return reliableChalk.bgRed.white(text);
      if (category === 'chore') return reliableChalk.gray(text);
      return reliableChalk.white(text);
    }
    // Priority coloring
    else if (type === 'priority') {
      if (text.startsWith('p0')) return reliableChalk.bgRed.white(text);
      if (text.startsWith('p1')) return reliableChalk.red(text);
      if (text.startsWith('p2')) return reliableChalk.yellow(text);
      if (text.startsWith('p3')) return reliableChalk.green(text);
      return reliableChalk.white(text);
    }
    // Effort coloring
    else if (type === 'effort') {
      if (text.startsWith('1')) return reliableChalk.green(text);
      if (text.startsWith('3')) return reliableChalk.yellow(text);
      if (text.startsWith('5')) return reliableChalk.red(text);
      return reliableChalk.white(text);
    }
    else if (type === 'title') {
      return reliableChalk.bold(reliableChalk.cyan(text));
    }
    else if (type === 'date') {
      return reliableChalk.white(text);
    }
    else if (type === 'heading') {
      return reliableChalk.bold(reliableChalk.white(text));
    }
    else if (type === 'success') {
      return reliableChalk.green(text);
    }
    else if (type === 'error') {
      return reliableChalk.red(text);
    }
    else if (type === 'warning') {
      return reliableChalk.yellow(text);
    }
    else if (type === 'info') {
      return reliableChalk.blue(text);
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
    output('❌ TaskTracker not initialized! Please run: tasktracker init', 'error');
    exitWithCode(1);
  }

  try {
    // Load tasks
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    if (taskData.tasks.length === 0) {
      if (globalOptions.json) {
        output([], 'data', { field: 'tasks', output: true });
        exitWithCode(0);
      } else {
        output(colorize('📋 No tasks found. Create a task with "tasktracker add" or "tasktracker quick"', 'info'));
        exitWithCode(0);
      }
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
        if (globalOptions.json) {
          output(currentTask, 'data', { field: 'currentTask', output: true });
        } else {
          output(`${currentTask.id}: [${currentTask.status}] ${currentTask.title}`);
        }
        exitWithCode(0);
      } else {
        // If no in-progress tasks, show the first todo task
        const todoTasks = tasks.filter(task => task.status === 'todo');
        if (todoTasks.length > 0) {
          const nextTask = todoTasks[0];
          if (globalOptions.json) {
            output(nextTask, 'data', { field: 'nextTask', output: true });
          } else {
            output(`${nextTask.id}: [${nextTask.status}] ${nextTask.title}`);
          }
          exitWithCode(0);
        } else {
          if (globalOptions.json) {
            output(null, 'data', { field: 'currentTask', output: true });
          } else {
            output('No current task');
          }
          exitWithCode(0);
        }
      }
    }
    
    if (tasks.length === 0) {
      if (globalOptions.json) {
        output([], 'data', { field: 'tasks', output: true });
        exitWithCode(0);
      } else {
        output(colorize(`📋 No tasks with status "${statusFilter}" found.`, 'warning'));
        exitWithCode(0);
      }
    }

    // In JSON mode, return the tasks directly
    if (globalOptions.json) {
      output(tasks, 'data', { field: 'tasks', output: true });
      exitWithCode(0);
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
      hLine = reliableChalk.dim(`┌${'─'.repeat(COL_ID_WIDTH)}┬${'─'.repeat(COL_STATUS_WIDTH)}┬${'─'.repeat(COL_TITLE_WIDTH)}┬${'─'.repeat(COL_CATEGORY_WIDTH)}┬${'─'.repeat(COL_PRIORITY_WIDTH)}┬${'─'.repeat(COL_EFFORT_WIDTH)}┐`);
      hLineMiddle = reliableChalk.dim(`├${'─'.repeat(COL_ID_WIDTH)}┼${'─'.repeat(COL_STATUS_WIDTH)}┼${'─'.repeat(COL_TITLE_WIDTH)}┼${'─'.repeat(COL_CATEGORY_WIDTH)}┼${'─'.repeat(COL_PRIORITY_WIDTH)}┼${'─'.repeat(COL_EFFORT_WIDTH)}┤`);
      hLineBottom = reliableChalk.dim(`└${'─'.repeat(COL_ID_WIDTH)}┴${'─'.repeat(COL_STATUS_WIDTH)}┴${'─'.repeat(COL_TITLE_WIDTH)}┴${'─'.repeat(COL_CATEGORY_WIDTH)}┴${'─'.repeat(COL_PRIORITY_WIDTH)}┴${'─'.repeat(COL_EFFORT_WIDTH)}┘`);
    } else {
      hLine = reliableChalk.dim(`┌${'─'.repeat(COL_ID_WIDTH)}┬${'─'.repeat(COL_STATUS_WIDTH)}┬${'─'.repeat(COL_TITLE_WIDTH)}┬${'─'.repeat(COL_CATEGORY_WIDTH)}┐`);
      hLineMiddle = reliableChalk.dim(`├${'─'.repeat(COL_ID_WIDTH)}┼${'─'.repeat(COL_STATUS_WIDTH)}┼${'─'.repeat(COL_TITLE_WIDTH)}┼${'─'.repeat(COL_CATEGORY_WIDTH)}┤`);
      hLineBottom = reliableChalk.dim(`└${'─'.repeat(COL_ID_WIDTH)}┴${'─'.repeat(COL_STATUS_WIDTH)}┴${'─'.repeat(COL_TITLE_WIDTH)}┴${'─'.repeat(COL_CATEGORY_WIDTH)}┘`);
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
          return reliableChalk.dim(`│ `) + formatCol(coloredId, COL_ID_WIDTH - 1) + 
                reliableChalk.dim(` │ `) + formatCol(coloredStatus, COL_STATUS_WIDTH - 1) + 
                reliableChalk.dim(` │ `) + formatCol(coloredTitle, COL_TITLE_WIDTH - 1) + 
                reliableChalk.dim(` │ `) + formatCol(coloredCategory, COL_CATEGORY_WIDTH - 1) + 
                reliableChalk.dim(` │`);
        }
        
        return reliableChalk.dim(`│ `) + formatCol(coloredId, COL_ID_WIDTH - 1) + 
              reliableChalk.dim(` │ `) + formatCol(coloredStatus, COL_STATUS_WIDTH - 1) + 
              reliableChalk.dim(` │ `) + formatCol(coloredTitle, COL_TITLE_WIDTH - 1) + 
              reliableChalk.dim(` │ `) + formatCol(coloredCategory, COL_CATEGORY_WIDTH - 1) + 
              reliableChalk.dim(` │ `) + formatCol(coloredPriority, COL_PRIORITY_WIDTH - 1) + 
              reliableChalk.dim(` │ `) + formatCol(coloredEffort, COL_EFFORT_WIDTH - 1) + 
              reliableChalk.dim(` │`);
      } catch (error) {
        // Fallback for formatting errors
        console.error(`Warning: Row formatting error: ${error.message}`);
        return `│ ${id} │ ${status} │ ${title} │ ${category} │ ${priority} │ ${effort} │`;
      }
    };
    
    // Display tasks in a table format
    output('\n' + colorize('📋 Task List:', 'header'));
    
    try {
      output(hLine);
      if (showFull) {
        output(formatRow(colorize('ID', 'header'), colorize('Status', 'header'), colorize('Title', 'header'), colorize('Category', 'header'), colorize('Priority', 'header'), colorize('Effort', 'header')));
      } else {
        output(formatRow(colorize('ID', 'header'), colorize('Status', 'header'), colorize('Title', 'header'), colorize('Category', 'header')));
      }
      output(hLineMiddle);
      
      tasks.forEach(task => {
        output(formatRow(
          task.id, 
          task.status, 
          task.title, 
          task.category,
          task.priority,
          task.effort
        ));
      });
      
      output(hLineBottom);
      output(colorize(`Total: ${tasks.length} tasks${statusFilter ? ` with status "${statusFilter}"` : ''}`, 'info'));
    } catch (error) {
      // Fallback to simpler table if fancy formatting fails
      console.error(`Warning: Table formatting error: ${error.message}`);
      output('ID | Status      | Title                             | Category');
      output('---+-------------+-----------------------------------+------------');
      
      tasks.forEach(task => {
        const truncatedTitle = task.title.length > 35 
          ? task.title.substring(0, 32) + '...' 
          : task.title.padEnd(35);
        output(`${String(task.id).padEnd(3)}| ${task.status.padEnd(12)}| ${truncatedTitle}| ${task.category}`);
      });
      
      output(`\nTotal: ${tasks.length} tasks${statusFilter ? ` with status "${statusFilter}"` : ''}`);
    }
    
  } catch (error) {
    output(colorize('❌ Error listing tasks: ' + error.message, 'error'), 'error');
    exitWithCode(1);
  }
}

// View details of a specific task
function viewTask(taskId) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    output('❌ TaskTracker not initialized! Please run: tasktracker init', 'error');
    exitWithCode(1);
  }

  // Validate task ID
  if (!taskId) {
    output('❌ Missing task ID. Usage: tasktracker view <id>', 'error');
    exitWithCode(1);
  }

  try {
    // Load tasks
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const task = taskData.tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      output(`❌ Task with ID ${taskId} not found.`, 'error');
      exitWithCode(1);
    }
    
    // In JSON mode, return task data directly
    if (globalOptions.json) {
      output(task, 'data', { output: true });
      exitWithCode(0);
      return;
    }
    
    // Format dates for better readability
    const created = new Date(task.created).toLocaleString();
    const updated = new Date(task.lastUpdated).toLocaleString();
    
    // Display task details
    output('\n📝 Task Details:');
    output('╔════════════════════════════════════════════════════════════════════════════╗');
    output(`║ Task #${task.id}: ${task.title}`);
    output('╠════════════════════════════════════════════════════════════════════════════╣');
    output(`║ Status: ${task.status}                 Category: ${task.category}`);
    if (task.priority) {
      output(`║ Priority: ${task.priority}           Effort: ${task.effort || 'Unestimated'}`);
    }
    output(`║ Created: ${created}`);
    output(`║ Updated: ${updated}`);
    output(`║ Created by: ${task.createdBy || 'Unknown'}`);
    output(`║ Branch: ${task.branch || 'Unknown'}`);
    output('╠════════════════════════════════════════════════════════════════════════════╣');
    
    if (task.description && task.description.trim() !== '') {
      output('║ Description:');
      output(`║ ${task.description}`);
      output('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      output('║ Related Files:');
      task.relatedFiles.forEach(file => {
        output(`║   - ${file}`);
      });
      output('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    if (task.comments && task.comments.length > 0) {
      output('║ Comments:');
      task.comments.forEach(comment => {
        let timestamp = comment.timestamp || comment.date; // Handle both timestamp and date fields
        const commentDate = new Date(timestamp);
        output(`║   [${commentDate.toLocaleString()}] ${comment.author}: ${comment.text}`);
      });
      output('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    // Display checklists if any exist
    if (task.checklists && task.checklists.length > 0) {
      output('║ Checklists:');
      task.checklists.forEach((checklist, idx) => {
        const completedCount = checklist.items.filter(item => item.completed).length;
        const totalCount = checklist.items.length;
        const progressText = totalCount > 0 ? `[${completedCount}/${totalCount}]` : '[0/0]';
        
        output(`║ ┌─ ${idx}. ${checklist.title} ${progressText} ${'─'.repeat(Math.max(0, 50 - checklist.title.length - progressText.length - 5))}┐`);
        
        if (checklist.items.length === 0) {
          output('║ │ No items yet                                               │');
        } else {
          checklist.items.forEach((item, itemIdx) => {
            const checkbox = item.completed ? '✅' : '⬜';
            const itemText = item.text.length > 46 ? item.text.substring(0, 43) + '...' : item.text;
            const padding = ' '.repeat(Math.max(0, 46 - itemText.length));
            output(`║ │ ${checkbox} ${itemIdx}. ${itemText}${padding} │`);
          });
        }
        
        output(`║ └${'─'.repeat(64)}┘`);
      });
      output('╠════════════════════════════════════════════════════════════════════════════╣');
    }
    
    output('╚════════════════════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    output('❌ Error viewing task: ' + error.message, 'error');
    exitWithCode(1);
  }
}

// Update a task
function updateTask(taskId, field, values) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    output('❌ TaskTracker not initialized! Please run: tasktracker init', 'error');
    exitWithCode(1);
  }

  // Validate inputs
  if (!taskId) {
    // In non-interactive mode, this is an error
    if (globalOptions.nonInteractive) {
      output('❌ Missing task ID. Usage: tasktracker update <id> <field> <value>', 'error');
      exitWithCode(1);
    }
    
    // Show interactive update if no task ID provided
    output('Interactive task update:');
    listTasks(); // Show tasks to pick from
    output('\nUsage: tasktracker update <id> <field> <value>');
    output('\nFields:');
    output('  status     - Change task status (todo, in-progress, review, done)');
    output('  category   - Change task category (feature, bugfix, etc.)');
    output('  priority   - Set task priority (p0-critical, p1-high, p2-medium, p3-low)');
    output('  effort     - Set effort estimation (1-trivial, 2-small, 3-medium, etc.)');
    output('  title      - Change task title');
    output('  desc       - Set task description');
    output('  add-file   - Add related file to task');
    output('  comment    - Add a comment to task');
    output('  checklist  - Add or manage checklists');
    output('\nExamples:');
    output('  tasktracker update 1 status done');
    output('  tasktracker update 2 category feature');
    output('  tasktracker update 3 priority p1-high');
    output('  tasktracker update 4 effort 5-large');
    output('  tasktracker update 5 add-file src/app.js');
    output('  tasktracker update 5 checklist create "Implementation Steps"');
    output('  tasktracker update 5 checklist add 0 "Write unit tests"');
    exitWithCode(0);
  }

  try {
    // Load tasks
    const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const taskIndex = taskData.tasks.findIndex(t => t.id === parseInt(taskId));
    
    if (taskIndex === -1) {
      output(`❌ Task with ID ${taskId} not found.`, 'error');
      exitWithCode(1);
    }

    const task = taskData.tasks[taskIndex];
    let updated = false;

    // Load config to get valid categories and statuses
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    if (!field) {
      // In non-interactive mode, this is an error
      if (globalOptions.nonInteractive) {
        output('❌ Missing field. Usage: tasktracker update <id> <field> <value>', 'error');
        exitWithCode(1);
      }
      
      // Show the task and prompt for field
      viewTask(taskId);
      output('\nSpecify a field to update. Examples:');
      output('  tasktracker update ' + taskId + ' status done');
      output('  tasktracker update ' + taskId + ' priority p1-high');
      exitWithCode(0);
    }
    
    // Process update based on field
    switch (field) {
      case 'status':
        const newStatus = values[0];
        if (!newStatus) {
          output('❌ Missing status value. Example: tasktracker update 1 status done', 'error');
          exitWithCode(1);
        }
        
        if (!config.taskStatuses.includes(newStatus)) {
          output(`❌ Invalid status. Valid options: ${config.taskStatuses.join(', ')}`, 'error');
          exitWithCode(1);
        }
        
        task.status = newStatus;
        updated = true;
        break;
        
      case 'priority':
        const newPriority = values[0];
        if (!newPriority) {
          output('❌ Missing priority value. Example: tasktracker update 1 priority p1-high', 'error');
          exitWithCode(1);
        }
        
        if (!config.priorityLevels.includes(newPriority)) {
          output(`❌ Invalid priority. Valid options: ${config.priorityLevels.join(', ')}`, 'error');
          exitWithCode(1);
        }
        
        task.priority = newPriority;
        updated = true;
        break;
        
      case 'effort':
        const newEffort = values[0];
        if (!newEffort) {
          output('❌ Missing effort value. Example: tasktracker update 1 effort 5-large', 'error');
          exitWithCode(1);
        }
        
        if (!config.effortEstimation.includes(newEffort)) {
          output(`❌ Invalid effort. Valid options: ${config.effortEstimation.join(', ')}`, 'error');
          exitWithCode(1);
        }
        
        task.effort = newEffort;
        updated = true;
        break;
        
      case 'category':
        const newCategory = values[0];
        if (!newCategory) {
          output('❌ Missing category value. Example: tasktracker update 1 category feature', 'error');
          exitWithCode(1);
        }
        
        if (!config.taskCategories.includes(newCategory)) {
          output(`❌ Invalid category. Valid options: ${config.taskCategories.join(', ')}`, 'error');
          exitWithCode(1);
        }
        
        task.category = newCategory;
        updated = true;
        break;
        
      case 'title':
        const newTitle = values.join(' ');
        if (!newTitle) {
          output('❌ Missing title. Example: tasktracker update 1 title "New title"', 'error');
          exitWithCode(1);
        }
        
        task.title = newTitle;
        updated = true;
        break;
        
      case 'desc':
      case 'description':
        const newDescription = values.join(' ');
        if (!newDescription) {
          output('❌ Missing description. Example: tasktracker update 1 desc "New description"', 'error');
          exitWithCode(1);
        }
        
        task.description = newDescription;
        updated = true;
        break;
        
      // Support both 'addfile' (old) and 'add-file' (new)
      case 'addfile':
      case 'add-file':
        const filePath = values.join(' ');
        if (!filePath) {
          output('❌ Missing file path. Example: tasktracker update 1 add-file src/app.js', 'error');
          exitWithCode(1);
        }
        
        if (!task.relatedFiles) {
          task.relatedFiles = [];
        }
        
        if (!task.relatedFiles.includes(filePath)) {
          task.relatedFiles.push(filePath);
          updated = true;
        } else {
          output(`ℹ️ File ${filePath} is already linked to this task.`);
        }
        break;
        
      case 'comment':
        const commentText = values.join(' ');
        if (!commentText) {
          output('❌ Missing comment text. Example: tasktracker update 1 comment "Fixed the issue"', 'error');
          exitWithCode(1);
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
        
      case 'checklist':
        if (!values[0]) {
          output('❌ Missing checklist action. Usage: tasktracker update 1 checklist <action>', 'error');
          output('Actions:');
          output('  create "Title"          - Create a new checklist');
          output('  add <index> "Item"      - Add item to checklist');
          output('  toggle <cIndex> <iIndex> - Toggle item completion');
          output('  remove <cIndex> <iIndex> - Remove item from checklist');
          output('  delete <index>          - Delete entire checklist');
          exitWithCode(1);
        }
        
        // Initialize checklists array if not exists
        if (!task.checklists) {
          task.checklists = [];
        }
        
        // Checklist actions
        const checklistAction = values[0];
        
        switch(checklistAction) {
          case 'create':
            const title = values.slice(1).join(' ');
            if (!title) {
              output('❌ Missing checklist title. Example: tasktracker update 1 checklist create "Implementation Steps"', 'error');
              exitWithCode(1);
            }
            
            task.checklists.push({
              title: title,
              items: []
            });
            
            output(`✅ Created checklist "${title}"`);
            updated = true;
            break;
            
          case 'add':
            if (!values[1] || isNaN(parseInt(values[1]))) {
              output('❌ Missing or invalid checklist index. Example: tasktracker update 1 checklist add 0 "Write tests"', 'error');
              exitWithCode(1);
            }
            
            const checklistIndex = parseInt(values[1]);
            if (checklistIndex < 0 || checklistIndex >= task.checklists.length) {
              output(`❌ Checklist index out of range. Valid range: 0-${task.checklists.length - 1}`, 'error');
              exitWithCode(1);
            }
            
            const itemText = values.slice(2).join(' ');
            if (!itemText) {
              console.error('❌ Missing item text. Example: tasktracker update 1 checklist add 0 "Write tests"');
              process.exit(1);
            }
            
            task.checklists[checklistIndex].items.push({
              text: itemText,
              completed: false,
              createdAt: new Date().toISOString()
            });
            
            console.log(`✅ Added item to checklist: "${itemText}"`);
            updated = true;
            break;
            
          case 'toggle':
            if (!values[1] || isNaN(parseInt(values[1])) || !values[2] || isNaN(parseInt(values[2]))) {
              console.error('❌ Missing or invalid indices. Example: tasktracker update 1 checklist toggle 0 2');
              process.exit(1);
            }
            
            const cIndex = parseInt(values[1]);
            if (cIndex < 0 || cIndex >= task.checklists.length) {
              console.error(`❌ Checklist index out of range. Valid range: 0-${task.checklists.length - 1}`);
              process.exit(1);
            }
            
            const iIndex = parseInt(values[2]);
            if (iIndex < 0 || iIndex >= task.checklists[cIndex].items.length) {
              console.error(`❌ Item index out of range. Valid range: 0-${task.checklists[cIndex].items.length - 1}`);
              process.exit(1);
            }
            
            // Toggle completion status
            const item = task.checklists[cIndex].items[iIndex];
            item.completed = !item.completed;
            item.completedAt = item.completed ? new Date().toISOString() : null;
            
            console.log(`✅ Item marked as ${item.completed ? 'completed' : 'incomplete'}`);
            updated = true;
            break;
            
          case 'remove':
            if (!values[1] || isNaN(parseInt(values[1])) || !values[2] || isNaN(parseInt(values[2]))) {
              console.error('❌ Missing or invalid indices. Example: tasktracker update 1 checklist remove 0 2');
              process.exit(1);
            }
            
            const checklist = parseInt(values[1]);
            if (checklist < 0 || checklist >= task.checklists.length) {
              console.error(`❌ Checklist index out of range. Valid range: 0-${task.checklists.length - 1}`);
              process.exit(1);
            }
            
            const itemIdx = parseInt(values[2]);
            if (itemIdx < 0 || itemIdx >= task.checklists[checklist].items.length) {
              console.error(`❌ Item index out of range. Valid range: 0-${task.checklists[checklist].items.length - 1}`);
              process.exit(1);
            }
            
            // Remove the item
            const removedItem = task.checklists[checklist].items.splice(itemIdx, 1)[0];
            console.log(`✅ Removed item: "${removedItem.text}"`);
            updated = true;
            break;
            
          case 'delete':
            if (!values[1] || isNaN(parseInt(values[1]))) {
              console.error('❌ Missing or invalid checklist index. Example: tasktracker update 1 checklist delete 0');
              process.exit(1);
            }
            
            const delIndex = parseInt(values[1]);
            if (delIndex < 0 || delIndex >= task.checklists.length) {
              console.error(`❌ Checklist index out of range. Valid range: 0-${task.checklists.length - 1}`);
              process.exit(1);
            }
            
            // Remove the checklist
            const removedList = task.checklists.splice(delIndex, 1)[0];
            console.log(`✅ Removed checklist: "${removedList.title}"`);
            updated = true;
            break;
            
          default:
            console.error(`❌ Unknown checklist action: ${checklistAction}`);
            console.log('Valid actions: create, add, toggle, remove, delete');
            process.exit(1);
        }
        break;
        
      default:
        console.error(`❌ Unknown field: ${field}`);
        console.log('Valid fields: status, category, title, desc, add-file, comment, checklist');
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
    console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
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
    
    // Load ignore patterns from .taskignore file
    const ignorePatterns = loadIgnorePatterns();
    
    // Check Git availability locally in this function
    let localGitAvailable = false;
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
      localGitAvailable = true;
    } catch (error) {
      // Git not available, will use file-based tracking
    }
    
    // If using Git, get changed files from Git
    let changedFiles = [];
    let usingGit = false;
    let trackingMethod = "";
    
    if (localGitAvailable) {
      try {
        // Get files tracked by Git that have changed since last commit or are untracked
        const gitOutput = execSync('git ls-files --modified --others --exclude-standard', { stdio: 'pipe' }).toString().trim();
        if (gitOutput) {
          changedFiles = gitOutput.split('\n');
          
          // Apply .taskignore patterns to Git-reported changes
          changedFiles = changedFiles.filter(file => !isFileIgnored(file, ignorePatterns));
          
          usingGit = true;
          trackingMethod = "Git tracking";
        } else {
          // Fall back to file hash tracking if git command returned empty
          changedFiles = findChangedFilesByHash(fileHashes, pathFilter);
          trackingMethod = "File hash tracking (Git available but no changes detected)";
        }
      } catch (error) {
        // Fall back to file hash tracking if git command failed
        console.log(`ℹ️ Git command failed: ${error.message.split('\n')[0]}`);
        changedFiles = findChangedFilesByHash(fileHashes, pathFilter);
        trackingMethod = "File hash tracking (Git command failed)";
      }
    } else {
      // Use file hash tracking when Git is not available
      changedFiles = findChangedFilesByHash(fileHashes, pathFilter);
      trackingMethod = "File hash tracking (Git not available)";
    }
    
    console.log(`📊 Found ${changedFiles.length} changed files using ${trackingMethod}.`);
    
    // Filter changed files if a path filter is provided
    if (pathFilter) {
      const originalCount = changedFiles.length;
      changedFiles = changedFiles.filter(file => file.includes(pathFilter));
      console.log(`📊 Filtered to ${changedFiles.length} files matching "${pathFilter}" (out of ${originalCount}).`);
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
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.cache', '.next', '.tasktracker'];
  const ignoreExtensions = ['.log', '.lock', '.map'];
  let filesChecked = 0;
  const maxFilesToCheck = 1000; // Limit to prevent performance issues on large projects
  
  // Load ignore patterns from .taskignore file
  const ignorePatterns = loadIgnorePatterns();
  
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
          if (dir && dir !== '.' && !ignoreDirs.some(ignoreDir => dir.includes(ignoreDir))) {
            checkedDirs.add(dir);
          }
        });
      }
    });
    
    // If path filter is specified, prioritize that directory
    if (pathFilter) {
      if (fs.existsSync(pathFilter) && fs.statSync(pathFilter).isDirectory()) {
        checkedDirs.add(pathFilter);
      } else {
        const filterDir = path.dirname(pathFilter);
        if (filterDir && filterDir !== '.' && fs.existsSync(filterDir)) {
          checkedDirs.add(filterDir);
        }
      }
    }
    
    // Also add common source directories
    ['src', 'lib', 'bin', 'app', 'components', 'util', 'utils', 'scripts'].forEach(dir => {
      if (fs.existsSync(dir) && !checkedDirs.has(dir)) {
        checkedDirs.add(dir);
      }
    });
    
    // Process the directories to find changed files
    for (const dir of checkedDirs) {
      if (filesChecked >= maxFilesToCheck) {
        console.log(`⚠️ Reached file check limit (${maxFilesToCheck}). Some changes may not be detected.`);
        console.log(`   Consider using a specific path filter to narrow the search scope.`);
        break;
      }
      processDirectory(dir, fileHashes, changedFiles, pathFilter, ignoreDirs, ignoreExtensions, ignorePatterns,
        { filesChecked, maxFilesToCheck }, 
        (count) => { filesChecked = count; }
      );
    }
    
    // If no directories had task files, check current directory
    if (checkedDirs.size === 0) {
      processDirectory('.', fileHashes, changedFiles, pathFilter, ignoreDirs, ignoreExtensions, ignorePatterns,
        { filesChecked, maxFilesToCheck }, 
        (count) => { filesChecked = count; }
      );
    }
    
  } catch (error) {
    console.error(`⚠️ Error searching for changed files: ${error.message}`);
  }
  
  return changedFiles;
}

// Helper function to recursively process directories for changed files
function processDirectory(dirPath, fileHashes, changedFiles, pathFilter, ignoreDirs, ignoreExtensions, ignorePatterns, countRef, updateCount) {
  try {
    // Skip ignored directories
    if (ignoreDirs.some(ignoreDir => dirPath.includes(ignoreDir))) {
      return;
    }
    
    // Skip if .taskignore patterns match this directory
    if (isFileIgnored(dirPath, ignorePatterns)) {
      return;
    }
    
    // Skip if we've already checked too many files
    if (countRef.filesChecked >= countRef.maxFilesToCheck) {
      return;
    }
    
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      // Skip if we've already checked too many files
      if (countRef.filesChecked >= countRef.maxFilesToCheck) {
        return;
      }
      
      const filePath = path.join(dirPath, file);
      
      // Skip if path filter is provided and file doesn't match
      if (pathFilter && !filePath.includes(pathFilter)) {
        continue;
      }
      
      // Skip if the file matches any ignore pattern
      if (isFileIgnored(filePath, ignorePatterns)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          // Recursively process subdirectories
          processDirectory(filePath, fileHashes, changedFiles, pathFilter, ignoreDirs, ignoreExtensions, ignorePatterns, countRef, updateCount);
        } else if (stats.isFile()) {
          // Skip files with ignored extensions
          if (ignoreExtensions.some(ext => filePath.endsWith(ext))) {
            continue;
          }
          
          // Count this file
          countRef.filesChecked++;
          updateCount(countRef.filesChecked);
          
          // Check if file has changed
          const lastModified = stats.mtime.toISOString();
          const fileSize = stats.size;
          
          if (!fileHashes[filePath] || 
              fileHashes[filePath].lastModified !== lastModified ||
              fileHashes[filePath].size !== fileSize) {
            changedFiles.push(filePath);
          }
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
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
        size: stats.size,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      // Skip files that can't be accessed
      if (process.env.TASKTRACKER_DEBUG) {
        console.error(`Could not update hash for ${file}: ${error.message}`);
      }
    }
  });
  
  // Periodically clean up file hashes for files that no longer exist
  // Do this approximately every 10 runs to avoid performance impact
  if (Math.random() < 0.1) {
    cleanupFileHashes(fileHashes);
  }
}

// Helper function to remove stale entries from file hashes
function cleanupFileHashes(fileHashes) {
  const filesToRemove = [];
  
  for (const file in fileHashes) {
    try {
      // Check if file still exists
      fs.statSync(file);
    } catch (error) {
      // File doesn't exist anymore, mark for removal
      filesToRemove.push(file);
    }
  }
  
  // Remove stale entries
  filesToRemove.forEach(file => {
    delete fileHashes[file];
  });
  
  if (filesToRemove.length > 0 && process.env.TASKTRACKER_DEBUG) {
    console.log(`Cleaned up ${filesToRemove.length} stale file hash entries.`);
  }
}

// Import multiple tasks from a JSON or CSV file
function importTasks(filePath) {
  // Check if TaskTracker is initialized
  if (!fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
    process.exit(1);
  }

  // Validate file path
  if (!filePath) {
    console.error('❌ Missing file path. Usage: tasktracker import <file>');
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
    console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
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
  if (!fs.existsSync(TASKS_PATH) || !fs.existsSync(SNAPSHOTS_DIR)) {
    console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
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
    const snapshots = JSON.parse(fs.readFileSync(SNAPSHOTS_DIR, 'utf8'));
    snapshots.push(snapshot);
    fs.writeFileSync(SNAPSHOTS_DIR, JSON.stringify(snapshots, null, 2));
    
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
      console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
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
    if (!fs.existsSync(DATA_DIR)) {
      console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
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
      console.log(`  ${reliableChalk.red('!')} ${file.path} - Complexity Score: ${reliableChalk.red(file.complexity.toFixed(1))}`);
      console.log(`    Lines: ${file.lines}, Nested Blocks: ${file.nestedControlFlow}, Deep Nesting: ${file.nestingDepth > 0 ? reliableChalk.yellow('Yes') : 'No'}`);
      console.log(`    Long Functions: ${file.longFunctions > 0 ? reliableChalk.yellow(file.longFunctions) : '0'}, Long Lines: ${file.longLines}`);
    });
    
    // Save results for tracking and create technical debt tasks
    const debtMetricsPath = path.join(DATA_DIR, 'code_health.json');
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
  console.log('\nUsage: tasktracker <command> [options]');
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
  console.log('  verify                 Verify TaskTracker installation and configuration');
  console.log('  update-config          Update configuration settings');
  console.log('    suppress-chalk-warnings   Hide chalk library warnings');
  console.log('    show-chalk-warnings       Show chalk library warnings');
  console.log('  help                   Show this help information');
  
  console.log('\nExamples:');
  console.log('  tasktracker init');
  console.log('  tasktracker quick "Fix login button" bugfix');
  console.log('  tasktracker list todo');
  console.log('  tasktracker import tasks.json');
  console.log('  tasktracker ai-context 19');
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
  const isInitialized = fs.existsSync(DATA_DIR);
  
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
  console.log('1. Initialize TaskTracker: tasktracker init');
  console.log('2. Add a new task: tasktracker add');
  console.log('3. List all tasks: tasktracker list');
  console.log('4. Update a task status: tasktracker update <id> status <status>');
  console.log('5. View task details: tasktracker view <id>');
  console.log('6. Track file changes: tasktracker changes <path>');
  console.log('7. Import tasks: tasktracker import <file>');
  console.log('8. Create a new release: tasktracker release <version>');
  console.log('9. Generate AI context: tasktracker ai-context <id>');
  console.log('10. Analyze code health: tasktracker code-health <path>');
  console.log('11. Run onboarding: tasktracker onboard');
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

// Export functions for use in other modules
module.exports = {
  showQuickStartGuide
}; 

// Update chalk warning configuration
function updateChalkWarningConfig(showWarnings) {
  try {
    // Check if TaskTracker is initialized
    if (!fs.existsSync(DATA_DIR)) {
      console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
      process.exit(1);
    }
    
    // Load existing config or create a new one
    let config = {};
    if (fs.existsSync(CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
    
    // Update the setting
    config.showChalkWarnings = showWarnings;
    
    // Save the updated config
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    
    console.log(`✅ ${showWarnings ? 'Enabled' : 'Suppressed'} chalk library warnings successfully.`);
  } catch (error) {
    console.error(`❌ Error updating config: ${error.message}`);
    process.exit(1);
  }
} 

// Helper function to load ignore patterns from .taskignore file
function loadIgnorePatterns() {
  let patterns = [...DEFAULT_IGNORE_PATTERNS]; // Start with default patterns
  
  try {
    // Check if .taskignore file exists
    if (fs.existsSync(TASKIGNORE_PATH)) {
      // Read and parse .taskignore file
      const content = fs.readFileSync(TASKIGNORE_PATH, 'utf8');
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')); // Remove empty lines and comments
      
      // Add patterns from .taskignore file
      patterns = [...patterns, ...lines];
      
      console.log(`📄 Loaded ${lines.length} patterns from .taskignore file`);
    }
  } catch (error) {
    // Silently ignore errors and use default patterns
    if (process.env.TASKTRACKER_DEBUG) {
      console.error(`Error loading .taskignore file: ${error.message}`);
    }
  }
  
  return patterns;
}

// Helper function to check if a file path matches any ignore pattern
function isFileIgnored(filePath, ignorePatterns) {
  // Normalize file path for consistent matching
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of ignorePatterns) {
    // Exact match
    if (pattern === normalizedPath) {
      return true;
    }
    
    // Directory match - pattern ends with /**
    if (pattern.endsWith('/**') && normalizedPath.startsWith(pattern.slice(0, -2))) {
      return true;
    }
    
    // File extension match - pattern starts with **/*.
    if (pattern.startsWith('**/*.') && normalizedPath.endsWith(pattern.slice(4))) {
      return true;
    }
    
    // Directory match - pattern contains directory name
    if (pattern.endsWith('/') && normalizedPath.includes(pattern)) {
      return true;
    }
    
    // Handle wildcard patterns
    const regexPattern = pattern
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*\*/g, '.*')  // ** becomes .*
      .replace(/\*/g, '[^/]*'); // * becomes [^/]*
    
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(normalizedPath)) {
      return true;
    }
  }
  
  return false;
} 

// Show current ignore patterns
function showIgnorePatterns() {
  try {
    const defaultPatterns = DEFAULT_IGNORE_PATTERNS;
    let customPatterns = [];
    
    // Check if .taskignore file exists
    if (fs.existsSync(TASKIGNORE_PATH)) {
      // Read and parse .taskignore file
      const content = fs.readFileSync(TASKIGNORE_PATH, 'utf8');
      customPatterns = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }
    
    // In JSON mode, return data directly
    if (globalOptions.json) {
      output({
        defaultPatterns,
        customPatterns
      }, 'data', { output: true });
      return;
    }
    
    output('\n📄 Ignore Patterns:');
    output('\nDefault patterns (always active):');
    defaultPatterns.forEach(pattern => {
      output(`  - ${pattern}`);
    });
    
    if (customPatterns.length > 0) {
      output('\nCustom patterns (.taskignore):');
      customPatterns.forEach(pattern => {
        output(`  - ${pattern}`);
      });
    } else {
      output('\nNo custom patterns found.');
      output('Use "tasktracker ignore add <pattern>" to add patterns or "tasktracker ignore init" to create a default .taskignore file.');
    }
  } catch (error) {
    output('❌ Error showing ignore patterns: ' + error.message, 'error');
  }
}

// Add a new ignore pattern
function addIgnorePattern(pattern) {
  try {
    // Verify pattern is not empty
    if (!pattern || pattern.trim() === '') {
      output('❌ Pattern cannot be empty', 'error');
      return;
    }
    
    let patterns = [];
    
    // Check if .taskignore file exists
    if (fs.existsSync(TASKIGNORE_PATH)) {
      // Read existing patterns
      const content = fs.readFileSync(TASKIGNORE_PATH, 'utf8');
      patterns = content.split('\n')
        .map(line => line.trim())
        .filter(line => line);
    } else {
      // Add a header if creating a new file
      patterns.push('# TaskTracker ignore file');
      patterns.push('# Similar to .gitignore, patterns listed here will be ignored by tasktracker changes');
      patterns.push('');
    }
    
    // Check if pattern already exists
    if (patterns.includes(pattern)) {
      if (globalOptions.json) {
        output({ success: false, message: `Pattern "${pattern}" already exists in .taskignore` }, 'data', { output: true });
      } else {
        output(`ℹ️ Pattern "${pattern}" already exists in .taskignore`);
      }
      return;
    }
    
    // Add the new pattern
    patterns.push(pattern);
    
    // Write updated patterns
    fs.writeFileSync(TASKIGNORE_PATH, patterns.join('\n'));
    
    if (globalOptions.json) {
      output({ success: true, pattern, message: `Added pattern "${pattern}" to .taskignore` }, 'data', { output: true });
    } else {
      output(`✅ Added pattern "${pattern}" to .taskignore`);
    }
  } catch (error) {
    output('❌ Error adding ignore pattern: ' + error.message, 'error');
  }
}

// Remove an ignore pattern
function removeIgnorePattern(pattern) {
  try {
    // Check if .taskignore file exists
    if (!fs.existsSync(TASKIGNORE_PATH)) {
      output('❌ .taskignore file does not exist', 'error');
      return;
    }
    
    // Read existing patterns
    const content = fs.readFileSync(TASKIGNORE_PATH, 'utf8');
    const lines = content.split('\n');
    
    // Find pattern to remove
    const index = lines.findIndex(line => line.trim() === pattern);
    
    if (index === -1) {
      if (globalOptions.json) {
        output({ success: false, message: `Pattern "${pattern}" not found in .taskignore` }, 'data', { output: true });
      } else {
        output(`❌ Pattern "${pattern}" not found in .taskignore`, 'error');
      }
      return;
    }
    
    // Remove the pattern
    lines.splice(index, 1);
    
    // Write updated patterns
    fs.writeFileSync(TASKIGNORE_PATH, lines.join('\n'));
    
    if (globalOptions.json) {
      output({ success: true, pattern, message: `Removed pattern "${pattern}" from .taskignore` }, 'data', { output: true });
    } else {
      output(`✅ Removed pattern "${pattern}" from .taskignore`);
    }
  } catch (error) {
    output('❌ Error removing ignore pattern: ' + error.message, 'error');
  }
}

// Create a default .taskignore file
function initializeIgnoreFile() {
  try {
    // Check if .taskignore file already exists
    if (fs.existsSync(TASKIGNORE_PATH)) {
      if (globalOptions.json) {
        output({ success: false, message: 'taskignore file already exists' }, 'data', { output: true });
      } else {
        output('❌ .taskignore file already exists. Use "tasktracker ignore add <pattern>" to add more patterns.', 'error');
      }
      return;
    }
    
    // Create default .taskignore file content
    const defaultContent = `# TaskTracker ignore file
# Similar to .gitignore, patterns listed here will be ignored by tasktracker changes
# Paths/patterns relative to the project root

# Dependencies
node_modules/
bower_components/
vendor/
package-lock.json
yarn.lock

# Build outputs
dist/
build/
out/
.next/
.nuxt/
coverage/

# Environment and config files
.env
.env.local
.env.*.local
*.config.js
*.config.ts

# Editor and OS files
.vscode/
.idea/
.DS_Store
Thumbs.db

# Log files
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Add your custom ignore patterns below
`;
    
    // Write default .taskignore file
    fs.writeFileSync(TASKIGNORE_PATH, defaultContent);
    
    if (globalOptions.json) {
      output({ success: true, message: 'Created default .taskignore file' }, 'data', { output: true });
    } else {
      output('✅ Created default .taskignore file');
    }
  } catch (error) {
    output('❌ Error creating .taskignore file: ' + error.message, 'error');
  }
}