/**
 * TaskTracker Ignore Command
 * 
 * Manages .taskignore patterns for file tracking
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output } = require('../core/formatting');

// Data paths (will be initialized)
let TASKIGNORE_PATH = '';

/**
 * Default ignore patterns (used when no .taskignore file exists)
 */
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
  TASKIGNORE_PATH = path.join(process.cwd(), '.taskignore');
}

/**
 * Manage taskignore patterns
 * @param {string[]} args Command arguments [action, pattern]
 * @param {object} options Command options
 * @returns {object} Result object
 */
function manageIgnorePatterns(args = [], options = {}) {
  try {
    // Parse arguments
    const action = args[0] || 'list';
    const pattern = args[1] || '';
    
    switch (action.toLowerCase()) {
      case 'list':
        return showIgnorePatterns(options);
      
      case 'add':
        return addIgnorePattern(pattern, options);
      
      case 'remove':
        return removeIgnorePattern(pattern, options);
      
      case 'init':
        return initializeIgnoreFile(options);
      
      default:
        output(`❌ Unknown action: ${action}`, 'error', { globalOptions: options });
        output('\nUsage: tt ignore <action> [pattern]', 'info', { globalOptions: options });
        output('Actions:', 'info', { globalOptions: options });
        output('  list               - Show current ignore patterns', 'info', { globalOptions: options });
        output('  add <pattern>      - Add a new ignore pattern', 'info', { globalOptions: options });
        output('  remove <pattern>   - Remove an ignore pattern', 'info', { globalOptions: options });
        output('  init               - Create a default .taskignore file', 'info', { globalOptions: options });
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    output(`❌ Error managing ignore patterns: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Show current ignore patterns
 * @param {object} options Command options
 * @returns {object} Result with patterns
 */
function showIgnorePatterns(options = {}) {
  try {
    const patterns = getIgnorePatterns();
    
    if (options.json) {
      output(patterns, 'data', { globalOptions: options });
      return { success: true, patterns };
    }
    
    output('\n📋 Current Ignore Patterns:', 'info', { globalOptions: options });
    
    if (patterns.length === 0) {
      output('  No ignore patterns found.', 'info', { globalOptions: options });
    } else {
      patterns.forEach(pattern => {
        output(`  ${pattern}`, 'info', { globalOptions: options });
      });
    }
    
    if (!fs.existsSync(TASKIGNORE_PATH)) {
      output('\nℹ️ Using default ignore patterns (no .taskignore file found).', 'info', { globalOptions: options });
      output('Run "tt ignore init" to create a .taskignore file.', 'info', { globalOptions: options });
    }
    
    return { success: true, patterns };
  } catch (error) {
    output(`❌ Error showing ignore patterns: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Add a pattern to .taskignore
 * @param {string} pattern Pattern to add
 * @param {object} options Command options
 * @returns {object} Result status
 */
function addIgnorePattern(pattern, options = {}) {
  try {
    if (!pattern) {
      output('❌ Pattern required', 'error', { globalOptions: options });
      return { success: false, error: 'Pattern required' };
    }
    
    // Create the file if it doesn't exist
    if (!fs.existsSync(TASKIGNORE_PATH)) {
      initializeIgnoreFile(options);
    }
    
    // Load current patterns
    let content = fs.readFileSync(TASKIGNORE_PATH, 'utf8');
    const lines = content.split('\n').map(line => line.trim());
    
    // Check if pattern already exists
    if (lines.includes(pattern)) {
      output(`⚠️ Pattern "${pattern}" already exists.`, 'warning', { globalOptions: options });
      return { success: true, message: 'Pattern already exists' };
    }
    
    // Add pattern
    lines.push(pattern);
    
    // Write back to file
    fs.writeFileSync(TASKIGNORE_PATH, lines.join('\n'));
    
    output(`✅ Added pattern: ${pattern}`, 'success', { globalOptions: options });
    return { success: true };
  } catch (error) {
    output(`❌ Error adding ignore pattern: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Remove a pattern from .taskignore
 * @param {string} pattern Pattern to remove
 * @param {object} options Command options
 * @returns {object} Result status
 */
function removeIgnorePattern(pattern, options = {}) {
  try {
    if (!pattern) {
      output('❌ Pattern required', 'error', { globalOptions: options });
      return { success: false, error: 'Pattern required' };
    }
    
    // Check if file exists
    if (!fs.existsSync(TASKIGNORE_PATH)) {
      output('❌ No .taskignore file found.', 'error', { globalOptions: options });
      return { success: false, error: 'No .taskignore file found' };
    }
    
    // Load current patterns
    let content = fs.readFileSync(TASKIGNORE_PATH, 'utf8');
    let lines = content.split('\n').map(line => line.trim());
    
    // Remove pattern
    const originalLength = lines.length;
    lines = lines.filter(line => line !== pattern && line !== '');
    
    // Check if pattern was found
    if (lines.length === originalLength) {
      output(`❌ Pattern "${pattern}" not found.`, 'error', { globalOptions: options });
      return { success: false, error: 'Pattern not found' };
    }
    
    // Write back to file
    fs.writeFileSync(TASKIGNORE_PATH, lines.join('\n'));
    
    output(`✅ Removed pattern: ${pattern}`, 'success', { globalOptions: options });
    return { success: true };
  } catch (error) {
    output(`❌ Error removing ignore pattern: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Initialize .taskignore file with default patterns
 * @param {object} options Command options
 * @returns {object} Result status
 */
function initializeIgnoreFile(options = {}) {
  try {
    // Check if file already exists
    const fileExists = fs.existsSync(TASKIGNORE_PATH);
    
    if (fileExists && !options.force) {
      output('⚠️ .taskignore file already exists. Use --force to overwrite.', 'warning', { globalOptions: options });
      return { success: false, error: '.taskignore file already exists' };
    }
    
    // Create default .taskignore content
    const content = [
      '# TaskTracker ignore patterns',
      '# Files and directories matching these patterns will be ignored in file tracking',
      '# Lines starting with # are comments',
      '',
      ...DEFAULT_IGNORE_PATTERNS
    ].join('\n');
    
    // Write the file
    fs.writeFileSync(TASKIGNORE_PATH, content);
    
    output('✅ Created .taskignore file with default patterns.', 'success', { globalOptions: options });
    
    // Show the created patterns
    showIgnorePatterns(options);
    
    return { success: true };
  } catch (error) {
    output(`❌ Error initializing .taskignore file: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Get current ignore patterns
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
    return DEFAULT_IGNORE_PATTERNS;
  }
}

module.exports = {
  initPaths,
  manageIgnorePatterns,
  showIgnorePatterns,
  addIgnorePattern,
  removeIgnorePattern,
  initializeIgnoreFile,
  getIgnorePatterns,
  DEFAULT_IGNORE_PATTERNS
}; 