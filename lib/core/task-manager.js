/**
 * TaskTracker Task Manager
 * 
 * Centralizes task CRUD operations and data access
 */

const fs = require('fs');
const path = require('path');
const { output } = require('./formatting');

// Data paths (will be initialized)
let TASKS_PATH = '';
let ARCHIVES_PATH = '';
let CONFIG_PATH = '';
let DATA_DIR = '';

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(rootDir, '.tasktracker');
  TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  ARCHIVES_PATH = path.join(DATA_DIR, 'archives.json');
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
}

/**
 * Load all tasks
 * @returns {object} Object containing tasks and lastId
 */
function loadTasks() {
  try {
    if (!fs.existsSync(TASKS_PATH)) {
      return { tasks: [], lastId: 0 };
    }
    
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    return tasksData;
  } catch (error) {
    throw new Error(`Failed to load tasks: ${error.message}`);
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
    const tasksData = loadTasks();
    return tasksData.tasks.find(task => task.id.toString() === taskId.toString()) || null;
  } catch (error) {
    throw new Error(`Failed to get task #${taskId}: ${error.message}`);
  }
}

/**
 * Save tasks data
 * @param {object} tasksData Object with tasks and lastId
 */
function saveTasks(tasksData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
    return true;
  } catch (error) {
    throw new Error(`Failed to save tasks: ${error.message}`);
  }
}

/**
 * Create a new task
 * @param {object} taskData Task data
 * @returns {object} Created task with ID
 */
function createTask(taskData) {
  try {
    const tasksData = loadTasks();
    
    // Generate a new ID
    const newId = tasksData.lastId + 1;
    
    // Create a new task with defaults and provided data
    const newTask = {
      id: newId,
      title: '',
      description: '',
      category: 'feature',
      status: 'todo',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...taskData  // Override defaults with provided data
    };
    
    // Add to tasks list
    tasksData.tasks.push(newTask);
    tasksData.lastId = newId;
    
    // Save to disk
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
    
    const tasksData = loadTasks();
    const taskIndex = tasksData.tasks.findIndex(t => t.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      throw new Error(`Task #${taskId} not found`);
    }
    
    // Get the current task
    const task = tasksData.tasks[taskIndex];
    
    // Apply updates
    const updatedTask = {
      ...task,
      ...updates,
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
    
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    
    // Get the task
    const task = getTaskById(taskId);
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
    return updateTask(taskId, {
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
    
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    
    // Get the task
    const task = getTaskById(taskId);
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
      return task; // File not found
    }
    
    // Remove file and update the task
    const updatedFiles = [...task.relatedFiles];
    updatedFiles.splice(fileIndex, 1);
    
    return updateTask(taskId, {
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
  addCommentToTask
}; 