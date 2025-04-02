/**
 * TaskTracker Update Command
 * 
 * Handles updating existing tasks with new information
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output } = require('../core/formatting');
const configManager = require('../core/config-manager');
const taskManager = require('../core/task-manager');

// Operation constants
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_COMMENT_LENGTH = 2000;

/**
 * Update an existing task
 * @param {string|number} taskId ID of the task to update
 * @param {string} field Field to update
 * @param {string[]} values New values for the field
 * @param {object} options Operation options
 * @returns {object} Result with updated task and status
 */
function updateTask(taskId, field, values, options = {}) {
  try {
    if (!taskId) {
      output('❌ Task ID required', 'error', { globalOptions: options });
      return { success: false, error: 'Task ID required' };
    }
    
    if (!field) {
      output('❌ Field to update required', 'error', { globalOptions: options });
      return { success: false, error: 'Field to update required' };
    }
    
    // Combine values into a single string for some fields
    const fieldValue = values.join(' ');
    
    // Sanitize input text
    const sanitizeText = (text) => {
      if (!text) return '';
      
      // Escape special characters that might cause formatting issues
      return text
        .replace(/\n/g, ' ')  // Replace newlines with spaces
        .replace(/[\r\t\f\v]/g, ' ')  // Replace other whitespace with spaces
        .trim();  // Trim leading/trailing whitespace
    };
    
    // Validate file path
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
    
    // First get the task to verify it exists
    const task = taskManager.getTaskById(taskId);
    
    if (!task) {
      output(`❌ Task #${taskId} not found`, 'error', { globalOptions: options });
      return { success: false, error: `Task #${taskId} not found` };
    }
    
    // Define updates to apply
    let updates = {};
    let result = { success: true };
    
    switch (field.toLowerCase()) {
      case 'status':
        // Update status
        const status = values[0]?.toLowerCase();
        if (!status) {
          output('❌ Status value required', 'error', { globalOptions: options });
          return { success: false, error: 'Status value required' };
        }
        
        // Get valid statuses from config
        const validStatuses = configManager.getValidStatuses();
        
        if (!validStatuses.includes(status)) {
          output(`❌ Invalid status: "${status}"`, 'error', { globalOptions: options });
          output(`Valid statuses: ${validStatuses.join(', ')}`, 'info', { globalOptions: options });
          return { success: false, error: `Invalid status: "${status}"` };
        }
        
        updates.status = status;
        break;
      
      case 'category':
        // Update category
        const category = values[0]?.toLowerCase();
        if (!category) {
          output('❌ Category value required', 'error', { globalOptions: options });
          return { success: false, error: 'Category value required' };
        }
        
        // Get valid categories from config
        const validCategories = configManager.getValidCategories();
        
        if (!validCategories.includes(category)) {
          output(`❌ Invalid category: "${category}"`, 'error', { globalOptions: options });
          output(`Valid categories: ${validCategories.join(', ')}`, 'info', { globalOptions: options });
          return { success: false, error: `Invalid category: "${category}"` };
        }
        
        updates.category = category;
        break;
      
      case 'title':
        // Update title
        if (!fieldValue) {
          output('❌ Title value required', 'error', { globalOptions: options });
          return { success: false, error: 'Title value required' };
        }
        
        // Sanitize and validate title
        const sanitizedTitle = sanitizeText(fieldValue);
        
        // Check title length
        if (sanitizedTitle.length > MAX_TITLE_LENGTH) {
          output(`❌ Title too long (${sanitizedTitle.length} chars). Maximum length is ${MAX_TITLE_LENGTH} characters.`, 'error', { globalOptions: options });
          return { success: false, error: `Title too long (${sanitizedTitle.length} chars). Maximum is ${MAX_TITLE_LENGTH}` };
        }
        
        // Check if title is too short
        if (sanitizedTitle.length < 3) {
          output(`❌ Title too short (${sanitizedTitle.length} chars). Minimum length is 3 characters.`, 'error', { globalOptions: options });
          return { success: false, error: `Title too short (${sanitizedTitle.length} chars). Minimum is 3` };
        }
        
        updates.title = sanitizedTitle;
        break;
      
      case 'desc':
      case 'description':
        // Update description
        const sanitizedDesc = sanitizeText(fieldValue || '');
        
        // Check description length
        if (sanitizedDesc.length > MAX_DESCRIPTION_LENGTH) {
          output(`❌ Description too long (${sanitizedDesc.length} chars). Maximum length is ${MAX_DESCRIPTION_LENGTH} characters.`, 'error', { globalOptions: options });
          return { success: false, error: `Description too long (${sanitizedDesc.length} chars). Maximum is ${MAX_DESCRIPTION_LENGTH}` };
        }
        
        updates.description = sanitizedDesc;
        break;
      
      case 'priority':
        // Update priority
        const priority = values[0];
        if (!priority) {
          output('❌ Priority value required', 'error', { globalOptions: options });
          return { success: false, error: 'Priority value required' };
        }
        
        // Get valid priorities from config
        const validPriorities = configManager.getValidPriorities();
        
        if (!validPriorities.includes(priority)) {
          output(`❌ Invalid priority: "${priority}"`, 'error', { globalOptions: options });
          output(`Valid priorities: ${validPriorities.join(', ')}`, 'info', { globalOptions: options });
          return { success: false, error: `Invalid priority: "${priority}"` };
        }
        
        updates.priority = priority;
        break;
      
      case 'effort':
        // Update effort estimation
        const effort = values[0];
        if (!effort) {
          output('❌ Effort value required', 'error', { globalOptions: options });
          return { success: false, error: 'Effort value required' };
        }
        
        // Get valid effort levels from config
        const validEfforts = configManager.getValidEfforts();
        
        if (!validEfforts.includes(effort)) {
          output(`❌ Invalid effort: "${effort}"`, 'error', { globalOptions: options });
          output(`Valid effort estimations: ${validEfforts.join(', ')}`, 'info', { globalOptions: options });
          return { success: false, error: `Invalid effort: "${effort}"` };
        }
        
        updates.effort = effort;
        break;
      
      case 'comment':
        // Add a comment to the task
        if (!fieldValue) {
          output('❌ Comment text required', 'error', { globalOptions: options });
          return { success: false, error: 'Comment text required' };
        }
        
        // Check comment length
        if (fieldValue.length > MAX_COMMENT_LENGTH) {
          output(`❌ Comment too long (${fieldValue.length} chars). Maximum length is ${MAX_COMMENT_LENGTH} characters.`, 'error', { globalOptions: options });
          return { success: false, error: `Comment too long (${fieldValue.length} chars). Maximum is ${MAX_COMMENT_LENGTH}` };
        }
        
        // Use the task manager to add comment
        try {
          const commentAuthor = process.env.USER || process.env.USERNAME || 'Unknown';
          result.task = taskManager.addCommentToTask(taskId, fieldValue, commentAuthor);
        } catch (error) {
          output(`❌ Error adding comment: ${error.message}`, 'error', { globalOptions: options });
          return { success: false, error: error.message };
        }
        
        // Skip the default update since comment was already added
        break;
      
      case 'addfile':
      case 'add-file':
        // Add a related file
        const filePath = values[0];
        if (!filePath) {
          output('❌ File path required', 'error', { globalOptions: options });
          return { success: false, error: 'File path required' };
        }
        
        // Validate file path
        const fileValidation = validateFilePath(filePath, 'add-file');
        if (!fileValidation.valid) {
          output(`❌ Invalid file path: ${fileValidation.reason}`, 'error', { globalOptions: options });
          return { success: false, error: `Invalid file path: ${fileValidation.reason}` };
        }
        
        // Use the task manager to add file
        try {
          result.task = taskManager.addFileToTask(taskId, filePath);
        } catch (error) {
          output(`❌ Error adding file: ${error.message}`, 'error', { globalOptions: options });
          return { success: false, error: error.message };
        }
        
        // Skip the default update since file was already added
        break;
      
      case 'removefile':
      case 'remove-file':
        // Remove file from task
        const fileToRemove = values[0];
        if (!fileToRemove) {
          output('❌ File path required', 'error', { globalOptions: options });
          return { success: false, error: 'File path required' };
        }
        
        // Use the task manager to remove file
        try {
          result.task = taskManager.removeFileFromTask(taskId, fileToRemove);
          output(`✅ Removed file "${fileToRemove}" from task #${taskId}`, 'success', { globalOptions: options });
        } catch (error) {
          output(`❌ Error removing file: ${error.message}`, 'error', { globalOptions: options });
          return { success: false, error: error.message };
        }
        
        // Skip the default update since file was already removed
        break;
      
      default:
        output(`❌ Unknown field: ${field}`, 'error', { globalOptions: options });
        output('Valid fields: status, category, title, description, priority, effort, comment, addfile, removefile', 'info', { globalOptions: options });
        return { success: false, error: `Unknown field: ${field}` };
    }
    
    // If we have updates to apply, use the task manager to update the task
    if (Object.keys(updates).length > 0) {
      try {
        result.task = taskManager.updateTask(taskId, updates);
      } catch (error) {
        output(`❌ Error updating task: ${error.message}`, 'error', { globalOptions: options });
        return { success: false, error: error.message };
      }
    }
    
    // If we reach this point and have no task in the result, something went wrong
    if (!result.task) {
      output(`❌ Error updating task #${taskId}`, 'error', { globalOptions: options });
      return { success: false, error: `Error updating task #${taskId}` };
    }
    
    // Log success message (unless silent mode)
    if (!options.silent) {
      output(`✅ Task #${taskId} updated successfully.`, 'success', { globalOptions: options });
    }
    
    // Show the task details (unless silent mode)
    if (!options.silent) {
      output(`\n📝 Task Details:`, 'info', { globalOptions: options });
      displayTaskDetails(result.task, options);
    }
    
    // If JSON output is requested, output the task as JSON
    if (options.json) {
      output(result.task, 'data', { globalOptions: options });
    }
    
    return { success: true, task: result.task };
  } catch (error) {
    output(`❌ Error updating task: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Display task details in a formatted box
 * @param {object} task Task object to display
 * @param {object} options Display options
 */
function displayTaskDetails(task, options = {}) {
  if (!task) {
    output('No task details available', 'error', { globalOptions: options });
    return;
  }
  
  if (options.json) {
    output(task, 'data', { globalOptions: options });
    return;
  }
  
  output(`╔════════════════════════════════════════════════════════════════════════════╗`, 'info', { globalOptions: options });
  output(`║ Task #${task.id}: ${task.title}`, 'info', { globalOptions: options });
  output(`╠════════════════════════════════════════════════════════════════════════════╣`, 'info', { globalOptions: options });
  output(`║ Status: ${task.status}                 Category: ${task.category}`, 'info', { globalOptions: options });
  output(`║ Created: ${new Date(task.created).toLocaleString()}`, 'info', { globalOptions: options });
  output(`║ Updated: ${new Date(task.lastUpdated).toLocaleString()}`, 'info', { globalOptions: options });
  
  if (task.createdBy) {
    output(`║ Created by: ${task.createdBy}`, 'info', { globalOptions: options });
  }
  
  if (task.branch) {
    output(`║ Branch: ${task.branch}`, 'info', { globalOptions: options });
  }
  
  if (task.priority) {
    output(`║ Priority: ${task.priority}`, 'info', { globalOptions: options });
  }
  
  if (task.effort) {
    output(`║ Effort: ${task.effort}`, 'info', { globalOptions: options });
  }
  
  output(`╠════════════════════════════════════════════════════════════════════════════╣`, 'info', { globalOptions: options });
  
  if (task.description) {
    output(`║ Description:`, 'info', { globalOptions: options });
    output(`║   ${task.description.split('\n').join('\n║   ')}`, 'info', { globalOptions: options });
    output(`╠════════════════════════════════════════════════════════════════════════════╣`, 'info', { globalOptions: options });
  }
  
  if (task.comments && task.comments.length > 0) {
    output(`║ Comments:`, 'info', { globalOptions: options });
    task.comments.forEach(comment => {
      const date = new Date(comment.date).toLocaleString();
      output(`║   [${date}] ${comment.author}: ${comment.text.split('\n').join('\n║     ')}`, 'info', { globalOptions: options });
    });
    output(`╠════════════════════════════════════════════════════════════════════════════╣`, 'info', { globalOptions: options });
  }
  
  if (task.relatedFiles && task.relatedFiles.length > 0) {
    output(`║ Related Files:`, 'info', { globalOptions: options });
    task.relatedFiles.forEach(file => {
      output(`║   ${file}`, 'info', { globalOptions: options });
    });
    output(`╠════════════════════════════════════════════════════════════════════════════╣`, 'info', { globalOptions: options });
  }
  
  output(`╚════════════════════════════════════════════════════════════════════════════╝`, 'info', { globalOptions: options });
}

module.exports = {
  updateTask
}; 