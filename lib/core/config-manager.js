/**
 * TaskTracker Config Manager
 * 
 * Handles configuration loading, saving, and defaults
 */

const fs = require('fs');
const path = require('path');
const { output } = require('./formatting');
const security = require('../utils/security-middleware');

// Config data path (will be initialized)
let CONFIG_PATH = '';
let DATA_DIR = '';

// Default configuration
const DEFAULT_CONFIG = {
  taskCategories: ['feature', 'bug', 'docs', 'test', 'refactor', 'chore'],
  taskStatuses: ['todo', 'in-progress', 'review', 'done'],
  priorityLevels: ['p1-critical', 'p2-medium', 'p3-low'],
  effortEstimation: ['1-trivial', '2-small', '3-medium', '5-large', '8-xlarge'],
  currentTask: null,
  showChalkWarnings: true,
  projectName: '',
  // Layout options
  maxDisplayWidth: 120,
  defaultListView: 'table', // 'table', 'compact', 'detailed'
  dateFormat: 'locale', // 'locale', 'iso', 'relative'
  // Feature flags
  enableGitIntegration: true,
  enableDependencyTracking: true
};

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(rootDir, '.tasktracker');
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
}

/**
 * Ensure configuration is valid, fixing or filling in defaults as needed
 * @param {object} config Configuration object to validate
 * @returns {object} Validated and fixed configuration
 */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    return { ...DEFAULT_CONFIG };
  }
  
  const validatedConfig = { ...DEFAULT_CONFIG };
  
  // Validate array properties with string values
  ['taskCategories', 'taskStatuses', 'priorityLevels', 'effortEstimation'].forEach(key => {
    if (Array.isArray(config[key])) {
      validatedConfig[key] = config[key]
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .map(item => security.sanitizeInput(item, 100));
      
      // Ensure at least one value in each array
      if (validatedConfig[key].length === 0) {
        validatedConfig[key] = DEFAULT_CONFIG[key];
      }
    }
  });
  
  // Validate currentTask (should be a number, string, or null)
  if (config.currentTask !== undefined) {
    if (config.currentTask === null) {
      validatedConfig.currentTask = null;
    } else if (typeof config.currentTask === 'number' || typeof config.currentTask === 'string') {
      const numericValue = Number(config.currentTask);
      validatedConfig.currentTask = !isNaN(numericValue) ? numericValue : null;
    } else {
      validatedConfig.currentTask = null;
    }
  }
  
  // Validate boolean properties
  ['showChalkWarnings', 'enableGitIntegration', 'enableDependencyTracking'].forEach(key => {
    if (typeof config[key] === 'boolean') {
      validatedConfig[key] = config[key];
    }
  });
  
  // Validate string properties
  ['projectName', 'dateFormat'].forEach(key => {
    if (typeof config[key] === 'string') {
      validatedConfig[key] = security.sanitizeInput(config[key], 100);
    }
  });
  
  // Validate numeric properties
  ['maxDisplayWidth'].forEach(key => {
    if (typeof config[key] === 'number' && !isNaN(config[key])) {
      validatedConfig[key] = config[key];
    }
  });
  
  // Validate enum properties
  if (typeof config.defaultListView === 'string') {
    const validViews = ['table', 'compact', 'detailed'];
    validatedConfig.defaultListView = validViews.includes(config.defaultListView.toLowerCase()) 
      ? config.defaultListView.toLowerCase() 
      : DEFAULT_CONFIG.defaultListView;
  }
  
  return validatedConfig;
}

/**
 * Load configuration
 * @returns {object} Configuration object
 */
