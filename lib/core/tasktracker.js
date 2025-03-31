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

// Root directory of the tasktracker installation
const appRoot = path.resolve(path.join(__dirname, '..', '..'));

// Function to require modules with fallback paths
function requireWithFallback(primaryPath, fallbackPath) {
  try {
    return require(primaryPath);
  } catch (error) {
    try {
      return require(fallbackPath);
    } catch (fallbackError) {
      console.error(`❌ Error: Could not load module from either path:`);
      console.error(`  - Primary: ${primaryPath}`);
      console.error(`  - Fallback: ${fallbackPath}`);
      console.error(`Try running 'tasktracker verify --fix' to repair your installation.`);
      throw new Error(`Module loading failed: ${fallbackError.message}`);
    }
  }
}

// Import dependency tracker
const dependencyTracker = requireWithFallback(
  path.join(__dirname, 'dependency-tracker.js'),
  path.join(appRoot, 'lib', 'dependency-tracker.js')
);

// Find the application root directory and data directory
const DATA_DIR = path.join(appRoot, '.tasktracker');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

// Handle potential chalk compatibility issues
let chalkEnabled = true;
let shouldShowChalkWarning = true;
let terminalSupportsColor = true;

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

// Check if NO_COLOR environment variable is set - respect color suppression standards
if (process.env.NO_COLOR !== undefined || process.env.FORCE_COLOR === '0') {
  terminalSupportsColor = false;
}

try {
  // Test chalk functionality
  chalk.green('test');
} catch (error) {
  chalkEnabled = false;
  
  if (shouldShowChalkWarning) {
    console.warn('⚠️ Advanced terminal formatting disabled due to compatibility issues.');
    console.warn('   Basic formatting will be used instead.');
    console.warn('   To suppress this warning, run: tasktracker update-config suppress-chalk-warnings');
  }
}

// Create a more robust chalk-like fallback object 
const reliableChalk = {
  // Base colors
  red: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.red(text) : `\x1b[31m${text}\x1b[0m`;
  },
  green: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.green(text) : `\x1b[32m${text}\x1b[0m`;
  },
  yellow: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.yellow(text) : `\x1b[33m${text}\x1b[0m`;
  },
  blue: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.blue(text) : `\x1b[34m${text}\x1b[0m`;
  },
  magenta: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.magenta(text) : `\x1b[35m${text}\x1b[0m`;
  },
  cyan: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.cyan(text) : `\x1b[36m${text}\x1b[0m`;
  },
  white: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.white(text) : `\x1b[37m${text}\x1b[0m`;
  },
  gray: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.gray(text) : `\x1b[90m${text}\x1b[0m`;
  },
  grey: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.grey(text) : `\x1b[90m${text}\x1b[0m`;
  },
  dim: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.dim(text) : `\x1b[2m${text}\x1b[0m`;
  },
  bold: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.bold(text) : `\x1b[1m${text}\x1b[0m`;
  },
  // Compound styles
  bgRed: {
    white: text => {
      if (!terminalSupportsColor) return text;
      return chalkEnabled ? chalk.bgRed.white(text) : `\x1b[41m\x1b[37m${text}\x1b[0m`;
    }
  }
};

// Replace all direct chalk references with reliableChalk throughout the code

// Constants
const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
const ARCHIVES_PATH = path.join(DATA_DIR, 'archives.json');
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
  'archive': { script: 'tasktracker.js', description: 'Archive a task' },
  'restore': { script: 'tasktracker.js', description: 'Restore a task from archives' },
  'archives': { script: 'tasktracker.js', description: 'List archived tasks' },
  
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
const command = args.length > 0 ? args[0] : null;
const { commandArgs, options } = parseArgs(args.slice(1));
const globalOptions = options;
const filteredCommandArgs = commandArgs;

