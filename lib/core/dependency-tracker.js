/**
 * TaskTracker Dependency Tracker
 * Handles task dependency relationships
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Cache for dependency data
let dependencyCache = null;
let dependencyCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Get the path to the dependency data file
 * @returns {string} Path to dependency data file
 */
function getDependencyFile() {
  // Get the tasktracker data directory
  const homeDir = os.homedir();
  const dataDir = process.env.TASKTRACKER_DATA_DIR || path.join(homeDir, '.tasktracker');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return path.join(dataDir, 'dependencies.json');
}

/**
 * Load dependency data from file
 * @param {boolean} useCache Whether to use cached data
 * @returns {Object} Dependency data
 */
function loadDependencies(useCache = true) {
  // Use cached data if available and not expired
  const now = Date.now();
  if (useCache && dependencyCache && (now - dependencyCacheTime) < CACHE_TTL) {
    return dependencyCache;
  }
  
  const dependencyFile = getDependencyFile();
  
  // Create empty dependency data if file doesn't exist
  if (!fs.existsSync(dependencyFile)) {
    return { dependencies: {}, blockedBy: {} };
  }
  
  try {
    const data = fs.readFileSync(dependencyFile, 'utf8');
    dependencyCache = JSON.parse(data);
    dependencyCacheTime = now;
    return dependencyCache;
  } catch (error) {
    console.error('Error loading dependency data:', error.message);
    return { dependencies: {}, blockedBy: {} };
  }
}

/**
 * Save dependency data to file
 * @param {Object} data Dependency data
 */
function saveDependencies(data) {
  const dependencyFile = getDependencyFile();
  
  try {
    fs.writeFileSync(dependencyFile, JSON.stringify(data, null, 2), 'utf8');
    dependencyCache = data;
    dependencyCacheTime = Date.now();
  } catch (error) {
    console.error('Error saving dependency data:', error.message);
  }
}

/**
 * Add a dependency relationship between tasks
 * @param {string|number} taskId Task ID
 * @param {string|number} dependsOnId Task ID that this task depends on
 * @returns {boolean} Success
 */
function addDependency(taskId, dependsOnId) {
  // Convert IDs to strings for consistency
  taskId = String(taskId);
  dependsOnId = String(dependsOnId);
  
  // Don't allow self-dependencies
  if (taskId === dependsOnId) {
    console.error('Error: Task cannot depend on itself');
    return false;
  }
  
  const data = loadDependencies();
  
  // Initialize arrays if they don't exist
  if (!data.dependencies[taskId]) {
    data.dependencies[taskId] = [];
  }
  
  if (!data.blockedBy[dependsOnId]) {
    data.blockedBy[dependsOnId] = [];
  }
  
  // Add dependency if it doesn't already exist
  if (!data.dependencies[taskId].includes(dependsOnId)) {
    data.dependencies[taskId].push(dependsOnId);
  }
  
  // Add reverse relationship
  if (!data.blockedBy[dependsOnId].includes(taskId)) {
    data.blockedBy[dependsOnId].push(taskId);
  }
  
  saveDependencies(data);
  return true;
}

/**
 * Remove a dependency relationship between tasks
 * @param {string|number} taskId Task ID
 * @param {string|number} dependsOnId Task ID that this task depends on
 * @returns {boolean} Success
 */
function removeDependency(taskId, dependsOnId) {
  // Convert IDs to strings for consistency
  taskId = String(taskId);
  dependsOnId = String(dependsOnId);
  
  const data = loadDependencies();
  
  // Remove dependency if it exists
  if (data.dependencies[taskId]) {
    data.dependencies[taskId] = data.dependencies[taskId].filter(id => id !== dependsOnId);
    
    // Clean up empty arrays
    if (data.dependencies[taskId].length === 0) {
      delete data.dependencies[taskId];
    }
  }
  
  // Remove reverse relationship
  if (data.blockedBy[dependsOnId]) {
    data.blockedBy[dependsOnId] = data.blockedBy[dependsOnId].filter(id => id !== taskId);
    
    // Clean up empty arrays
    if (data.blockedBy[dependsOnId].length === 0) {
      delete data.blockedBy[dependsOnId];
    }
  }
  
  saveDependencies(data);
  return true;
}

/**
 * Get the tasks that a task depends on
 * @param {string|number} taskId Task ID
 * @returns {Array} Array of task IDs
 */
function getDependencies(taskId) {
  // Convert ID to string for consistency
  taskId = String(taskId);
  
  const data = loadDependencies();
  return data.dependencies[taskId] || [];
}

/**
 * Get the tasks that are blocked by a task
 * @param {string|number} taskId Task ID
 * @returns {Array} Array of task IDs
 */
function getBlockedBy(taskId) {
  // Convert ID to string for consistency
  taskId = String(taskId);
  
  const data = loadDependencies();
  return data.blockedBy[taskId] || [];
}

module.exports = {
  addDependency,
  removeDependency,
  getDependencies,
  getBlockedBy,
  loadDependencies
}; 