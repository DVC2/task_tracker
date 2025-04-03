/**
 * TaskTracker Task Manager
 * 
 * Centralizes task CRUD operations and data access
 */

const fs = require('fs');
const path = require('path');
const { output } = require('./formatting');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Data paths (will be initialized)
let TASKS_PATH = '';
let ARCHIVES_PATH = '';
let CONFIG_PATH = '';
let DATA_DIR = '';

// Constants for security
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_COMMENT_LENGTH = 2000;
const VALID_FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html', '.md', '.json', '.txt'];

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  // Ensure rootDir is defined, fallback to current directory if not
  const appRoot = rootDir || process.cwd();
  
  // Ensure paths are set correctly
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(appRoot, '.tasktracker');
  TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  ARCHIVES_PATH = path.join(DATA_DIR, 'archives.json');
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load existing tasks data with proper validation
 * @returns {object} Tasks data with tasks array and lastId
 */
function loadTasks() {
  try {
    // Check if paths are initialized
    if (!TASKS_PATH) {
      throw new Error('Paths not initialized. Call initPaths first.');
    }
    
    // Read the tasks file
    const fileContent = fs.existsSync(TASKS_PATH) ? fs.readFileSync(TASKS_PATH, 'utf8') : "{}";
    
    // Safely parse the JSON with validation
    let tasksData;
    try {
      tasksData = JSON.parse(fileContent);
    } catch (parseError) {
      output(`❌ Error parsing tasks file: ${parseError.message}`, 'error');
      // Create backup of corrupted file
      const backupPath = `${TASKS_PATH}.corrupted.${Date.now()}`;
      fs.writeFileSync(backupPath, fileContent);
      output(`📋 Created backup of corrupted file at ${backupPath}`, 'info');
      return { tasks: [], lastId: 0 };
    }
    
    // Validate the structure
    if (!tasksData || typeof tasksData !== 'object') {
      return { tasks: [], lastId: 0 };
    }
    
    // Ensure tasks array exists and is valid
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      tasksData.tasks = [];
    }
    
    // Filter out invalid tasks and fix IDs
    tasksData.tasks = tasksData.tasks
      .filter(task => task && typeof task === 'object')
      .map(task => {
        // Fix ID if it's not a number
        if (task.id === undefined || task.id === null || isNaN(Number(task.id))) {
          // Assign a temporary ID that will be replaced later
          task.id = 0;
        } else {
          // Ensure ID is a number
          task.id = Number(task.id);
        }
        return task;
      });
    
    // Ensure lastId is valid
    if (typeof tasksData.lastId !== 'number' || isNaN(tasksData.lastId)) {
      // Find the highest ID in tasks
      tasksData.lastId = tasksData.tasks.length > 0 
        ? Math.max(...tasksData.tasks.map(t => t.id)) 
        : 0;
    }
    
    // Fix any tasks with ID 0 (invalid IDs)
    tasksData.tasks = tasksData.tasks.map(task => {
      if (task.id === 0) {
        tasksData.lastId++;
        task.id = tasksData.lastId;
      }
      return task;
    });
    
    return tasksData;
  } catch (error) {
    output(`❌ Critical error loading tasks: ${error.message}`, 'error');
    return { tasks: [], lastId: 0 };
  }
}

/**
 * Load a specific task by ID
 * @param {string|number} taskId Task ID to load
 * @returns {object|null} Task object or null if not found
 */
function getTaskById(taskId) {
  if (!taskId) return null;
  
  try {
    // Convert ID to number for strict comparison
    const numericId = Number(taskId);
    if (isNaN(numericId)) {
      throw new Error(`Invalid task ID: ${taskId}`);
    }
    
    const tasksData = loadTasks();
    return tasksData.tasks.find(task => task.id === numericId) || null;
  } catch (error) {
    throw new Error(`Failed to get task #${taskId}: ${error.message}`);
  }
}

/**
 * Create a backup of tasks file
 * @returns {string|null} Backup file path or null if failed
 */
function backupTasksFile() {
  try {
    if (!fs.existsSync(TASKS_PATH)) {
      return null; // No file to backup
    }
    
    const backupPath = `${TASKS_PATH}.backup.${Date.now()}`;
    fs.copyFileSync(TASKS_PATH, backupPath);
    return backupPath;
  } catch (error) {
    output(`⚠️ Failed to create backup: ${error.message}`, 'warning');
    return null;
  }
}

/**
 * Save tasks data with atomic write operation
 * @param {object} tasksData Object with tasks and lastId
 */