// Parse command line arguments
function parseArgs(args) {
  const commandArgs = [];
  const options = {
    nonInteractive: false,
    silent: false,
    json: false,
    minimal: false,  // Minimal output mode
    plain: false,    // Plain text mode with no formatting
    page: 1,         // Current page for pagination
    pageSize: 20,     // Number of items per page
    showArchived: false // Whether to show archived tasks
  };
  
  // Process each argument
  args.forEach(arg => {
    if (arg === '--non-interactive' || arg === '--ni') {
      options.nonInteractive = true;
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (arg === '--json' || arg === '-j') {
      options.json = true;
    } else if (arg === '--minimal' || arg === '-m') {  // New minimal output mode
      options.minimal = true;
    } else if (arg === '--plain' || arg === '-p') {    // New plain text mode
      options.plain = true;
      // Plain mode enforces no terminal formatting
      terminalSupportsColor = false;
    } else if (arg.startsWith('--page=')) {            // Pagination: current page
      const pageNum = parseInt(arg.split('=')[1]);
      if (!isNaN(pageNum) && pageNum > 0) {
        options.page = pageNum;
      }
    } else if (arg.startsWith('--page-size=')) {       // Pagination: page size
      const size = parseInt(arg.split('=')[1]);
      if (!isNaN(size) && size > 0) {
        options.pageSize = size;
      }
    } else if (arg === '--show-archived' || arg === '--archived') {
      options.showArchived = true;
    } else {
      commandArgs.push(arg);
    }
  });
  
  return { commandArgs, options };
}

// Get terminal dimensions, or use defaults if not available
function getTerminalDimensions() {
  try {
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    return { width: cols, height: rows };
  } catch (error) {
    return { width: 80, height: 24 };
  }
}

// Output function with minimal mode support
function output(message, type = 'info', options = {}) {
  // In silent mode, only output errors and data
  if (globalOptions.silent && type !== 'error' && type !== 'data') {
    return;
  }
  
  // In minimal mode, use compact output (except for errors and data)
  if (globalOptions.minimal && type !== 'error' && type !== 'data') {
    // Simplify formatted output
    if (typeof message === 'string') {
      // Remove emoji and decorative chars for minimal output
      message = message
        .replace(/^[^a-zA-Z0-9]*/, '')  // Remove leading non-alphanumeric (emojis, etc)
        .replace(/─+/g, '-')            // Replace fancy separator with simple dash
        .replace(/[│├┤┌┐└┘┬┴┼]/g, '|')  // Replace box drawing chars with pipe
        .replace(/^\s+|\s+$/g, '')      // Trim whitespace
        .replace(/\n+/g, '\n');         // Remove multiple blank lines
    }
  }
  
  // Handle data output (usually for --json mode)
  if (type === 'data') {
    if (options.field && typeof options.field === 'string') {
      // If a specific field is requested, output just that field as JSON
      const dataObj = { [options.field]: message };
      console.log(JSON.stringify(dataObj, null, 2));
    } else {
      // Otherwise output the entire message as JSON
      console.log(JSON.stringify(message, null, 2));
    }
    return;
  }
  
  // For normal output, print the message
  if (typeof message === 'string') {
    console.log(message);
  } else {
    console.log(JSON.stringify(message, null, 2));
  }
}

// Function to update a task
function updateTask(taskId, field, values) {
  try {
    if (!taskId) {
      output('❌ Task ID required', 'error');
      return;
    }
    
    if (!field) {
      output('❌ Field to update required', 'error');
      return;
    }
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const task = tasksData.tasks.find(t => t.id.toString() === taskId.toString());
    
    if (!task) {
      output(`❌ Task #${taskId} not found`, 'error');
      return;
    }
    
    // Handle different field updates
    let fieldValue = values.join(' ');
    let updated = true;
    
    // Constants for validation
    const MAX_TITLE_LENGTH = 200;
    const MAX_DESCRIPTION_LENGTH = 2000;
    const MAX_COMMENT_LENGTH = 2000;
    
    // Function to sanitize input text
    const sanitizeText = (text) => {
      if (!text) return '';
      
      // Escape special characters that might cause formatting issues
      return text
        .replace(/\n/g, ' ')  // Replace newlines with spaces
        .replace(/[\r\t\f\v]/g, ' ')  // Replace other whitespace with spaces
        .trim();  // Trim leading/trailing whitespace
    };
    
    // Function to validate file path
    const validateFilePath = (filePath, operation) => {
      if (!filePath) return { valid: false, reason: 'File path cannot be empty' };
      
      // Check for path traversal attempts
      if (filePath.includes('..')) {
        return { valid: false, reason: 'Path traversal not allowed. File paths cannot contain ".."' };
      }
      
      // Check for absolute paths (platform-specific)
      const isAbsolutePath = path.isAbsolute(filePath);
      if (isAbsolutePath) {
        // For security, we don't want to allow absolute paths unless they're within the project
        const normalizedPath = path.normalize(filePath);
        const projectRoot = process.cwd();
        
        if (!normalizedPath.startsWith(projectRoot)) {
          return { 
            valid: false, 
            reason: `Absolute path must be within project directory (${projectRoot})`
          };
        }
      }
      
      // Check if file exists for add-file operations
      if (operation === 'add-file') {
        try {
          // Ensure path is relative to project root
          const fullPath = isAbsolutePath ? filePath : path.join(process.cwd(), filePath);
          
          if (!fs.existsSync(fullPath)) {
            return { 
              valid: false, 
              reason: `File does not exist: ${filePath}`
            };
          }
          
          const stats = fs.statSync(fullPath);
          if (!stats.isFile()) {
            return { 
              valid: false, 
              reason: `Path exists but is not a file: ${filePath}`
            };
          }
        } catch (error) {
          return { valid: false, reason: `Error validating file: ${error.message}` };
        }
      }
      
      return { valid: true };
    };
    
    switch (field.toLowerCase()) {
      case 'status':
        // Update status
        const status = values[0]?.toLowerCase();
        if (!status) {
          output('❌ Status value required', 'error');
          return;
        }
        
        // Load config to check valid statuses
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const validStatuses = (config.taskStatuses || ['todo', 'in-progress', 'review', 'done']).map(s => s.toLowerCase());
        
        if (!validStatuses.includes(status)) {
          output(`❌ Invalid status: "${status}"`, 'error');
          output(`Valid statuses: ${validStatuses.join(', ')}`);
          return;
        }
        
        task.status = status;
        break;
      
      case 'category':
        // Update category
        const category = values[0]?.toLowerCase();
        if (!category) {
          output('❌ Category value required', 'error');
          return;
        }
        
        // Load config to check valid categories
        const configCat = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const validCategories = (configCat.taskCategories || ['feature', 'bugfix', 'docs', 'test', 'chore']).map(c => c.toLowerCase());
        
        if (!validCategories.includes(category)) {
          output(`❌ Invalid category: "${category}"`, 'error');
          output(`Valid categories: ${validCategories.join(', ')}`);
          return;
        }
        
        task.category = category;
        break;
      
      case 'title':
        // Update title
        if (!fieldValue) {
          output('❌ Title value required', 'error');
          return;
        }
        
        // Sanitize and validate title
        const sanitizedTitle = sanitizeText(fieldValue);
        
        // Check title length
        if (sanitizedTitle.length > MAX_TITLE_LENGTH) {
          output(`❌ Title too long (${sanitizedTitle.length} chars). Maximum length is ${MAX_TITLE_LENGTH} characters.`, 'error');
          return;
        }
        
        // Check if title is too short
        if (sanitizedTitle.length < 3) {
          output(`❌ Title too short (${sanitizedTitle.length} chars). Minimum length is 3 characters.`, 'error');
          return;
        }
        
        task.title = sanitizedTitle;
        break;
      
      case 'desc':
      case 'description':
        // Update description
        const sanitizedDesc = sanitizeText(fieldValue || '');
        
        // Check description length
        if (sanitizedDesc.length > MAX_DESCRIPTION_LENGTH) {
          output(`❌ Description too long (${sanitizedDesc.length} chars). Maximum length is ${MAX_DESCRIPTION_LENGTH} characters.`, 'error');
          return;
        }
        
        task.description = sanitizedDesc;
        break;
      
      case 'priority':
        // Update priority
        const priority = values[0];
        if (!priority) {
          output('❌ Priority value required', 'error');
          return;
        }
        
        // Load config to check valid priorities
        const configPrio = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const validPriorities = configPrio.priorityLevels || ['p0-critical', 'p2-medium', 'p3-low'];
        
        if (!validPriorities.includes(priority)) {
          output(`❌ Invalid priority: "${priority}"`, 'error');
          output(`Valid priorities: ${validPriorities.join(', ')}`);
          return;
        }
        
        task.priority = priority;
        break;
      
      case 'effort':
        // Update effort estimation
        const effort = values[0];
        if (!effort) {
          output('❌ Effort value required', 'error');
          return;
        }
        
        // Load config to check valid effort levels
        const configEffort = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const validEfforts = configEffort.effortEstimation || ['1-trivial', '2-small', '3-medium', '5-large', '8-xlarge'];
        
        if (!validEfforts.includes(effort)) {
          output(`❌ Invalid effort: "${effort}"`, 'error');
          output(`Valid effort estimations: ${validEfforts.join(', ')}`);
          return;
        }
        
        task.effort = effort;
        break;
      
      case 'comment':
        // Add a comment
        if (!fieldValue) {
          output('❌ Comment text required', 'error');
          return;
        }
        
        // Check comment length
        if (fieldValue.length > MAX_COMMENT_LENGTH) {
          output(`❌ Comment too long (${fieldValue.length} chars). Maximum length is ${MAX_COMMENT_LENGTH} characters.`, 'error');
          return;
        }
        
        if (!task.comments) {
          task.comments = [];
        }
        
        task.comments.push({
          author: process.env.USER || process.env.USERNAME || 'Unknown',
          date: new Date().toISOString(),
          text: fieldValue
        });
        break;
      
      case 'addfile':
      case 'add-file':
        // Add a related file
        const filePath = values[0];
        if (!filePath) {
          output('❌ File path required', 'error');
          return;
        }
        
        // Validate file path
        const fileValidation = validateFilePath(filePath, 'add-file');
        if (!fileValidation.valid) {
          output(`❌ Invalid file path: ${fileValidation.reason}`, 'error');
          return;
        }
        
        // Normalize the path to handle different path formats
        const normalizedPath = path.normalize(filePath);
        
        if (!task.relatedFiles) {
          task.relatedFiles = [];
        }
        
        if (!task.relatedFiles.includes(normalizedPath)) {
          task.relatedFiles.push(normalizedPath);
        } else {
          output(`⚠️ File "${normalizedPath}" is already associated with this task.`, 'warning');
        }
        break;
      
      case 'removefile':
      case 'remove-file':
        // Remove file from task
        const fileToRemove = values[0];
        if (!fileToRemove) {
          output('❌ File path required', 'error');
          return;
        }
        
        // Check if task has related files
        if (!task.relatedFiles || !Array.isArray(task.relatedFiles)) {
          task.relatedFiles = [];
          output('❌ Task has no related files', 'error');
          return;
        }
        
        // Find the file in the related files list (case-insensitive)
        const fileIndex = task.relatedFiles.findIndex(f => 
          f.toLowerCase() === fileToRemove.toLowerCase() ||
          path.normalize(f).toLowerCase() === path.normalize(fileToRemove).toLowerCase()
        );
        
        if (fileIndex === -1) {
          output(`❌ File "${fileToRemove}" not found in task #${taskId}`, 'error');
          return;
        }
        
        // Remove the file
        task.relatedFiles.splice(fileIndex, 1);
        output(`✅ Removed file "${fileToRemove}" from task #${taskId}`, 'success');
        break;
      
      case 'depends-on':
        // Add dependency relationship
        const dependsOnId = values[0];
        if (!dependsOnId) {
          output('❌ Dependency task ID required', 'error');
          return;
        }
        
        // Get options like --silent
        const dependsOnOptions = {
          silent: values.includes('--silent')
        };
        
        // Use the dependency tracker to add the relationship
        updateTaskDependency(taskId, dependsOnId, dependsOnOptions);
        // Skip the default task update since dependency is stored separately
        return;
      
      case 'remove-dependency':
        // Remove dependency relationship
        const dependencyToRemove = values[0];
        if (!dependencyToRemove) {
          output('❌ Dependency task ID required', 'error');
          return;
        }
        
        // Get options like --silent
        const removeDependencyOptions = {
          silent: values.includes('--silent')
        };
        
        // Use the dependency tracker to remove the relationship
        removeTaskDependency(taskId, dependencyToRemove, removeDependencyOptions);
        // Skip the default task update since dependency is stored separately
        return;
      
      default:
        output(`❌ Unknown field: ${field}`, 'error');
        output('Valid fields: status, category, title, description, priority, effort, comment, addfile, removefile, depends-on, remove-dependency');
        updated = false;
        break;
    }
    
    if (updated) {
      // Update the last updated timestamp
      task.lastUpdated = new Date().toISOString();
      
      // Save the updated tasks
      fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
      
      if (!globalOptions.silent) {
        output(`✅ Task #${taskId} updated successfully.`);
        
        // Show the task details
        output(`\n📝 Task Details:`);
        output(`╔════════════════════════════════════════════════════════════════════════════╗`);
        output(`║ Task #${task.id}: ${task.title}`);
        output(`╠════════════════════════════════════════════════════════════════════════════╣`);
        output(`║ Status: ${task.status}                 Category: ${task.category}`);
        output(`║ Created: ${new Date(task.created).toLocaleString()}`);
        output(`║ Updated: ${new Date(task.lastUpdated).toLocaleString()}`);
        
        if (task.createdBy) {
          output(`║ Created by: ${task.createdBy}`);
        }
        
        if (task.branch) {
          output(`║ Branch: ${task.branch}`);
        }
        
        if (task.priority) {
          output(`║ Priority: ${task.priority}`);
        }
        
        if (task.effort) {
          output(`║ Effort: ${task.effort}`);
        }
        
        output(`╠════════════════════════════════════════════════════════════════════════════╣`);
        
        if (task.description) {
          output(`║ Description:`);
          output(`║   ${task.description.split('\n').join('\n║   ')}`);
          output(`╠════════════════════════════════════════════════════════════════════════════╣`);
        }
        
        if (task.comments && task.comments.length > 0) {
          output(`║ Comments:`);
          task.comments.forEach(comment => {
            const date = new Date(comment.date).toLocaleString();
            output(`║   [${date}] ${comment.author}: ${comment.text.split('\n').join('\n║     ')}`);
          });
          output(`╠════════════════════════════════════════════════════════════════════════════╣`);
        }
        
        if (task.relatedFiles && task.relatedFiles.length > 0) {
          output(`║ Related Files:`);
          task.relatedFiles.forEach(file => {
            output(`║   ${file}`);
          });
          output(`╠════════════════════════════════════════════════════════════════════════════╣`);
        }
        
        output(`╚════════════════════════════════════════════════════════════════════════════╝`);
      }
      
      if (globalOptions.json) {
        output(task, 'data');
      }
    }
  } catch (error) {
    output(`❌ Error updating task: ${error.message}`, 'error');
  }
}

// Function to view a task
function viewTask(taskId) {
  try {
    if (!taskId) {
      output('❌ Task ID required', 'error');
      return;
    }
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const task = tasksData.tasks.find(t => t.id.toString() === taskId.toString());
    
    if (!task) {
      output(`❌ Task #${taskId} not found`, 'error');
      return;
    }
    
    // Check if verbose output is requested
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    
    // Load dependencies if available
    let dependencies = [];
    let blockedBy = [];
    try {
      dependencies = dependencyTracker.getDependencies(taskId);
      blockedBy = dependencyTracker.getBlockedBy(taskId);
    } catch (error) {
      if (isVerbose) {
        output(`⚠️ Could not load dependencies: ${error.message}`, 'warning');
      }
    }
    
    // Format output
    const statusEmoji = getStatusEmoji(task.status);
    const priorityLabel = getPriorityLabel(task.priority);
    
    const taskTitle = task.title || 'No title';
    const taskDescription = task.description || 'No description';
    
    // Create a box for the task
    const taskTitleColored = colorize(`Task #${task.id}: ${taskTitle}`, task.status, task.category);
    
    // Calculate available width
    const termWidth = getTerminalDimensions().width;
    
    // Create separator line
    const separatorLine = '─'.repeat(Math.min(termWidth - 2, 80));
    
    output('\n┌' + separatorLine + '┐');
    output('│ ' + taskTitleColored + ' '.repeat(Math.max(2, separatorLine.length - taskTitleColored.length)) + '│');
    output('├' + separatorLine + '┤');
    
    // Status and metadata
    output(`│ Status: ${statusEmoji} ${colorize(task.status, task.status)}${' '.repeat(Math.max(2, separatorLine.length - 10 - task.status.length))}│`);
    output(`│ Category: ${task.category || 'None'}${' '.repeat(Math.max(2, separatorLine.length - 11 - (task.category || 'None').length))}│`);
    
    if (task.priority) {
      output(`│ Priority: ${priorityLabel}${' '.repeat(Math.max(2, separatorLine.length - 11 - priorityLabel.length))}│`);
    }
    
    if (task.effort) {
      output(`│ Effort: ${task.effort}${' '.repeat(Math.max(2, separatorLine.length - 9 - task.effort.length))}│`);
    }
    
    // Created date
    if (task.createdAt) {
      const createdDate = new Date(task.createdAt).toLocaleString();
      output(`│ Created: ${createdDate}${' '.repeat(Math.max(2, separatorLine.length - 10 - createdDate.length))}│`);
    }
    
    // Updated date
    if (task.updatedAt) {
      const updatedDate = new Date(task.updatedAt).toLocaleString();
      output(`│ Updated: ${updatedDate}${' '.repeat(Math.max(2, separatorLine.length - 10 - updatedDate.length))}│`);
    }
    
    // Display dependencies
    if (dependencies.length > 0) {
      const dependsOnStr = `Depends on: #${dependencies.join(', #')}`;
      output(`│ ${dependsOnStr}${' '.repeat(Math.max(2, separatorLine.length - 2 - dependsOnStr.length))}│`);
    }
    
    // Display tasks that are blocked by this one
    if (blockedBy.length > 0) {
      const blockedByStr = `Blocks: #${blockedBy.join(', #')}`;
      output(`│ ${blockedByStr}${' '.repeat(Math.max(2, separatorLine.length - 2 - blockedByStr.length))}│`);
    }
    
    output('├' + separatorLine + '┤');
    
    // Description
    const descLines = wrapText(taskDescription, Math.min(termWidth - 6, 78));
    output(`│ Description:${' '.repeat(Math.max(2, separatorLine.length - 13))}│`);
    descLines.forEach(line => {
      output(`│   ${line}${' '.repeat(Math.max(2, separatorLine.length - 3 - line.length))}│`);
    });
    
    // Related files
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      output('├' + separatorLine + '┤');
      output(`│ Related Files:${' '.repeat(Math.max(2, separatorLine.length - 15))}│`);
      
      task.relatedFiles.forEach(file => {
        const displayFile = file.length > separatorLine.length - 5 ? 
          '...' + file.substring(file.length - (separatorLine.length - 8)) : file;
        
        output(`│   ${displayFile}${' '.repeat(Math.max(2, separatorLine.length - 3 - displayFile.length))}│`);
      });
    }
    
    // Comments
    if (task.comments && task.comments.length > 0) {
      output('├' + separatorLine + '┤');
      output(`│ Comments:${' '.repeat(Math.max(2, separatorLine.length - 10))}│`);
      
      task.comments.forEach(comment => {
        const commentDate = new Date(comment.timestamp).toLocaleString();
        const commentHeader = `[${commentDate}]`;
        output(`│ ${commentHeader}${' '.repeat(Math.max(2, separatorLine.length - 2 - commentHeader.length))}│`);
        
        const commentLines = wrapText(comment.text, Math.min(termWidth - 6, 78));
        commentLines.forEach(line => {
          output(`│   ${line}${' '.repeat(Math.max(2, separatorLine.length - 3 - line.length))}│`);
        });
      });
    }
    
    output('└' + separatorLine + '┘\n');
    
  } catch (error) {
    output('❌ Error viewing task: ' + error.message, 'error');
  }
}

