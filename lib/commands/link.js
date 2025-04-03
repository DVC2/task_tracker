/**
 * TaskTracker Link Command
 * 
 * Manages file links for tasks, including automatic file detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import dependencies
const { output } = require('../core/formatting');
const taskManager = require('../core/task-manager');

/**
 * Detect the current active file based on various methods
 * @returns {string|null} Path to the detected current file or null
 */
function detectCurrentFile() {
  // Try several methods to detect current file
  
  // 1. Check environment variables for editor-specific file paths
  const editorEnvVars = [
    'CURSOR_FILE', // Cursor editor
    'VSCODE_CWD',  // VSCode (might be just the directory)
    'ATOM_HOME'    // Atom (might be just the directory)
  ];
  
  for (const envVar of editorEnvVars) {
    if (process.env[envVar] && fs.existsSync(process.env[envVar])) {
      const envPath = process.env[envVar];
      // Check if the path is a file, not a directory
      if (fs.statSync(envPath).isFile()) {
        return envPath;
      }
    }
  }
  
  // 2. Try to detect from git - most recently modified file
  try {
    const gitOutput = execSync('git ls-files --modified -z').toString().split('\0')[0];
    if (gitOutput && fs.existsSync(gitOutput)) {
      return gitOutput;
    }
  } catch (error) {
    // Git command failed, continue to other methods
  }
  
  // 3. Look for recent files in the project
  try {
    const projectRoot = process.cwd();
    // Find most recently modified files
    const findOutput = execSync(`find ${projectRoot} -type f -not -path "*/\\.*" -mtime -1 | sort -r | head -1`).toString().trim();
    if (findOutput && fs.existsSync(findOutput)) {
      return findOutput;
    }
  } catch (error) {
    // find command failed, continue to other methods
  }
  
  // Couldn't detect the current file
  return null;
}

/**
 * Link a file to a task
 * @param {string[]} args Command arguments (taskId, filePath)
 * @param {object} options Command options
 * @returns {object} Result with status and updated task
 */
