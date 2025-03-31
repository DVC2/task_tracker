#!/usr/bin/env node

/**
 * TaskTracker - Task Commit Integration
 * 
 * Generates structured git commits that link to TaskTracker tasks.
 * This helps maintain clear relationships between code changes and tasks.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const DATA_DIR = path.join(process.cwd(), '.tasktracker');
const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

// Default commit message template
const DEFAULT_TEMPLATE = '[Task #{id}] {title}: {message}';

/**
 * Generate a structured commit for a task
 * 
 * @param {string} taskId - The ID of the task
 * @param {string} message - Additional commit message
 * @param {Object} options - Options like template, amend, etc.
 */
function generateTaskCommit(taskId, message, options = {}) {
  try {
    // Check if TaskTracker is initialized
    if (!fs.existsSync(TASKS_PATH)) {
      console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
      process.exit(1);
    }

    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    // Find the task
    const task = tasksData.tasks.find(t => t.id.toString() === taskId.toString());
    if (!task) {
      console.error(`❌ Task #${taskId} not found`);
      process.exit(1);
    }

    // Load config to get template if available
    let template = DEFAULT_TEMPLATE;
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        if (config.commitTemplate) {
          template = config.commitTemplate;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Couldn't load commit template: ${error.message}`);
      console.warn('Using default template instead');
    }

    // Override template from options if provided
    if (options.template) {
      template = options.template;
    }

    // Generate commit message
    let commitMessage = template
      .replace('{id}', task.id)
      .replace('{title}', task.title)
      .replace('{category}', task.category)
      .replace('{status}', task.status)
      .replace('{message}', message || '');

    // Clean up any empty placeholders
    commitMessage = commitMessage.replace(/: $/, '');

    // Check if there are staged changes
    try {
      const stagedChanges = execSync('git diff --cached --name-only').toString().trim();
      if (!stagedChanges) {
        console.error('❌ No staged changes found. Stage your changes first with git add.');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to check git status. Is this a git repository?');
      process.exit(1);
    }

    // Record this commit as part of the task
    try {
      // Create a new git commit with the structured message
      const gitCommand = options.amend ? 
        `git commit --amend -m "${commitMessage}"` : 
        `git commit -m "${commitMessage}"`;
      
      console.log(`📝 Creating commit with message: ${commitMessage}`);
      const result = execSync(gitCommand, { stdio: 'pipe' }).toString();
      
      console.log('✅ Commit created successfully!');
      console.log(result);

      // Get the commit hash
      const commitHash = execSync('git log -1 --format=%H').toString().trim();
      
      // Update task with commit info
      if (!task.commits) {
        task.commits = [];
      }
      
      task.commits.push({
        hash: commitHash,
        message: commitMessage,
        date: new Date().toISOString(),
        files: execSync('git show --name-only --format="" HEAD').toString().trim().split('\n')
      });
      
      // Update task last updated timestamp
      task.lastUpdated = new Date().toISOString();
      
      // Write updated task data back to file
      fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
      console.log(`🔗 Linked commit to Task #${taskId}`);

      // Automatically add files to the task if not already associated
      const changedFiles = execSync('git show --name-only --format="" HEAD').toString().trim().split('\n');
      let filesAdded = 0;
      
      if (!task.relatedFiles) {
        task.relatedFiles = [];
      }
      
      changedFiles.forEach(file => {
        if (file && !task.relatedFiles.includes(file)) {
          task.relatedFiles.push(file);
          filesAdded++;
        }
      });
      
      if (filesAdded > 0) {
        fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
        console.log(`📎 Added ${filesAdded} changed file(s) to Task #${taskId}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to create commit: ${error.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Parse arguments for the addfile command
 * @param {Array} args Command arguments
 * @returns {Object} Parsed arguments
 */
function parseAddFileCommand(args) {
  // Separate flags from file paths
  const flags = args.filter(arg => arg.startsWith('--'));
  const files = args.filter(arg => !arg.startsWith('--'));
  
  return {
    taskId: files[0],
    files: files.slice(1),
    flags
  };
}

/**
 * Add files to a task
 * @param {string|number} taskId Task ID
 * @param {Array} files Files to add
 * @param {Object} options Options
 * @returns {boolean} Success
 */
function addFilesToTask(taskId, files, options = {}) {
  // Load task data
  const taskData = loadTaskData();
  
  // Check if task exists
  if (!taskData.tasks[taskId]) {
    console.error(`Error: Task ${taskId} not found`);
    return false;
  }
  
  // Initialize related files array if it doesn't exist
  if (!taskData.tasks[taskId].relatedFiles) {
    taskData.tasks[taskId].relatedFiles = [];
  }
  
  // Add files that don't already exist in the list
  let filesAdded = 0;
  files.forEach(file => {
    // Skip empty values and flags
    if (!file || file.startsWith('--')) {
      return;
    }
    
    // Normalize path
    const normalizedFile = path.normalize(file);
    
    // Add file if it doesn't already exist
    if (!taskData.tasks[taskId].relatedFiles.includes(normalizedFile)) {
      taskData.tasks[taskId].relatedFiles.push(normalizedFile);
      filesAdded++;
    }
  });
  
  // Save task data
  saveTaskData(taskData);
  
  // Log result unless silent mode is enabled
  if (!options.silent) {
    if (filesAdded > 0) {
      console.log(`Added ${filesAdded} file(s) to task ${taskId}`);
    } else {
      console.log(`No new files added to task ${taskId}`);
    }
  }
  
  return true;
}

// Allow use as a command-line script or imported module
if (require.main === module) {
  const args = process.argv.slice(2);
  const taskId = args[0];
  const message = args.slice(1).join(' ');
  
  if (!taskId) {
    console.error('❌ Task ID required');
    console.error('Usage: task-commit <task-id> [commit message]');
    process.exit(1);
  }
  
  generateTaskCommit(taskId, message);
} else {
  module.exports = { generateTaskCommit };
} 