// Function to list tasks
function listTasks(statusFilter, showCurrentOnly, showFull, priorityFilter, categoryFilter, keywordFilter) {
  try {
    if (!fs.existsSync(TASKS_PATH)) {
      output('❌ No tasks found. Initialize TaskTracker first: tasktracker init', 'error');
      return;
    }
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
      output('📋 No tasks found.');
      return;
    }
    
    // Filter tasks based on criteria
    let filteredTasks = tasksData.tasks;
    
    // Apply status filter
    if (statusFilter) {
      filteredTasks = filteredTasks.filter(task => 
        task.status.toLowerCase() === statusFilter.toLowerCase()
      );
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks with status "${statusFilter}" found.`);
        return;
      }
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filteredTasks = filteredTasks.filter(task => 
        task.priority && task.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks with priority "${priorityFilter}" found.`);
        return;
      }
    }
    
    // Apply category filter
    if (categoryFilter) {
      filteredTasks = filteredTasks.filter(task => 
        task.category.toLowerCase() === categoryFilter.toLowerCase()
      );
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks in category "${categoryFilter}" found.`);
        return;
      }
    }
    
    // Apply keyword filter
    if (keywordFilter) {
      const searchTerm = keywordFilter.toLowerCase();
      filteredTasks = filteredTasks.filter(task => {
        // Search in title, description, and comments
        const titleMatch = task.title.toLowerCase().includes(searchTerm);
        const descMatch = task.description && task.description.toLowerCase().includes(searchTerm);
        
        // Search in comments if they exist
        let commentMatch = false;
        if (task.comments && task.comments.length > 0) {
          commentMatch = task.comments.some(comment => 
            comment.text.toLowerCase().includes(searchTerm)
          );
        }
        
        return titleMatch || descMatch || commentMatch;
      });
      
      if (filteredTasks.length === 0) {
        output(`📋 No tasks matching keyword "${keywordFilter}" found.`);
        return;
      }
    }
    
    // Sort tasks by ID
    filteredTasks = filteredTasks.sort((a, b) => a.id - b.id);
    
    // Get terminal dimensions for display formatting
    const terminalDims = getTerminalDimensions();
    
    // Output as JSON if requested
    if (globalOptions.json) {
      const result = {
        success: true,
        data: {
          tasks: filteredTasks
        },
        errors: []
      };
      
      output(result, 'data');
      return;
    }
    
    // Output as minimal text if requested
    if (globalOptions.minimal) {
      output(`Total: ${filteredTasks.length} tasks`);
      
      filteredTasks.forEach(task => {
        output(`#${task.id} [${task.status.toUpperCase()}] ${task.title} [${task.category}]${task.priority ? ` (${task.priority})` : ''}`);
      });
      
      return;
    }
    
    // Format tasks for display
    output(`\n📋 Task List:`);
    
    // Get terminal dimensions
    const termDimensions = getTerminalDimensions();
    const isCompactMode = termDimensions.width < 80;
    
    // Calculate dynamic column widths based on terminal width and content
    let idColWidth, statusColWidth, titleColWidth, categoryColWidth;
    let priorityColWidth, effortColWidth;
    
    // Determine the longest content in each column to set appropriate widths
    const longestId = Math.max(...filteredTasks.map(task => task.id.toString().length));
    const longestStatus = Math.max(...filteredTasks.map(task => task.status.length));
    const longestCategory = Math.max(...filteredTasks.map(task => task.category.length));
    const longestTitle = Math.max(...filteredTasks.map(task => task.title.length));
    const longestPriority = filteredTasks.some(task => task.priority) ? 
      Math.max(...filteredTasks.filter(task => task.priority).map(task => task.priority.length)) : 0;
    const longestEffort = filteredTasks.some(task => task.effort) ? 
      Math.max(...filteredTasks.filter(task => task.effort).map(task => task.effort.length)) : 0;
    
    // Set base widths (compact mode has smaller columns)
    if (isCompactMode) {
      // Compact mode - minimize column widths for small terminals
      idColWidth = Math.min(Math.max(longestId + 1, 3), 4);
      statusColWidth = Math.min(Math.max(longestStatus + 1, 6), 10);
      categoryColWidth = Math.min(Math.max(longestCategory + 2, 6), 10);
      
      // For compact mode, title gets most of the remaining space
      const availableWidth = termDimensions.width - idColWidth - statusColWidth - categoryColWidth - 7; // 7 for separators and spacing
      titleColWidth = Math.max(15, availableWidth);
      
      // Skip priority and effort columns in compact mode
      priorityColWidth = 0;
      effortColWidth = 0;
    } else {
      // Normal mode - more comfortable column widths
      idColWidth = 5;
      statusColWidth = 12;
      categoryColWidth = 14;
      
      // Check if we should include priority/effort columns
      const includeExtendedInfo = termDimensions.width >= 120 && !showCurrentOnly;
      
      if (includeExtendedInfo) {
        priorityColWidth = Math.max(longestPriority + 2, 10);
        effortColWidth = Math.max(longestEffort + 2, 10);
        
        // Calculate title width based on available space
        const availableWidth = termDimensions.width - idColWidth - statusColWidth - 
                              categoryColWidth - priorityColWidth - effortColWidth - 13; // 13 for separators and margins
        titleColWidth = Math.max(20, availableWidth);
      } else {
        priorityColWidth = 0;
        effortColWidth = 0;
        
        // Calculate title width based on available space
        const availableWidth = termDimensions.width - idColWidth - statusColWidth - categoryColWidth - 7;
        titleColWidth = Math.max(25, availableWidth);
      }
    }
    
    // Function to create a boxed table row
    const createRow = (id, status, title, category, priority = '', effort = '') => {
      // Truncate title if needed
      let displayTitle = title;
      if (title.length > titleColWidth) {
        displayTitle = title.substring(0, titleColWidth - 3) + '...';
      }
      
      // Format each cell with proper padding
      const idCell = `${id}`.padEnd(idColWidth);
      const statusCell = `${status}`.padEnd(statusColWidth);
      const titleCell = `${displayTitle}`.padEnd(titleColWidth);
      const categoryCell = `${category}`.padEnd(categoryColWidth);
      
      // Build the basic row
      let row = `│ ${idCell} │ ${statusCell} │ ${titleCell} │ ${categoryCell} │`;
      
      // Add priority and effort if applicable
      if (priorityColWidth > 0 && effortColWidth > 0) {
        const priorityCell = `${priority}`.padEnd(priorityColWidth);
        const effortCell = `${effort}`.padEnd(effortColWidth);
        row += ` ${priorityCell} │ ${effortCell} │`;
      }
      
      return row;
    };
    
    // Create header row
    let headerRow = createRow(
      '#ID', 
      'STATUS', 
      'Title', 
      'Category',
      priorityColWidth > 0 ? 'Priority' : '',
      effortColWidth > 0 ? 'Effort' : ''
    );
    
    // Create horizontal separator lines
    const createSeparator = (char, connector) => {
      let line = `${connector}${char.repeat(idColWidth + 2)}${connector}${char.repeat(statusColWidth + 2)}`;
      line += `${connector}${char.repeat(titleColWidth + 2)}${connector}${char.repeat(categoryColWidth + 2)}`;
      
      if (priorityColWidth > 0 && effortColWidth > 0) {
        line += `${connector}${char.repeat(priorityColWidth + 2)}${connector}${char.repeat(effortColWidth + 2)}`;
      }
      
      line += connector;
      return line;
    };
    
    // Create the separator lines
    const topLine = createSeparator('─', isCompactMode ? '+' : '┌┬');
    const headerSeparator = createSeparator('─', isCompactMode ? '+' : '├┼');
    const bottomLine = createSeparator('─', isCompactMode ? '+' : '└┴');
    
    // Display the table header
    output(topLine);
    output(headerRow);
    output(headerSeparator);
    
    // Display each task row
    filteredTasks.forEach(task => {
      // Map status to consistent formats with color hints
      let statusDisplay = task.status.toUpperCase();
      
      // Format status with color hint characters
      if (statusDisplay === 'TODO') {
        statusDisplay = '⬜ TODO';
      } else if (statusDisplay === 'IN-PROGRESS') {
        statusDisplay = '🔵 IN-PROG';
      } else if (statusDisplay === 'REVIEW') {
        statusDisplay = '🟡 REVIEW';
      } else if (statusDisplay === 'DONE') {
        statusDisplay = '✅ DONE';
      }
      
      // Format priority with color hint characters if needed
      let priorityDisplay = '';
      if (task.priority) {
        if (task.priority.startsWith('p0')) {
          priorityDisplay = '🔴 ' + task.priority;
        } else if (task.priority.startsWith('p1')) {
          priorityDisplay = '🟠 ' + task.priority;
        } else if (task.priority.startsWith('p2')) {
          priorityDisplay = '🟢 ' + task.priority;
        } else {
          priorityDisplay = '⚪ ' + task.priority;
        }
      }
      
      const row = createRow(
        `#${task.id}`,
        statusDisplay,
        task.title,
        `[${task.category}]`,
        priorityDisplay,
        task.effort || ''
      );
      
      output(row);
    });
    
    // Display the table footer
    output(bottomLine);
    output(`Total: ${filteredTasks.length} tasks`);
    
    // Show help for filtering if applicable
    if (!statusFilter && !priorityFilter && !categoryFilter && !keywordFilter) {
      output(`\nHint: Filter using status, --priority=X, --category=Y, or --keyword=Z`);
    }
    
    // If show full details is requested, show detailed view for each task
    if (showFull) {
      output('\nDetailed views:');
      filteredTasks.forEach(task => {
        viewTask(task.id);
      });
    }
  } catch (error) {
    output(`❌ Error listing tasks: ${error.message}`, 'error');
  }
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