function linkFileToTask(args = [], options = {}) {
  try {
    // Parse arguments
    let taskId = args[0];
    let filePath = args[1];
    
    // Validate task ID
    if (!taskId) {
      output('❌ Task ID is required', 'error', { globalOptions: options });
      return { success: false, error: 'Task ID is required' };
    }
    
    // Auto-detect file if not provided
    if (!filePath) {
      if (options.auto === false) {
        output('❌ File path is required', 'error', { globalOptions: options });
        return { success: false, error: 'File path is required' };
      }
      
      // Try to auto-detect the current file
      filePath = detectCurrentFile();
      
      if (!filePath) {
        output('❌ Could not auto-detect current file. Please specify the file path.', 'error', { globalOptions: options });
        return { success: false, error: 'Could not auto-detect current file' };
      }
      
      output(`🔍 Auto-detected file: ${filePath}`, 'info', { globalOptions: options });
    }
    
    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      output(`❌ File does not exist: ${filePath}`, 'error', { globalOptions: options });
      return { success: false, error: `File does not exist: ${filePath}` };
    }
    
    // Get the task to check if it exists
    let task;
    try {
      task = taskManager.getTaskById(taskId);
      if (!task) {
        output(`❌ Task #${taskId} not found`, 'error', { globalOptions: options });
        return { success: false, error: `Task #${taskId} not found` };
      }
    } catch (error) {
      output(`❌ Error getting task: ${error.message}`, 'error', { globalOptions: options });
      return { success: false, error: error.message };
    }
    
    // Check if file is already linked
    if (task.relatedFiles && task.relatedFiles.includes(filePath)) {
      output(`ℹ️ File is already linked to task #${taskId}: ${filePath}`, 'info', { globalOptions: options });
      
      // If force option is set, continue anyway
      if (!options.force) {
        return { success: true, task, alreadyLinked: true };
      }
    }
    
    // Link the file to the task
    try {
      const updatedTask = taskManager.addFileToTask(taskId, filePath);
      output(`✅ Linked file to task #${taskId}: ${filePath}`, 'success', { globalOptions: options });
      
      // Output as JSON if requested
      if (options.json) {
        output(updatedTask, 'data', { globalOptions: options });
      }
      
      return { success: true, task: updatedTask };
    } catch (error) {
      output(`❌ Error linking file: ${error.message}`, 'error', { globalOptions: options });
      return { success: false, error: error.message };
    }
  } catch (error) {
    output(`❌ Error linking file: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Unlink a file from a task
 * @param {string[]} args Command arguments (taskId, filePath)
 * @param {object} options Command options
 * @returns {object} Result with status and updated task
 */
function unlinkFileFromTask(args = [], options = {}) {
  try {
    // Parse arguments
    let taskId = args[0];
    let filePath = args[1];
    
    // Validate task ID
    if (!taskId) {
      output('❌ Task ID is required', 'error', { globalOptions: options });
      return { success: false, error: 'Task ID is required' };
    }
    
    // Auto-detect file if not provided
    if (!filePath) {
      if (options.auto === false) {
        output('❌ File path is required', 'error', { globalOptions: options });
        return { success: false, error: 'File path is required' };
      }
      
      // Try to auto-detect the current file
      filePath = detectCurrentFile();
      
      if (!filePath) {
        output('❌ Could not auto-detect current file. Please specify the file path.', 'error', { globalOptions: options });
        return { success: false, error: 'Could not auto-detect current file' };
      }
      
      output(`🔍 Auto-detected file: ${filePath}`, 'info', { globalOptions: options });
    }
    
    // Get the task to check if it exists
    let task;
    try {
      task = taskManager.getTaskById(taskId);
      if (!task) {
        output(`❌ Task #${taskId} not found`, 'error', { globalOptions: options });
        return { success: false, error: `Task #${taskId} not found` };
      }
    } catch (error) {
      output(`❌ Error getting task: ${error.message}`, 'error', { globalOptions: options });
      return { success: false, error: error.message };
    }
    
    // Check if file is linked
    if (!task.relatedFiles || !task.relatedFiles.includes(filePath)) {
      output(`ℹ️ File is not linked to task #${taskId}: ${filePath}`, 'info', { globalOptions: options });
      return { success: true, task, notLinked: true };
    }
    
    // Unlink the file from the task
    try {
      const updatedTask = taskManager.removeFileFromTask(taskId, filePath);
      output(`✅ Unlinked file from task #${taskId}: ${filePath}`, 'success', { globalOptions: options });
      
      // Output as JSON if requested
      if (options.json) {
        output(updatedTask, 'data', { globalOptions: options });
      }
      
      return { success: true, task: updatedTask };
    } catch (error) {
      output(`❌ Error unlinking file: ${error.message}`, 'error', { globalOptions: options });
      return { success: false, error: error.message };
    }
  } catch (error) {
    output(`❌ Error unlinking file: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * List files linked to a task
 * @param {string[]} args Command arguments (taskId)
 * @param {object} options Command options
 * @returns {object} Result with status and files
 */
function listLinkedFiles(args = [], options = {}) {
  try {
    // Parse arguments
    let taskId = args[0];
    
    // Validate task ID
    if (!taskId) {
      output('❌ Task ID is required', 'error', { globalOptions: options });
      return { success: false, error: 'Task ID is required' };
    }
    
    // Get the task
    let task;
    try {
      task = taskManager.getTaskById(taskId);
      if (!task) {
        output(`❌ Task #${taskId} not found`, 'error', { globalOptions: options });
        return { success: false, error: `Task #${taskId} not found` };
      }
    } catch (error) {
      output(`❌ Error getting task: ${error.message}`, 'error', { globalOptions: options });
      return { success: false, error: error.message };
    }
    
    // Check if task has related files
    if (!task.relatedFiles || task.relatedFiles.length === 0) {
      output(`ℹ️ Task #${taskId} has no linked files`, 'info', { globalOptions: options });
      return { success: true, files: [] };
    }
    
    // Output as JSON if requested
    if (options.json) {
      output({ files: task.relatedFiles }, 'data', { globalOptions: options });
      return { success: true, files: task.relatedFiles };
    }
    
    // Output the linked files
    output(`\n📎 Files linked to task #${taskId}:`, 'info', { globalOptions: options });
    task.relatedFiles.forEach((file, index) => {
      output(`${index + 1}. ${file}`, 'info', { globalOptions: options });
    });
    
    return { success: true, files: task.relatedFiles };
  } catch (error) {
    output(`❌ Error listing linked files: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  detectCurrentFile,
  linkFileToTask,
  unlinkFileFromTask,
  listLinkedFiles
}; 