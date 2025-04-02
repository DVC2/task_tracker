/**
 * TaskTracker Init Command
 * 
 * Initializes TaskTracker in the current directory
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output } = require('../core/formatting');
const configManager = require('../core/config-manager');

// Data paths (will be initialized)
let DATA_DIR = '';
let TASKS_PATH = '';
let FILE_HASHES_PATH = '';
let SNAPSHOTS_DIR = '';
let REPORTS_DIR = '';
let STATS_DIR = '';
let TASKIGNORE_PATH = '';

// Default ignore patterns (used when no .taskignore file exists)
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.cache/**',
  '.next/**',
  '.tasktracker/**',
  '**/*.log',
  '**/*.lock',
  '**/*.map'
];

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(rootDir, '.tasktracker');
  TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  FILE_HASHES_PATH = path.join(DATA_DIR, 'file-hashes.json');
  SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
  REPORTS_DIR = path.join(DATA_DIR, 'reports');
  STATS_DIR = path.join(DATA_DIR, 'stats');
  TASKIGNORE_PATH = path.join(process.cwd(), '.taskignore');
  
  // Also initialize the config manager
  configManager.initPaths(rootDir);
}

/**
 * Handle potential loading spinner
 * This is a simple implementation since the spinner isn't available here
 */
const spinner = {
  start: (message) => console.log(message),
  stop: (message) => message && console.log(message)
};

/**
 * Initialize TaskTracker in the current directory
 * @param {object} options Options for initialization
 * @returns {object} Result with status and details
 */
function initializeTaskTracker(options = {}) {
  try {
    const projectName = options.projectName || path.basename(process.cwd());
    const nonInteractive = options.nonInteractive || false;
    
    console.log('\n🚀 Initializing TaskTracker...');
    
    // Create TaskTracker directory if it doesn't exist
    spinner.start('Creating TaskTracker directory...');
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      spinner.stop('✅ Created TaskTracker directory: ' + DATA_DIR);
    } else {
      spinner.stop('ℹ️ TaskTracker directory already exists');
    }
    
    // Create tasks.json if it doesn't exist
    spinner.start('Setting up tasks database...');
    if (!fs.existsSync(TASKS_PATH)) {
      fs.writeFileSync(TASKS_PATH, JSON.stringify({ lastId: 0, tasks: [] }, null, 2));
      spinner.stop('✅ Created tasks database: ' + TASKS_PATH);
    } else {
      spinner.stop('ℹ️ Tasks database already exists');
    }
    
    // Create file-hashes.json if it doesn't exist
    spinner.start('Setting up file tracking system...');
    if (!fs.existsSync(FILE_HASHES_PATH)) {
      fs.writeFileSync(FILE_HASHES_PATH, JSON.stringify({}, null, 2));
      spinner.stop('✅ Created file hashes database: ' + FILE_HASHES_PATH);
    } else {
      spinner.stop('ℹ️ File hashes database already exists');
    }
    
    // Initialize configuration
    spinner.start('Creating configuration...');
    const config = configManager.loadConfig();
    
    // Update project name
    config.projectName = projectName;
    configManager.saveConfig(config);
    spinner.stop('✅ Configuration updated with project name: ' + projectName);
    
    // Create directories if they don't exist
    spinner.start('Creating directory structure...');
    const requiredDirs = [SNAPSHOTS_DIR, REPORTS_DIR, STATS_DIR];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    spinner.stop('✅ Created required directories');
    
    // Create .taskignore file if it doesn't exist
    spinner.start('Setting up ignore patterns...');
    if (!fs.existsSync(TASKIGNORE_PATH)) {
      initializeIgnoreFile();
      spinner.stop('✅ Created .taskignore file with default patterns');
    } else {
      spinner.stop('ℹ️ .taskignore file already exists');
    }
    
    console.log('\n🎉 TaskTracker initialized successfully!');
    console.log('Run `tt help` to see available commands.');
    console.log('Or try the shorthand alias: `tt help`');
    
    return { 
      success: true, 
      message: 'TaskTracker initialized successfully',
      projectName,
      dataDirectory: DATA_DIR
    };
  } catch (error) {
    spinner && spinner.stop();
    const errorMessage = `❌ Error initializing TaskTracker: ${error.message}`;
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Initialize .taskignore file with default patterns
 */
function initializeIgnoreFile() {
  // Create .taskignore file with default patterns
  const ignoreContent = DEFAULT_IGNORE_PATTERNS.join('\n') + '\n';
  fs.writeFileSync(TASKIGNORE_PATH, ignoreContent);
}

/**
 * Get the list of current ignore patterns
 * @returns {string[]} Array of ignore patterns
 */
function getIgnorePatterns() {
  try {
    if (fs.existsSync(TASKIGNORE_PATH)) {
      const content = fs.readFileSync(TASKIGNORE_PATH, 'utf8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }
    
    return DEFAULT_IGNORE_PATTERNS;
  } catch (error) {
    output(`❌ Error reading ignore patterns: ${error.message}`, 'error');
    return DEFAULT_IGNORE_PATTERNS;
  }
}

module.exports = {
  initPaths,
  initializeTaskTracker,
  initializeIgnoreFile,
  getIgnorePatterns
}; 