// Function to initialize TaskTracker in the current directory
function initializeTaskTracker() {
  try {
    console.log('\n🚀 Initializing TaskTracker...');
    
    // Create TaskTracker directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log('✅ Created TaskTracker directory: ' + DATA_DIR);
    } else {
      console.log('ℹ️ TaskTracker directory already exists');
    }
    
    // Create tasks.json if it doesn't exist
    if (!fs.existsSync(TASKS_PATH)) {
      fs.writeFileSync(TASKS_PATH, JSON.stringify({ lastId: 0, tasks: [] }, null, 2));
      console.log('✅ Created tasks database: ' + TASKS_PATH);
    } else {
      console.log('ℹ️ Tasks database already exists');
    }
    
    // Create file-hashes.json if it doesn't exist
    if (!fs.existsSync(FILE_HASHES_PATH)) {
      fs.writeFileSync(FILE_HASHES_PATH, JSON.stringify({}, null, 2));
      console.log('✅ Created file hashes database: ' + FILE_HASHES_PATH);
    } else {
      console.log('ℹ️ File hashes database already exists');
    }
    
    // Create config.json if it doesn't exist
    if (!fs.existsSync(CONFIG_PATH)) {
      // Default configuration
      const defaultConfig = {
        taskCategories: ['feature', 'bug', 'docs', 'test', 'refactor', 'chore'],
        taskStatuses: ['todo', 'in-progress', 'review', 'done'],
        priorityLevels: ['p1-critical', 'p2-medium', 'p3-low'],
        effortEstimation: ['1-trivial', '2-small', '3-medium', '5-large', '8-xlarge'],
        currentTask: null,
        showChalkWarnings: true
      };
      
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      console.log('✅ Created default configuration: ' + CONFIG_PATH);
    } else {
      console.log('ℹ️ Configuration file already exists');
    }
    
    // Create directories if they don't exist
    const requiredDirs = [SNAPSHOTS_DIR, REPORTS_DIR, STATS_DIR];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('✅ Created directory: ' + dir);
      }
    }
    
    // Create .taskignore file if it doesn't exist
    if (!fs.existsSync(TASKIGNORE_PATH)) {
      initializeIgnoreFile();
    }
    
    console.log('\n🎉 TaskTracker initialized successfully!');
    console.log('Run `tasktracker help` to see available commands.');
  } catch (error) {
    console.error('❌ Error initializing TaskTracker: ' + error.message);
    process.exit(1);
  }
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
    // Check for filter flags
    let statusFilter = null;
    let priorityFilter = null;
    let categoryFilter = null;
    let keywordFilter = null;
    const showCurrentOnly = filteredCommandArgs.includes('--current');
    const showFull = filteredCommandArgs.includes('--full');

    // Process filter arguments
    for (const arg of filteredCommandArgs) {
      if (arg === '--current' || arg === '--full') {
        continue;
      } else if (arg.startsWith('--priority=')) {
        priorityFilter = arg.split('=')[1];
      } else if (arg.startsWith('--category=')) {
        categoryFilter = arg.split('=')[1];
      } else if (arg.startsWith('--keyword=')) {
        keywordFilter = arg.split('=')[1];
      } else if (!arg.startsWith('--')) {
        // If no flag prefix, assume it's a status filter (backward compatibility)
        statusFilter = arg;
      }
    }

    listTasks(statusFilter, showCurrentOnly, showFull, priorityFilter, categoryFilter, keywordFilter);
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

