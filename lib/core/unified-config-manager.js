/**
 * Unified Configuration Manager
 * 
 * Handles loading, saving, and accessing TaskTracker configuration.
 * Placeholder implementation based on usage in init.js and others.
 */

const fs = require('fs');
const path = require('path');

let CONFIG_PATH = null;
let DATA_DIR = null;

// Default configuration structure
const DEFAULT_CONFIG = {
  projectName: 'DefaultProject',
  version: '1.0.0', // Assuming a version field might be needed
  taskStatuses: ['todo', 'in_progress', 'done', 'blocked'],
  taskCategories: ['feature', 'bug', 'docs', 'test', 'refactor', 'chore'],
  priorityLevels: ['low', 'medium', 'high', 'urgent'],
  effortEstimation: ['1-trivial', '2-small', '3-medium', '5-large', '8-xlarge'],
  // Add other potential default config values here
};

/**
 * Initialize paths required by the config manager.
 * @param {string} rootDir The application root directory.
 */
function initPaths(rootDir) {
  const appRoot = rootDir || process.cwd();
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(appRoot, '.tasktracker');
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
  
  // Ensure the directory exists (though init.js might also do this)
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error(`Error creating config directory ${DATA_DIR}: ${error.message}`);
      // Allow proceeding, loadConfig will handle missing file
    }
  }
}

/**
 * Load the configuration from config.json.
 * If the file doesn't exist, creates it with defaults.
 * @returns {object} The loaded or default configuration object.
 */
function loadConfig() {
  if (!CONFIG_PATH) {
    // Attempt to initialize paths if not already done
    initPaths(process.cwd()); 
    if (!CONFIG_PATH) {
        console.error('Config path not initialized. Cannot load config.');
        return { ...DEFAULT_CONFIG }; // Return default as fallback
    }
  }

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const rawData = fs.readFileSync(CONFIG_PATH, 'utf8');
      const configData = JSON.parse(rawData);
      // Merge defaults with loaded config to ensure all keys exist
      return { ...DEFAULT_CONFIG, ...configData };
    } else {
      // Config file doesn't exist, save default config and return it
      console.log(`Configuration file not found at ${CONFIG_PATH}. Creating with defaults.`);
      saveConfig(DEFAULT_CONFIG); // Save the default config
      return { ...DEFAULT_CONFIG }; 
    }
  } catch (error) {
    console.error(`Error loading or parsing config file ${CONFIG_PATH}: ${error.message}`);
    console.error('Using default configuration.');
    return { ...DEFAULT_CONFIG }; // Return default config on error
  }
}

/**
 * Save the configuration object to config.json.
 * @param {object} configData The configuration object to save.
 * @returns {boolean} True if successful, false otherwise.
 */
function saveConfig(configData) {
  if (!CONFIG_PATH) {
     console.error('Config path not initialized. Cannot save config.');
     return false;
  }
  
  try {
    const configString = JSON.stringify(configData, null, 2);
    fs.writeFileSync(CONFIG_PATH, configString, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving config file ${CONFIG_PATH}: ${error.message}`);
    return false;
  }
}

// --- Getter functions for specific config arrays (based on usage in update.js) ---

function getValidStatuses() {
  const config = loadConfig();
  return config.taskStatuses || DEFAULT_CONFIG.taskStatuses;
}

function getValidCategories() {
  const config = loadConfig();
  return config.taskCategories || DEFAULT_CONFIG.taskCategories;
}

function getValidPriorities() {
  const config = loadConfig();
  return config.priorityLevels || DEFAULT_CONFIG.priorityLevels;
}

function getValidEfforts() {
  const config = loadConfig();
  return config.effortEstimation || DEFAULT_CONFIG.effortEstimation;
}

// -----------------------------------------------------------------------------

module.exports = {
  initPaths,
  loadConfig,
  saveConfig,
  getValidStatuses,
  getValidCategories,
  getValidPriorities,
  getValidEfforts,
}; 