function saveTasks(tasksData) {
  try {
    // Ensure the data directory exists with proper permissions
    ensureSecureDirectory(path.dirname(TASKS_PATH));
    
    // Create a backup before saving
    backupTasksFile();
    
    // Validate data before saving
    if (!tasksData || typeof tasksData !== 'object') {
      throw new Error('Invalid tasks data structure');
    }
    
    if (!Array.isArray(tasksData.tasks)) {
      tasksData.tasks = [];
    }
    
    // Ensure lastId is a number
    if (typeof tasksData.lastId !== 'number' || isNaN(tasksData.lastId)) {
      tasksData.lastId = tasksData.tasks.length > 0 
        ? Math.max(...tasksData.tasks.map(t => Number(t.id) || 0)) 
        : 0;
    }
    
    // Prepare data for saving
    const jsonData = JSON.stringify(tasksData, null, 2);
    
    // Write to a temporary file first
    const tempPath = `${TASKS_PATH}.tmp`;
    fs.writeFileSync(tempPath, jsonData);
    
    // Set secure permissions on the temporary file
    if (process.platform !== 'win32') {
      fs.chmodSync(tempPath, 0o600); // Only owner can read/write
    }
    
    // Atomic rename to ensure consistency
    fs.renameSync(tempPath, TASKS_PATH);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to save tasks: ${error.message}`);
  }
}

/**
 * Ensure a directory exists with secure permissions
 * @param {string} dirPath Path to ensure exists
 */
function ensureSecureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    // Create directory with secure permissions
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
  } else {
    // Check if directory has secure permissions
    if (process.platform !== 'win32') {
      try {
        const stats = fs.statSync(dirPath);
        const currentMode = stats.mode & 0o777; // Get permission bits
        
        // If permissions are too open, restrict them
        if (currentMode & 0o077) { // Check if group/others have any permissions
          fs.chmodSync(dirPath, 0o700); // Only owner can read/write/execute
        }
      } catch (error) {
        console.warn(`Warning: Could not check/set permissions on ${dirPath}: ${error.message}`);
      }
    }
  }
}

/**
 * Validate task data to prevent security issues
 * @param {object} taskData Task data to validate
 * @returns {object} Validated and sanitized task data
 * @throws {Error} If validation fails
 */
function validateTaskData(taskData) {
  if (!taskData) {
    throw new Error('Task data is required');
  }
  
  // Create a copy to avoid mutating the original
  const sanitizedTask = { ...taskData };
  
  // Validate title (required)
  if (!sanitizedTask.title || typeof sanitizedTask.title !== 'string') {
    throw new Error('Task title is required and must be a string');
  }
  
  // Enforce length limits
  sanitizedTask.title = sanitizeString(sanitizedTask.title).substring(0, MAX_TITLE_LENGTH);
  
  if (sanitizedTask.title.length === 0) {
    throw new Error('Task title cannot be empty after sanitization');
  }
  
  if (sanitizedTask.description) {
    sanitizedTask.description = sanitizeString(sanitizedTask.description).substring(0, MAX_DESCRIPTION_LENGTH);
  }
  
  if (sanitizedTask.category) {
    sanitizedTask.category = sanitizeString(sanitizedTask.category);
  }
  
  if (sanitizedTask.status) {
    sanitizedTask.status = sanitizeString(sanitizedTask.status);
  }
  
  if (sanitizedTask.priority) {
    sanitizedTask.priority = sanitizeString(sanitizedTask.priority);
  }
  
  if (sanitizedTask.effort) {
    sanitizedTask.effort = sanitizeString(sanitizedTask.effort);
  }
  
  // Sanitize arrays of strings
  if (sanitizedTask.relatedFiles && Array.isArray(sanitizedTask.relatedFiles)) {
    const validFiles = [];
    const invalidFiles = [];
    
    // Validate each file path
    sanitizedTask.relatedFiles.forEach(file => {
      if (typeof file !== 'string') {
        return; // Skip non-string files
      }
      
      const pathValidation = validateFilePath(file);
      if (pathValidation.valid) {
        validFiles.push(path.normalize(file));
      } else {
        invalidFiles.push({file, reason: pathValidation.reason});
      }
    });
    
    // Log invalid files but don't throw errors
    if (invalidFiles.length > 0) {
      output(`⚠️ Skipped ${invalidFiles.length} invalid file paths:`, 'warning');
      invalidFiles.forEach(({file, reason}) => {
        output(`  - "${file}": ${reason}`, 'warning');
      });
    }
    
    sanitizedTask.relatedFiles = validFiles;
  } else {
    sanitizedTask.relatedFiles = [];
  }
  
  // Handle other properties that might contain user input
  if (sanitizedTask.comments && Array.isArray(sanitizedTask.comments)) {
    sanitizedTask.comments = sanitizedTask.comments
      .filter(comment => comment && typeof comment === 'object')
      .map(comment => {
        return {
          text: comment.text ? sanitizeString(comment.text).substring(0, MAX_COMMENT_LENGTH) : '',
          author: comment.author ? sanitizeString(comment.author) : '',
          date: comment.date && !isNaN(new Date(comment.date).getTime()) 
            ? comment.date 
            : new Date().toISOString()
        };
      });
  } else {
    sanitizedTask.comments = [];
  }
  
  // Ensure checklists are valid
  if (sanitizedTask.checklists && Array.isArray(sanitizedTask.checklists)) {
    sanitizedTask.checklists = sanitizedTask.checklists
      .filter(list => list && typeof list === 'object')
      .map(list => {
        return {
          title: list.title ? sanitizeString(list.title) : 'Untitled Checklist',
          items: Array.isArray(list.items) 
            ? list.items
                .filter(item => item && typeof item === 'object')
                .map(item => ({
                  text: item.text ? sanitizeString(item.text) : '',
                  completed: !!item.completed
                }))
            : []
        };
      });
  } else {
    sanitizedTask.checklists = [];
  }
  
  return sanitizedTask;
}

/**
 * Sanitize a string to prevent security issues
 * @param {string} str String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Simple sanitization without DOMPurify to prevent spacing issues
  // Remove HTML tags using regex
  const withoutTags = str.replace(/<[^>]*>?/gm, '');
  
  // Replace control characters and normalize whitespace
  return withoutTags
    .replace(/[\r\n\t\f\v]+/g, ' ') // Replace control chars with spaces
    .replace(/\s{2,}/g, ' ')        // Collapse multiple spaces to single space
    .trim();                         // Remove leading/trailing whitespace
}

/**
 * Validate file path to prevent traversal attacks
 * @param {string} filePath File path to validate
 * @returns {object} Validation result {valid: boolean, reason: string}
 */
function validateFilePath(filePath) {
  if (typeof filePath !== 'string') {
    return { valid: false, reason: 'File path must be a string' };
  }
  
  // Normalize the path to detect path traversal attempts
  const normalizedPath = path.normalize(filePath);
  
  // Check for path traversal patterns
  if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
    return { valid: false, reason: 'Path traversal not allowed' };
  }
  
  // Check file extension if it has one
  const ext = path.extname(normalizedPath).toLowerCase();
  if (ext && !VALID_FILE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      reason: `File extension "${ext}" not allowed. Valid extensions: ${VALID_FILE_EXTENSIONS.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Create a new task with validated data
 * @param {object} taskData Task data
 * @returns {object} Created task
 */
function createTask(taskData) {
  try {
    // Validate and sanitize input
    const sanitizedTaskData = validateTaskData(taskData);
    
    // Load existing tasks
    const tasksData = loadTasks();
    
    // Generate a new ID (max ID + 1, or 1 if no tasks)
    const newId = tasksData.tasks.length > 0 ? 
      Math.max(...tasksData.tasks.map(task => Number(task.id) || 0)) + 1 : 1;
    
    // Create the new task
    const newTask = {
      id: newId,
      title: sanitizedTaskData.title,
      description: sanitizedTaskData.description || '',
      category: sanitizedTaskData.category || 'feature',
      status: sanitizedTaskData.status || 'todo',
      priority: sanitizedTaskData.priority || 'p2-medium',
      effort: sanitizedTaskData.effort || '3-medium',
      createdBy: sanitizedTaskData.createdBy || 'Unknown',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      relatedFiles: sanitizedTaskData.relatedFiles || [],
      comments: sanitizedTaskData.comments || [],
      checklists: sanitizedTaskData.checklists || []
    };
    
    // Add to tasks array
    tasksData.tasks.push(newTask);
    
    // Update lastId
    tasksData.lastId = newId;
    
    // Save tasks
    saveTasks(tasksData);
    
    return newTask;
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
}

/**
 * Update an existing task
 * @param {string|number} taskId Task ID to update
 * @param {object} updates Changes to apply
 * @returns {object} Updated task
 */
function updateTask(taskId, updates) {
  try {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    // Convert ID to number
    const numericId = Number(taskId);
    if (isNaN(numericId)) {
      throw new Error(`Invalid task ID: ${taskId}`);
    }
    
    const tasksData = loadTasks();
    const taskIndex = tasksData.tasks.findIndex(t => t.id === numericId);
    
    if (taskIndex === -1) {
      throw new Error(`Task #${taskId} not found`);
    }
    
    // Get the current task
    const task = tasksData.tasks[taskIndex];
    
    // Create a sanitized version of the updates
    const sanitizedUpdates = {};
    
    // Sanitize each update field
    if (updates.title !== undefined) {
      sanitizedUpdates.title = sanitizeString(updates.title).substring(0, MAX_TITLE_LENGTH);
      if (sanitizedUpdates.title.length === 0) {
        throw new Error('Task title cannot be empty after sanitization');
      }
    }
    
    if (updates.description !== undefined) {
      sanitizedUpdates.description = sanitizeString(updates.description).substring(0, MAX_DESCRIPTION_LENGTH);
    }
    
    if (updates.category !== undefined) {
      sanitizedUpdates.category = sanitizeString(updates.category);
    }
    
    if (updates.status !== undefined) {
      sanitizedUpdates.status = sanitizeString(updates.status);
    }
    
    if (updates.priority !== undefined) {
      sanitizedUpdates.priority = sanitizeString(updates.priority);
    }
    
    if (updates.effort !== undefined) {
      sanitizedUpdates.effort = sanitizeString(updates.effort);
    }
    
    // Handle array updates
    if (updates.relatedFiles !== undefined) {
      if (Array.isArray(updates.relatedFiles)) {
        const validFiles = [];
        const invalidFiles = [];
        
        // Validate each file path
        updates.relatedFiles.forEach(file => {
          if (typeof file !== 'string') {
            return; // Skip non-string files
          }
          
          const pathValidation = validateFilePath(file);
          if (pathValidation.valid) {
            validFiles.push(path.normalize(file));
          } else {
            invalidFiles.push({file, reason: pathValidation.reason});
          }
        });
        
        // Log invalid files
        if (invalidFiles.length > 0) {
          output(`⚠️ Skipped ${invalidFiles.length} invalid file paths in update:`, 'warning');
          invalidFiles.forEach(({file, reason}) => {
            output(`  - "${file}": ${reason}`, 'warning');
          });
        }
        
        sanitizedUpdates.relatedFiles = validFiles;
      } else {
        sanitizedUpdates.relatedFiles = [];
      }
    }
    
    if (updates.comments !== undefined && Array.isArray(updates.comments)) {
      sanitizedUpdates.comments = updates.comments
        .filter(comment => comment && typeof comment === 'object')
        .map(comment => ({
          text: comment.text ? sanitizeString(comment.text).substring(0, MAX_COMMENT_LENGTH) : '',
          author: comment.author ? sanitizeString(comment.author) : '',
          date: comment.date && !isNaN(new Date(comment.date).getTime()) 
            ? comment.date 
            : new Date().toISOString()
        }));
    }
    
    // Apply updates
    const updatedTask = {
      ...task,
      ...sanitizedUpdates,
      lastUpdated: new Date().toISOString()
    };
    
    // Update in array
    tasksData.tasks[taskIndex] = updatedTask;
    
    // Save to disk
    saveTasks(tasksData);
    
    return updatedTask;
  } catch (error) {
    throw new Error(`Failed to update task #${taskId}: ${error.message}`);
  }
}

/**
 * Delete a task
 * @param {string|number} taskId Task ID to delete
 * @returns {boolean} Success status
 */
function deleteTask(taskId) {
  try {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    const tasksData = loadTasks();
    const taskIndex = tasksData.tasks.findIndex(t => t.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      throw new Error(`Task #${taskId} not found`);
    }
    
    // Remove from array
    tasksData.tasks.splice(taskIndex, 1);
    
    // Save to disk
    saveTasks(tasksData);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to delete task #${taskId}: ${error.message}`);
  }
}

/**
 * Filter tasks based on criteria
 * @param {object} criteria Filter criteria
 * @returns {array} Filtered tasks
 */
function filterTasks(criteria = {}) {
  try {
    const { 
      status, 
      category, 
      priority, 
      keyword,
      showArchived
    } = criteria;
    
    let tasksData = loadTasks();
    let filteredTasks = [...tasksData.tasks];
    
    // Filter by status
    if (status) {
      filteredTasks = filteredTasks.filter(task => 
        task.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Filter by category
    if (category) {
      filteredTasks = filteredTasks.filter(task => 
        task.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by priority
    if (priority) {
      filteredTasks = filteredTasks.filter(task => 
        task.priority && task.priority.toLowerCase() === priority.toLowerCase()
      );
    }
    
    // Search by keyword
    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      filteredTasks = filteredTasks.filter(task => {
        // Search in title, description, and comments
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
        const descMatch = task.description && task.description.toLowerCase().includes(searchTerm);
        
        // Search in comments if they exist
        let commentMatch = false;
        if (task.comments && task.comments.length > 0) {
          commentMatch = task.comments.some(comment => 
            comment.text && comment.text.toLowerCase().includes(searchTerm)
          );
        }
        
        return titleMatch || descMatch || commentMatch;
      });
    }
    
    return filteredTasks;
  } catch (error) {
    throw new Error(`Failed to filter tasks: ${error.message}`);
  }
}

/**
 * Add a file to a task
 * @param {string|number} taskId Task ID
 * @param {string} filePath Path to file
 * @returns {object} Updated task
 */
function addFileToTask(taskId, filePath) {
  try {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    // Convert ID to number
    const numericId = Number(taskId);
    if (isNaN(numericId)) {
      throw new Error(`Invalid task ID: ${taskId}`);
    }
    
    // Validate file path
    const pathValidation = validateFilePath(filePath);
    if (!pathValidation.valid) {
      throw new Error(`Invalid file path: ${pathValidation.reason}`);
    }
    
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    
    // Get the task
    const task = getTaskById(numericId);
    if (!task) {
      throw new Error(`Task #${taskId} not found`);
    }
    
    // Initialize relatedFiles if it doesn't exist
    if (!task.relatedFiles) {
      task.relatedFiles = [];
    }
    
    // Check if file already exists in the task
    if (task.relatedFiles.includes(normalizedPath)) {
      return task; // File already added
    }
    
    // Add file and update the task
    return updateTask(numericId, {
      relatedFiles: [...task.relatedFiles, normalizedPath]
    });
  } catch (error) {
    throw new Error(`Failed to add file to task #${taskId}: ${error.message}`);
  }
}

/**
 * Remove a file from a task
 * @param {string|number} taskId Task ID
 * @param {string} filePath Path to file
 * @returns {object} Updated task
 */
function removeFileFromTask(taskId, filePath) {
  try {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    // Convert ID to number
    const numericId = Number(taskId);
    if (isNaN(numericId)) {
      throw new Error(`Invalid task ID: ${taskId}`);
    }
    
    // Validate file path
    const pathValidation = validateFilePath(filePath);
    if (!pathValidation.valid) {
      throw new Error(`Invalid file path: ${pathValidation.reason}`);
    }
    
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    
    // Get the task
    const task = getTaskById(numericId);
    if (!task) {
      throw new Error(`Task #${taskId} not found`);
    }
    
    // Check if relatedFiles exists
    if (!task.relatedFiles || !Array.isArray(task.relatedFiles)) {
      return task; // No files to remove
    }
    
    // Check if file exists in the task
    const fileIndex = task.relatedFiles.findIndex(f => 
      f.toLowerCase() === normalizedPath.toLowerCase() ||
      path.normalize(f).toLowerCase() === normalizedPath.toLowerCase()
    );
    
    if (fileIndex === -1) {
      throw new Error(`File "${filePath}" not found in task #${taskId}`);
    }
    
    // Remove file and update the task
    const updatedFiles = [...task.relatedFiles];
    updatedFiles.splice(fileIndex, 1);
    
    return updateTask(numericId, {
      relatedFiles: updatedFiles
    });
  } catch (error) {
    throw new Error(`Failed to remove file from task #${taskId}: ${error.message}`);
  }
}

/**
 * Add a comment to a task
 * @param {string|number} taskId Task ID
 * @param {string} commentText Comment text
 * @param {string} author Comment author (optional)
 * @returns {object} Updated task
 */
function addCommentToTask(taskId, commentText, author = '') {
  try {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    if (!commentText) {
      throw new Error('Comment text is required');
    }
    
    // Get the task
    const task = getTaskById(taskId);
    if (!task) {
      throw new Error(`Task #${taskId} not found`);
    }
    
    // Initialize comments if it doesn't exist
    if (!task.comments) {
      task.comments = [];
    }
    
    // Create comment object
    const comment = {
      author: author || process.env.USER || process.env.USERNAME || 'Unknown',
      date: new Date().toISOString(),
      text: commentText
    };
    
    // Add comment and update the task
    return updateTask(taskId, {
      comments: [...task.comments, comment]
    });
  } catch (error) {
    throw new Error(`Failed to add comment to task #${taskId}: ${error.message}`);
  }
}

module.exports = {
  initPaths,
  loadTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  filterTasks,
  addFileToTask,
  removeFileFromTask,
  addCommentToTask,
  validateTaskData,
  sanitizeString,
  validateFilePath,
  backupTasksFile,
  ensureSecureDirectory
}; 