// Handle archive command directly in this script
if (command === 'archive') {
  archiveTask(filteredCommandArgs[0], filteredCommandArgs.slice(1).join(' ')); // Task ID, reason (optional)
  exitWithCode(0);
}

// Handle restore command directly in this script
if (command === 'restore') {
  restoreTask(filteredCommandArgs[0]); // Task ID
  exitWithCode(0);
}

// Handle archives command directly in this script
if (command === 'archives') {
  listArchivedTasks(); // Lists all archived tasks
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

/**
 * Colorize output based on task status and category
 * @param {string} text Text to colorize 
 * @param {string} status Task status
 * @param {string} category Task category
 * @returns {string} Colorized text
 */
function colorize(text, status, category) {
  if (!text) return '';
  
  // Import chalk if needed
  const chalk = require('chalk');
  
  // Check if chalk is available
  if (!chalk.supportsColor) {
    return text;
  }
  
  // Determine color based on status
  if (status) {
    switch (status.toLowerCase()) {
      case 'todo':
        return chalk.blue(text);
      case 'in-progress':
      case 'in progress':
      case 'inprogress':
        return chalk.yellow(text);
      case 'review':
        return chalk.magenta(text);
      case 'done':
        return chalk.green(text);
      case 'blocked':
        return chalk.red(text);
    }
  }
  
  // Fallback to category-based coloring
  if (category) {
    switch (category.toLowerCase()) {
      case 'feature':
        return chalk.blue(text);
      case 'bugfix':
        return chalk.red(text);
      case 'docs':
        return chalk.cyan(text);
      case 'test':
        return chalk.magenta(text);
      case 'chore':
        return chalk.gray(text);
    }
  }
  
  // Default
  return text;
}

// New function to archive a task
function archiveTask(taskId, reason = '') {
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
    
    output(`✅ Task #${taskId} archived successfully.`);
    
    // Display task details
    output(`📝 Archived Task Details:`);
    displayTaskDetails(taskToArchive);
    
  } catch (error) {
    output(`❌ Error archiving task: ${error.message}`, 'error');
  }
}