function loadConfig() {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Create config if it doesn't exist
    if (!fs.existsSync(CONFIG_PATH)) {
      const defaultConfig = { ...DEFAULT_CONFIG };
      defaultConfig.projectName = path.basename(process.cwd());
      
      // Use safe file operation to write
      const jsonData = JSON.stringify(defaultConfig, null, 2);
      security.safeFileOperation(null, CONFIG_PATH, jsonData);
      
      return defaultConfig;
    }
    
    // Load existing config with safe JSON parsing
    const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsedConfig = security.safeJsonParse(fileContent, DEFAULT_CONFIG);
    
    // Validate and fix any issues
    const validatedConfig = validateConfig(parsedConfig);
    
    // If we had to fix things, save the corrected config
    if (JSON.stringify(validatedConfig) !== JSON.stringify(parsedConfig)) {
      output('⚠️ Fixed invalid configuration values', 'warning');
      saveConfig(validatedConfig);
    }
    
    return validatedConfig;
  } catch (error) {
    // If there's an error, return defaults and log error
    output(`⚠️ Error loading config, using defaults: ${error.message}`, 'warning');
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration
 * @param {object} config Configuration to save
 * @returns {boolean} Success status
 */
function saveConfig(config) {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Validate config before saving
    const validatedConfig = validateConfig(config);
    
    // Use safe file operation to write
    const jsonData = JSON.stringify(validatedConfig, null, 2);
    return security.safeFileOperation(null, CONFIG_PATH, jsonData);
  } catch (error) {
    output(`❌ Error saving config: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Get a specific config value
 * @param {string} key Config key to get
 * @param {any} defaultValue Default value if not found
 * @returns {any} Config value or default
 */
function getConfigValue(key, defaultValue = null) {
  try {
    const config = loadConfig();
    return key in config ? config[key] : defaultValue;
  } catch (error) {
    output(`❌ Error getting config value: ${error.message}`, 'error');
    return defaultValue;
  }
}

/**
 * Update a specific config value
 * @param {string} key Config key to update
 * @param {any} value New value
 * @returns {boolean} Success status
 */
function updateConfigValue(key, value) {
  try {
    const config = loadConfig();
    config[key] = value;
    return saveConfig(config);
  } catch (error) {
    output(`❌ Error updating config value: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Reset configuration to defaults
 * @returns {boolean} Success status
 */
function resetConfig() {
  try {
    const config = { ...DEFAULT_CONFIG };
    config.projectName = path.basename(process.cwd());
    return saveConfig(config);
  } catch (error) {
    output(`❌ Error resetting config: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Get array of valid task statuses
 * @returns {string[]} Array of valid status values
 */
function getValidStatuses() {
  return getConfigValue('taskStatuses', DEFAULT_CONFIG.taskStatuses);
}

/**
 * Get array of valid task categories
 * @returns {string[]} Array of valid category values
 */
function getValidCategories() {
  return getConfigValue('taskCategories', DEFAULT_CONFIG.taskCategories);
}

/**
 * Get array of valid priority levels
 * @returns {string[]} Array of valid priority values
 */
function getValidPriorities() {
  return getConfigValue('priorityLevels', DEFAULT_CONFIG.priorityLevels);
}

/**
 * Get array of valid effort estimations
 * @returns {string[]} Array of valid effort values
 */
function getValidEfforts() {
  return getConfigValue('effortEstimation', DEFAULT_CONFIG.effortEstimation);
}

/**
 * Add a value to a config array (like categories, statuses)
 * @param {string} configKey Config key for the array to update
 * @param {string} value Value to add
 * @returns {boolean} Success status
 */
function addValueToConfigArray(configKey, value) {
  try {
    if (!configKey || !value) {
      return false;
    }
    
    const config = loadConfig();
    
    // Check if the key exists and is an array
    if (!config[configKey] || !Array.isArray(config[configKey])) {
      config[configKey] = [];
    }
    
    // Check if value already exists
    if (config[configKey].includes(value)) {
      return true; // Already exists, no need to add
    }
    
    // Add the value and save
    config[configKey].push(value);
    return saveConfig(config);
  } catch (error) {
    output(`❌ Error adding value to config array: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Remove a value from a config array (like categories, statuses)
 * @param {string} configKey Config key for the array to update
 * @param {string} value Value to remove
 * @returns {boolean} Success status
 */
function removeValueFromConfigArray(configKey, value) {
  try {
    if (!configKey || !value) {
      return false;
    }
    
    const config = loadConfig();
    
    // Check if the key exists and is an array
    if (!config[configKey] || !Array.isArray(config[configKey])) {
      return false; // Nothing to remove
    }
    
    // Find the index of the value
    const index = config[configKey].indexOf(value);
    if (index === -1) {
      return true; // Value doesn't exist, nothing to remove
    }
    
    // Remove the value and save
    config[configKey].splice(index, 1);
    return saveConfig(config);
  } catch (error) {
    output(`❌ Error removing value from config array: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Set the current active task
 * @param {string|number|null} taskId Task ID or null to clear
 * @returns {boolean} Success status
 */
function setCurrentTask(taskId) {
  return updateConfigValue('currentTask', taskId);
}

/**
 * Get the current active task ID
 * @returns {string|number|null} Current task ID or null
 */
function getCurrentTask() {
  return getConfigValue('currentTask', null);
}

module.exports = {
  initPaths,
  loadConfig,
  saveConfig,
  getConfigValue,
  updateConfigValue,
  resetConfig,
  getValidStatuses,
  getValidCategories,
  getValidPriorities,
  getValidEfforts,
  addValueToConfigArray,
  removeValueFromConfigArray,
  setCurrentTask,
  getCurrentTask,
  DEFAULT_CONFIG
}; 