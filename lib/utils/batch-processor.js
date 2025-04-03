/**
 * TaskTracker Batch Processor
 * 
 * Provides utilities for performing batch operations on tasks,
 * especially useful for reducing API calls when integrating with AI agents.
 */

const taskManager = require('../core/task-manager');
const { output } = require('../core/formatting');
const structuredOutput = require('./structured-output');

/**
 * Supported operation types for batch processing
 */
const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ADD_FILE: 'add-file',
  REMOVE_FILE: 'remove-file',
  ADD_COMMENT: 'add-comment',
  CHANGE_STATUS: 'change-status',
  CHANGE_CATEGORY: 'change-category',
  CHANGE_PRIORITY: 'change-priority',
  CHANGE_EFFORT: 'change-effort'
};

/**
 * Process a batch of task operations
 * @param {Array} operations Array of operations to process
 * @param {object} options Options for processing
 * @returns {object} Result of batch processing
 */
async function processBatchOperations(operations, options = {}) {
  if (!Array.isArray(operations) || operations.length === 0) {
    return structuredOutput.formatError('No operations provided for batch processing');
  }
  
  const results = [];
  const errors = [];
  let operationCount = 0;
  
  // Track whether any operation failed
  let hasFailures = false;
  
  // Process each operation
  for (const operation of operations) {
    try {
      operationCount++;
      
      // Validate operation
      if (!operation.type || !OPERATION_TYPES[operation.type.toUpperCase()]) {
        throw new Error(`Unknown operation type: ${operation.type}`);
      }
      
      const opType = operation.type.toLowerCase();
      let result;
      
      // Process based on operation type
      switch (opType) {
        case OPERATION_TYPES.CREATE:
          result = await createTask(operation.data, options);
          break;
          
        case OPERATION_TYPES.UPDATE:
          if (!operation.taskId) {
            throw new Error('Missing taskId for update operation');
          }
          result = await updateTask(operation.taskId, operation.updates, options);
          break;
          
        case OPERATION_TYPES.DELETE:
          if (!operation.taskId) {
            throw new Error('Missing taskId for delete operation');
          }
          result = await deleteTask(operation.taskId, options);
          break;
          
        case OPERATION_TYPES.ADD_FILE:
          if (!operation.taskId || !operation.filePath) {
            throw new Error('Missing taskId or filePath for add-file operation');
          }
          result = await addFileToTask(operation.taskId, operation.filePath, options);
          break;
          
        case OPERATION_TYPES.REMOVE_FILE:
          if (!operation.taskId || !operation.filePath) {
            throw new Error('Missing taskId or filePath for remove-file operation');
          }
          result = await removeFileFromTask(operation.taskId, operation.filePath, options);
          break;
          
        case OPERATION_TYPES.ADD_COMMENT:
          if (!operation.taskId || !operation.comment) {
            throw new Error('Missing taskId or comment for add-comment operation');
          }
          result = await addCommentToTask(operation.taskId, operation.comment, operation.author, options);
          break;
          
        case OPERATION_TYPES.CHANGE_STATUS:
          if (!operation.taskId || !operation.status) {
            throw new Error('Missing taskId or status for change-status operation');
          }
          result = await updateTask(operation.taskId, { status: operation.status }, options);
          break;
          
        case OPERATION_TYPES.CHANGE_CATEGORY:
          if (!operation.taskId || !operation.category) {
            throw new Error('Missing taskId or category for change-category operation');
          }
          result = await updateTask(operation.taskId, { category: operation.category }, options);
          break;
          
        case OPERATION_TYPES.CHANGE_PRIORITY:
          if (!operation.taskId || !operation.priority) {
            throw new Error('Missing taskId or priority for change-priority operation');
          }
          result = await updateTask(operation.taskId, { priority: operation.priority }, options);
          break;
          
        case OPERATION_TYPES.CHANGE_EFFORT:
          if (!operation.taskId || !operation.effort) {
            throw new Error('Missing taskId or effort for change-effort operation');
          }
          result = await updateTask(operation.taskId, { effort: operation.effort }, options);
          break;
          
        default:
          throw new Error(`Unsupported operation type: ${opType}`);
      }
      
      results.push({
        type: opType,
        taskId: result.id || operation.taskId,
        success: true,
        result
      });
    } catch (error) {
      hasFailures = true;
      errors.push({
        type: operation.type,
        taskId: operation.taskId,
        success: false,
        error: error.message
      });
      
      if (options.failFast) {
        break;
      }
    }
  }
  
  // Return batch processing results
  return structuredOutput.formatJsonResult({
    operations: results,
    errors: errors.length > 0 ? errors : null
  }, {
    metadata: {
      total: operationCount,
      successful: results.length,
      failed: errors.length,
      timestamp: new Date().toISOString()
    },
    error: hasFailures ? 'Some operations failed' : null
  });
}

/**
 * Create a task (wrapper for batch processing)
 * @param {object} taskData Task data
 * @param {object} options Options for processing
 * @returns {object} Created task
 */
async function createTask(taskData, options = {}) {
  try {
    const task = taskManager.createTask(taskData);
    return task;
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
}

/**
 * Update a task (wrapper for batch processing)
 * @param {string|number} taskId Task ID
 * @param {object} updates Updates to apply
 * @param {object} options Options for processing
 * @returns {object} Updated task
 */
async function updateTask(taskId, updates, options = {}) {
  try {
    const task = taskManager.updateTask(taskId, updates);
    return task;
  } catch (error) {
    throw new Error(`Failed to update task #${taskId}: ${error.message}`);
  }
}

/**
 * Delete a task (wrapper for batch processing)
 * @param {string|number} taskId Task ID
 * @param {object} options Options for processing
 * @returns {object} Success status
 */
async function deleteTask(taskId, options = {}) {
  try {
    const result = taskManager.deleteTask(taskId);
    return { id: taskId, deleted: result };
  } catch (error) {
    throw new Error(`Failed to delete task #${taskId}: ${error.message}`);
  }
}

/**
 * Add a file to a task (wrapper for batch processing)
 * @param {string|number} taskId Task ID
 * @param {string} filePath Path to file
 * @param {object} options Options for processing
 * @returns {object} Updated task
 */
async function addFileToTask(taskId, filePath, options = {}) {
  try {
    const task = taskManager.addFileToTask(taskId, filePath);
    return task;
  } catch (error) {
    throw new Error(`Failed to add file to task #${taskId}: ${error.message}`);
  }
}

/**
 * Remove a file from a task (wrapper for batch processing)
 * @param {string|number} taskId Task ID
 * @param {string} filePath Path to file
 * @param {object} options Options for processing
 * @returns {object} Updated task
 */
async function removeFileFromTask(taskId, filePath, options = {}) {
  try {
    const task = taskManager.removeFileFromTask(taskId, filePath);
    return task;
  } catch (error) {
    throw new Error(`Failed to remove file from task #${taskId}: ${error.message}`);
  }
}

/**
 * Add a comment to a task (wrapper for batch processing)
 * @param {string|number} taskId Task ID
 * @param {string} comment Comment text
 * @param {string} author Comment author
 * @param {object} options Options for processing
 * @returns {object} Updated task
 */
async function addCommentToTask(taskId, comment, author = '', options = {}) {
  try {
    const task = taskManager.addCommentToTask(taskId, comment, author);
    return task;
  } catch (error) {
    throw new Error(`Failed to add comment to task #${taskId}: ${error.message}`);
  }
}

module.exports = {
  processBatchOperations,
  OPERATION_TYPES
}; 