// New function to restore a task from archive
function restoreTask(taskId) {
  try {
    if (!taskId) {
      output('❌ Task ID required', 'error');
      return;
    }
    
    // Check if archives exist
    if (!fs.existsSync(ARCHIVES_PATH)) {
      output('❌ No archived tasks found', 'error');
      return;
    }
    
    // Load archives
    const archivesData = JSON.parse(fs.readFileSync(ARCHIVES_PATH, 'utf8'));
    
    if (!archivesData.archives || archivesData.archives.length === 0) {
      output('❌ No archived tasks found', 'error');
      return;
    }
    
    // Find task in archives
    const taskIndex = archivesData.archives.findIndex(t => t.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      output(`❌ Archived task #${taskId} not found`, 'error');
      return;
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
      return;
    }
    
    // Add task back to tasks list
    tasksData.tasks.push(taskToRestore);
    
    // Remove task from archives
    archivesData.archives.splice(taskIndex, 1);
    
    // Save updated tasks and archives
    fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
    fs.writeFileSync(ARCHIVES_PATH, JSON.stringify(archivesData, null, 2));
    
    output(`✅ Task #${taskId} restored successfully.`);
    
    // Display task details
    output(`📝 Restored Task Details:`);
    displayTaskDetails(taskToRestore);
    
  } catch (error) {
    output(`❌ Error restoring task: ${error.message}`, 'error');
  }
}

