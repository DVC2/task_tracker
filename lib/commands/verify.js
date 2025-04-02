/**
 * TaskTracker Verify Command
 * 
 * Verifies the installation and configuration
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output } = require('../core/formatting');
const configManager = require('../core/config-manager');

// Data paths (will be initialized)
let DATA_DIR = '';
let TASKS_PATH = '';
let CONFIG_PATH = '';
let FILE_HASHES_PATH = '';
let SNAPSHOTS_DIR = '';
let REPORTS_DIR = '';
let STATS_DIR = '';
let APP_ROOT = '';

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  APP_ROOT = rootDir;
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(rootDir, '.tasktracker');
  TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
  FILE_HASHES_PATH = path.join(DATA_DIR, 'file-hashes.json');
  SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
  REPORTS_DIR = path.join(DATA_DIR, 'reports');
  STATS_DIR = path.join(DATA_DIR, 'stats');
}

/**
 * Verify TaskTracker installation
 * @param {object} options Command options
 * @returns {object} Verification result
 */
function verifyInstallation(options = {}) {
  try {
    output('\n🔍 Verifying TaskTracker installation...', 'info', { globalOptions: options });
    
    const requiredComponents = [
      { name: 'Data directory', path: DATA_DIR, type: 'directory' },
      { name: 'Tasks database', path: TASKS_PATH, type: 'file' },
      { name: 'Configuration', path: CONFIG_PATH, type: 'file' },
      { name: 'File hashes', path: FILE_HASHES_PATH, type: 'file' },
      { name: 'Reports directory', path: REPORTS_DIR, type: 'directory' },
      { name: 'Statistics directory', path: STATS_DIR, type: 'directory' },
      { name: 'Snapshots directory', path: SNAPSHOTS_DIR, type: 'directory' }
    ];
    
    const result = {
      success: true,
      warnings: [],
      errors: [],
      fixed: []
    };
    
    // Check for required components
    for (const component of requiredComponents) {
      try {
        if (!fs.existsSync(component.path)) {
          result.warnings.push(`Missing ${component.type}: ${component.name} (${component.path})`);
          
          // Try to fix issues if requested
          if (options.fix) {
            if (component.type === 'directory') {
              try {
                fs.mkdirSync(component.path, { recursive: true });
                result.fixed.push(`Created ${component.name} directory: ${component.path}`);
              } catch (fixError) {
                result.errors.push(`Failed to create directory: ${component.path} - ${fixError.message}`);
                result.success = false;
              }
            } else if (component.type === 'file') {
              // Create default file content
              try {
                if (component.path === TASKS_PATH) {
                  fs.writeFileSync(component.path, JSON.stringify({ lastId: 0, tasks: [] }, null, 2));
                  result.fixed.push(`Created ${component.name} file: ${component.path}`);
                } else if (component.path === CONFIG_PATH) {
                  const defaultConfig = configManager.getDefaultConfig();
                  fs.writeFileSync(component.path, JSON.stringify(defaultConfig, null, 2));
                  result.fixed.push(`Created ${component.name} file: ${component.path}`);
                } else if (component.path === FILE_HASHES_PATH) {
                  fs.writeFileSync(component.path, JSON.stringify({}, null, 2));
                  result.fixed.push(`Created ${component.name} file: ${component.path}`);
                }
              } catch (fixError) {
                result.errors.push(`Failed to create file: ${component.path} - ${fixError.message}`);
                result.success = false;
              }
            }
          } else {
            result.success = false;
          }
          continue;
        }
        
        // Check if component is the right type
        const stats = fs.statSync(component.path);
        
        if (component.type === 'directory' && !stats.isDirectory()) {
          result.warnings.push(`${component.name} (${component.path}) exists but is not a directory`);
          result.success = false;
        } else if (component.type === 'file' && !stats.isFile()) {
          result.warnings.push(`${component.name} (${component.path}) exists but is not a file`);
          result.success = false;
        }
        
        // Check file permissions (read/write)
        try {
          fs.accessSync(component.path, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error) {
          result.warnings.push(`Permission error for ${component.name}: ${error.message}`);
          result.success = false;
        }
      } catch (error) {
        result.warnings.push(`Error checking ${component.name}: ${error.message}`);
        result.success = false;
      }
    }
    
    // Check JSON format integrity for config and tasks
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
        try {
          JSON.parse(configContent);
        } catch (error) {
          result.warnings.push(`Configuration file contains invalid JSON: ${error.message}`);
          result.success = false;
          
          // Attempt to fix if requested
          if (options.fix) {
            try {
              const defaultConfig = configManager.getDefaultConfig();
              fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
              result.fixed.push(`Replaced invalid configuration file with default settings`);
            } catch (fixError) {
              result.errors.push(`Failed to fix configuration file: ${fixError.message}`);
            }
          }
        }
      }
      
      if (fs.existsSync(TASKS_PATH)) {
        const tasksContent = fs.readFileSync(TASKS_PATH, 'utf8');
        try {
          const taskData = JSON.parse(tasksContent);
          
          // Basic structure validation
          if (!taskData.hasOwnProperty('lastId') || !Array.isArray(taskData.tasks)) {
            result.warnings.push('Tasks file has invalid structure (missing lastId or tasks array)');
            result.success = false;
            
            // Attempt to fix if requested
            if (options.fix) {
              try {
                // Create a new structure but try to preserve existing tasks
                const fixedData = {
                  lastId: taskData.lastId || 0,
                  tasks: Array.isArray(taskData.tasks) ? taskData.tasks : []
                };
                fs.writeFileSync(TASKS_PATH, JSON.stringify(fixedData, null, 2));
                result.fixed.push(`Fixed task file structure`);
              } catch (fixError) {
                result.errors.push(`Failed to fix tasks file: ${fixError.message}`);
              }
            }
          }
        } catch (error) {
          result.warnings.push(`Tasks file contains invalid JSON: ${error.message}`);
          result.success = false;
          
          // Attempt to fix if requested
          if (options.fix) {
            try {
              fs.writeFileSync(TASKS_PATH, JSON.stringify({ lastId: 0, tasks: [] }, null, 2));
              result.fixed.push(`Replaced invalid tasks file with an empty task list`);
            } catch (fixError) {
              result.errors.push(`Failed to fix tasks file: ${fixError.message}`);
            }
          }
        }
      }
    } catch (error) {
      result.warnings.push(`Error validating JSON files: ${error.message}`);
      result.success = false;
    }
    
    // Check script dependencies
    const scriptsDir = path.join(APP_ROOT, 'lib', 'commands');
    const coreDir = path.join(APP_ROOT, 'lib', 'core');
    
    const requiredModules = [
      { name: 'CLI Parser', path: path.join(coreDir, 'cli-parser.js') },
      { name: 'Task Manager', path: path.join(coreDir, 'task-manager.js') },
      { name: 'Config Manager', path: path.join(coreDir, 'config-manager.js') },
      { name: 'Formatting', path: path.join(coreDir, 'formatting.js') }
    ];
    
    for (const module of requiredModules) {
      if (!fs.existsSync(module.path)) {
        result.warnings.push(`Missing required module: ${module.name} (${module.path})`);
        result.success = false;
      }
    }
    
    // Output verification results
    if (options.json) {
      output(result, 'data', { globalOptions: options });
      return result;
    }
    
    if (result.success) {
      output('\n✅ TaskTracker verification completed successfully!', 'success', { globalOptions: options });
      output('All components are properly installed and configured.', 'info', { globalOptions: options });
    } else {
      output('\n⚠️ TaskTracker verification completed with warnings:', 'warning', { globalOptions: options });
      result.warnings.forEach(warning => {
        output(`  - ${warning}`, 'warning', { globalOptions: options });
      });
      
      if (result.errors.length > 0) {
        output('\n❌ Errors encountered during verification:', 'error', { globalOptions: options });
        result.errors.forEach(error => {
          output(`  - ${error}`, 'error', { globalOptions: options });
        });
      }
      
      if (result.fixed.length > 0) {
        output('\n🔧 Fixed issues:', 'success', { globalOptions: options });
        result.fixed.forEach(fix => {
          output(`  - ${fix}`, 'success', { globalOptions: options });
        });
      }
      
      if (options.fix) {
        output('\nSome issues were automatically fixed. Run verify again to check if all issues are resolved.', 'info', { globalOptions: options });
      } else {
        output('\nTry running "tt verify --fix" to automatically fix these issues.', 'info', { globalOptions: options });
      }
    }
    
    return result;
  } catch (error) {
    output(`❌ Error verifying TaskTracker: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message, warnings: [], errors: [error.message], fixed: [] };
  }
}

module.exports = {
  initPaths,
  verifyInstallation
}; 