// New function to list archived tasks
function listArchivedTasks() {
  try {
    // Check if archives exist
    if (!fs.existsSync(ARCHIVES_PATH)) {
      output('📦 No archived tasks found.');
      return;
    }
    
    // Load archives
    const archivesData = JSON.parse(fs.readFileSync(ARCHIVES_PATH, 'utf8'));
    
    if (!archivesData.archives || archivesData.archives.length === 0) {
      output('📦 No archived tasks found.');
      return;
    }
    
    // Sort archives by ID
    const sortedArchives = [...archivesData.archives].sort((a, b) => a.id - b.id);
    
    // Get terminal dimensions for display formatting
    const terminalDims = getTerminalDimensions();
    
    // If JSON output is requested
    if (globalOptions.json) {
      output(sortedArchives, 'data');
      return;
    }
    
    // If minimal output is requested
    if (globalOptions.minimal) {
      sortedArchives.forEach(task => {
        output(`#${task.id}: ${task.title} [${task.status}] [${task.category}] [Archived: ${new Date(task.archived.date).toLocaleDateString()}]`);
      });
      return;
    }
    
    // Otherwise, display formatted table
    output('📦 Archived Tasks:');
    
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
    
    output(header);
    output(headerRow);
    output(divider);
    
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
      
      output(`│ ${id} │ ${status} │ ${title} │ ${category} │ ${date} │`);
    });
    
    output(footer);
    output(`Total: ${sortedArchives.length} archived tasks\n`);
    
  } catch (error) {
    output(`❌ Error listing archived tasks: ${error.message}`, 'error');
  }
}

// Main execution
if (command) {
  switch (command.toLowerCase()) {
    // ... existing cases ...
    
    // Add the archive command
    case 'archive':
      const taskIdToArchive = filteredCommandArgs[0];
      const archiveReason = filteredCommandArgs.slice(1).join(' ');
      archiveTask(taskIdToArchive, archiveReason);
      break;
      
    // Add the restore command
    case 'restore':
      const taskIdToRestore = filteredCommandArgs[0];
      restoreTask(taskIdToRestore);
      break;
      
    // Add the archives command
    case 'archives':
      listArchivedTasks();
      break;
      
    // ... other cases ...
  }
}

// Function to display task details
function displayTaskDetails(task) {
  try {
    if (!task) {
      output('No task details available', 'error');
      return;
    }
    
    // If JSON output is requested
    if (globalOptions.json) {
      output(task, 'data');
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
    output(topBorder);
    output(`║ ${taskHeader.padEnd(width - 1)}║`);
    output(midBorder);
    
    // Format task properties
    const status = `Status: ${task.status.padEnd(20)}`;
    const category = `Category: ${task.category}`;
    const priorityText = task.priority ? `Priority: ${task.priority.padEnd(12)}` : ' '.repeat(25);
    const effortText = task.effort ? `Effort: ${task.effort}` : '';
    
    output(`║ ${status} ${category.padEnd(width - status.length - 8)}║`);
    
    if (task.priority || task.effort) {
      output(`║ ${priorityText} ${effortText.padEnd(width - priorityText.length - 8)}║`);
    }
    
    // Format dates
    const created = `Created: ${new Date(task.created).toLocaleString()}`;
    const updated = task.lastUpdated ? `Updated: ${new Date(task.lastUpdated).toLocaleString()}` : '';
    
    output(`║ ${created.padEnd(width - 1)}║`);
    if (updated) {
      output(`║ ${updated.padEnd(width - 1)}║`);
    }
    
    // Creator and branch info
    if (task.createdBy) {
      output(`║ Created by: ${task.createdBy.padEnd(width - 13)}║`);
    }
    
    if (task.branch) {
      output(`║ Branch: ${task.branch.padEnd(width - 9)}║`);
    }
    
    // If archived, show archive info
    if (task.archived) {
      output(midBorder);
      const archivedDate = `Archived: ${new Date(task.archived.date).toLocaleString()}`;
      output(`║ ${archivedDate.padEnd(width - 1)}║`);
      if (task.archived.reason) {
        output(`║ Reason: ${task.archived.reason.padEnd(width - 9)}║`);
      }
    }
    
    // Comments section
    if (task.comments && task.comments.length > 0) {
      output(midBorder);
      output(`║ Comments:${' '.repeat(width - 10)}║`);
      
      task.comments.forEach(comment => {
        const date = new Date(comment.date).toLocaleString();
        const header = `  [${date}] ${comment.author}: `;
        const indent = ' '.repeat(header.length);
        
        // Word wrap comment text
        let text = comment.text;
        let line = header;
        let isFirstLine = true;
        
        while (text.length > 0) {
          const availableSpace = width - (isFirstLine ? header.length : indent.length) - 1;
          let chunk;
          
          if (text.length <= availableSpace) {
            chunk = text;
            text = '';
          } else {
            // Find a good breaking point
            let breakPoint = text.lastIndexOf(' ', availableSpace);
            if (breakPoint === -1 || breakPoint < availableSpace / 2) {
              breakPoint = availableSpace;
            }
            chunk = text.substring(0, breakPoint);
            text = text.substring(breakPoint + (text[breakPoint] === ' ' ? 1 : 0));
          }
          
          if (isFirstLine) {
            output(`║ ${line}${chunk.padEnd(width - line.length - 1)}║`);
            isFirstLine = false;
          } else {
            output(`║ ${indent}${chunk.padEnd(width - indent.length - 1)}║`);
          }
        }
      });
    }
    
    // Related files
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      output(midBorder);
      output(`║ Related Files:${' '.repeat(width - 15)}║`);
      
      task.relatedFiles.forEach(file => {
        const fileText = `  ${file}`;
        const maxFileLength = width - 3;
        
        if (fileText.length <= maxFileLength) {
          output(`║ ${fileText.padEnd(width - 1)}║`);
        } else {
          // Truncate long file paths with ellipsis
          const truncated = fileText.substring(0, maxFileLength - 3) + '...';
          output(`║ ${truncated.padEnd(width - 1)}║`);
        }
      });
    }
    
    // Dependencies section
    if ((task.dependencies && task.dependencies.length > 0) || 
        (task.blockedBy && task.blockedBy.length > 0)) {
      output(midBorder);
      
      if (task.dependencies && task.dependencies.length > 0) {
        const depsText = `Dependencies: ${task.dependencies.map(id => `#${id}`).join(', ')}`;
        output(`║ ${depsText.padEnd(width - 1)}║`);
      }
      
      if (task.blockedBy && task.blockedBy.length > 0) {
        const blockersText = `Blocked by: ${task.blockedBy.map(id => `#${id}`).join(', ')}`;
        output(`║ ${blockersText.padEnd(width - 1)}║`);
      }
    }
    
    // Close box
    output(bottomBorder);
    
  } catch (error) {
    output(`❌ Error displaying task details: ${error.message}`, 'error');
  }
}

/**
 * Update task dependency relationship
 * @param {string|number} taskId Task ID
 * @param {string|number} dependsOnId ID of the task that taskId depends on
 * @param {Object} options Options
 */
function updateTaskDependency(taskId, dependsOnId, options = {}) {
  // Validate task IDs
  if (!taskId) {
    output('❌ Task ID required', 'error');
    return;
  }
  
  if (!dependsOnId) {
    output('❌ Dependency task ID required', 'error');
    return;
  }
  
  // Load task data to ensure both tasks exist
  const taskData = loadTasks();
  
  if (!taskData.tasks[taskId]) {
    output(`❌ Task ${taskId} not found`, 'error');
    return;
  }
  
  if (!taskData.tasks[dependsOnId]) {
    output(`❌ Dependency task ${dependsOnId} not found`, 'error');
    return;
  }
  
  // Prevent self-dependencies
  if (taskId === dependsOnId) {
    output('❌ A task cannot depend on itself', 'error');
    return;
  }
  
  // Add the dependency
  const success = dependencyTracker.addDependency(taskId, dependsOnId);
  
  if (success) {
    if (!options.silent) {
      output(`✅ Task ${taskId} now depends on task ${dependsOnId}`, 'success');
    }
  } else {
    output(`❌ Failed to update dependency`, 'error');
  }
}

/**
 * Remove task dependency relationship
 * @param {string|number} taskId Task ID
 * @param {string|number} dependsOnId ID of the task that taskId no longer depends on
 * @param {Object} options Options
 */
function removeTaskDependency(taskId, dependsOnId, options = {}) {
  // Validate task IDs
  if (!taskId) {
    output('❌ Task ID required', 'error');
    return;
  }
  
  if (!dependsOnId) {
    output('❌ Dependency task ID required', 'error');
    return;
  }
  
  // Load task data to ensure both tasks exist
  const taskData = loadTasks();
  
  if (!taskData.tasks[taskId]) {
    output(`❌ Task ${taskId} not found`, 'error');
    return;
  }
  
  if (!taskData.tasks[dependsOnId]) {
    output(`❌ Dependency task ${dependsOnId} not found`, 'error');
    return;
  }
  
  // Remove the dependency
  const success = dependencyTracker.removeDependency(taskId, dependsOnId);
  
  if (success) {
    if (!options.silent) {
      output(`✅ Removed dependency relationship between tasks ${taskId} and ${dependsOnId}`, 'success');
    }
  } else {
    output(`❌ Failed to remove dependency`, 'error');
  }
}

/**
 * Get an emoji for a given status
 * @param {string} status Task status
 * @returns {string} Emoji representation of the status
 */
function getStatusEmoji(status) {
  if (!status) return '❓';
  
  switch (status.toLowerCase()) {
    case 'todo':
      return '📋';
    case 'in-progress':
    case 'in progress':
    case 'inprogress':
      return '🔄';
    case 'review':
      return '👀';
    case 'done':
      return '✅';
    case 'blocked':
      return '🚫';
    default:
      return '❓';
  }
}

/**
 * Get a formatted label for a priority
 * @param {string} priority Task priority
 * @returns {string} Formatted label
 */
function getPriorityLabel(priority) {
  if (!priority) return 'None';
  
  switch (priority.toLowerCase()) {
    case 'p0-critical':
      return '🔴 P0-Critical';
    case 'p1-high':
      return '🟠 P1-High';
    case 'p2-medium':
      return '🟡 P2-Medium';
    case 'p3-low':
      return '🟢 P3-Low';
    default:
      return priority;
  }
}

/**
 * Wrap text to a specified width
 * @param {string} text Text to wrap 
 * @param {number} width Width to wrap to
 * @returns {string[]} Array of wrapped lines
 */
function wrapText(text, width) {
  if (!text) return ['None'];
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine.length === 0 ? '' : ' ') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : ['None'];
}