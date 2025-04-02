/**
 * TaskTracker Changes Command
 * 
 * Tracks changes to files and shows impacted tasks
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Import dependencies
const { output } = require('../core/formatting');
const taskManager = require('../core/task-manager');

// Data paths (will be initialized)
let DATA_DIR = '';
let FILE_HASHES_PATH = '';
let TASKIGNORE_PATH = '';

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(rootDir, '.tasktracker');
  FILE_HASHES_PATH = path.join(DATA_DIR, 'file-hashes.json');
  TASKIGNORE_PATH = path.join(process.cwd(), '.taskignore');
}

/**
 * Default patterns to ignore for file tracking
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
 * Track changes to files and show impacted tasks
 * @param {string} targetPath Optional path to a specific directory or file to check
 * @param {object} options Options for operation
 * @returns {object} Result with changes found
 */
function trackChanges(targetPath = null, options = {}) {
  try {
    // Create file hashes file if it doesn't exist
    if (!fs.existsSync(FILE_HASHES_PATH)) {
      fs.writeFileSync(FILE_HASHES_PATH, JSON.stringify({}, null, 2));
    }
    
    // Load previous file hashes
    const fileHashes = JSON.parse(fs.readFileSync(FILE_HASHES_PATH, 'utf8'));
    
    // Get ignore patterns
    const ignorePatterns = getIgnorePatterns();
    
    // Determine the root path to scan
    const rootPath = targetPath ? path.resolve(targetPath) : process.cwd();
    
    // Check if the root path exists
    if (!fs.existsSync(rootPath)) {
      output(`❌ Path not found: ${rootPath}`, 'error', { globalOptions: options });
      return { success: false, error: `Path not found: ${rootPath}` };
    }
    
    // Initialize results arrays
    const newFiles = [];
    const modifiedFiles = [];
    const deletedFiles = [];
    
    // Check if we're using Git
    const isGitRepo = isGitRepository();
    
    if (isGitRepo && !options.disableGit) {
      // Use Git to detect changes
      const { changedFiles, filesToCheck } = getChangesFromGit(rootPath);
      
      // Add changed files to respective arrays
      changedFiles.forEach(change => {
        if (change.status === 'A') {
          newFiles.push(change.file);
        } else if (change.status === 'M') {
          modifiedFiles.push(change.file);
        } else if (change.status === 'D') {
          deletedFiles.push(change.file);
        }
      });
      
      // Compute hashes and update records for tracked files
      filesToCheck.forEach(file => {
        try {
          const fullPath = path.join(rootPath, file);
          if (fs.existsSync(fullPath) && !isIgnored(file, ignorePatterns)) {
            const hash = computeFileHash(fullPath);
            fileHashes[file] = hash;
          }
        } catch (error) {
          // Silently skip files that can't be accessed
        }
      });
    } else {
      // Fallback to manual file scanning
      output(`ℹ️ Using manual file scanning (Git not detected)`, 'info', { globalOptions: options });
      
      // Get all files in the directory (recursive)
      const allFiles = getAllFiles(rootPath, ignorePatterns, rootPath);
      
      // Check each file against previous hashes
      allFiles.forEach(file => {
        const relativePath = path.relative(rootPath, file);
        
        try {
          const hash = computeFileHash(file);
          
          if (!fileHashes[relativePath]) {
            newFiles.push(relativePath);
            fileHashes[relativePath] = hash;
          } else if (fileHashes[relativePath] !== hash) {
            modifiedFiles.push(relativePath);
            fileHashes[relativePath] = hash;
          }
        } catch (error) {
          // Skip files we can't read
        }
      });
      
      // Check for deleted files
      Object.keys(fileHashes).forEach(file => {
        const fullPath = path.join(rootPath, file);
        if (!fs.existsSync(fullPath)) {
          deletedFiles.push(file);
          delete fileHashes[file];
        }
      });
    }
    
    // Save updated file hashes
    fs.writeFileSync(FILE_HASHES_PATH, JSON.stringify(fileHashes, null, 2));
    
    // Find tasks affected by changes
    const tasksData = taskManager.loadTasks();
    const affectedTasks = findAffectedTasks(tasksData.tasks, [...newFiles, ...modifiedFiles, ...deletedFiles]);
    
    // Build changes result object
    const changesResult = {
      new: newFiles,
      modified: modifiedFiles,
      deleted: deletedFiles,
      affected_tasks: affectedTasks
    };
    
    // JSON output if requested
    if (options.json) {
      output(changesResult, 'data', { globalOptions: options });
      return { success: true, changes: changesResult };
    }
    
    // Display results
    output('\n📋 File Changes Summary:', 'info', { globalOptions: options });
    
    if (newFiles.length === 0 && modifiedFiles.length === 0 && deletedFiles.length === 0) {
      output('No changes detected.', 'info', { globalOptions: options });
    } else {
      // Display new files
      if (newFiles.length > 0) {
        output('\n🆕 New Files:', 'info', { globalOptions: options });
        newFiles.forEach(file => {
          output(`  + ${file}`, 'info', { globalOptions: options });
        });
      }
      
      // Display modified files
      if (modifiedFiles.length > 0) {
        output('\n✏️ Modified Files:', 'info', { globalOptions: options });
        modifiedFiles.forEach(file => {
          output(`  ~ ${file}`, 'info', { globalOptions: options });
        });
      }
      
      // Display deleted files
      if (deletedFiles.length > 0) {
        output('\n🗑️ Deleted Files:', 'info', { globalOptions: options });
        deletedFiles.forEach(file => {
          output(`  - ${file}`, 'info', { globalOptions: options });
        });
      }
    }
    
    // Display affected tasks
    if (affectedTasks.length > 0) {
      output('\n🔄 Affected Tasks:', 'info', { globalOptions: options });
      affectedTasks.forEach(task => {
        const files = task.matchedFiles.map(f => `\n    - ${f}`).join('');
        output(`  #${task.id}: ${task.title} ${files}`, 'info', { globalOptions: options });
      });
    } else {
      output('\nℹ️ No tasks are affected by these changes.', 'info', { globalOptions: options });
    }
    
    return { success: true, changes: changesResult };
  } catch (error) {
    output(`❌ Error tracking changes: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Get ignore patterns from .taskignore or use defaults
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

/**
 * Check if a path should be ignored
 * @param {string} filePath Path to check
 * @param {string[]} patterns Patterns to check against
 * @returns {boolean} True if the path should be ignored
 */
function isIgnored(filePath, patterns) {
  return patterns.some(pattern => {
    // Simple glob pattern matching
    if (pattern.endsWith('/**')) {
      const dir = pattern.slice(0, -3);
      return filePath.startsWith(dir);
    } else if (pattern.startsWith('**/')) {
      const extension = pattern.slice(3);
      return filePath.endsWith(extension);
    } else if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(filePath);
    } else {
      return filePath === pattern;
    }
  });
}

/**
 * Compute MD5 hash of a file
 * @param {string} filePath Path to file
 * @returns {string} MD5 hash
 */
function computeFileHash(filePath) {
  const fileContent = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileContent).digest('hex');
}

/**
 * Check if current directory is a Git repository
 * @returns {boolean} True if Git repository
 */
function isGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get changed files from Git
 * @param {string} rootPath Root path for Git repository
 * @returns {object} Changed files and files to check
 */
function getChangesFromGit(rootPath) {
  try {
    // Get staged and unstaged changes
    const gitStatus = execSync('git status --porcelain', { cwd: rootPath }).toString();
    
    // Parse git status output
    const changedFiles = gitStatus.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const status = line.charAt(0) !== ' ' ? line.charAt(0) : line.charAt(1);
        const file = line.slice(3);
        return { status, file };
      });
    
    // All changed files to check
    const filesToCheck = changedFiles.map(change => change.file);
    
    return { changedFiles, filesToCheck };
  } catch (error) {
    return { changedFiles: [], filesToCheck: [] };
  }
}

/**
 * Get all files in a directory recursively
 * @param {string} dir Directory to scan
 * @param {string[]} ignorePatterns Patterns to ignore
 * @param {string} rootPath Project root path for relative path calculation
 * @returns {string[]} Array of file paths
 */
function getAllFiles(dir, ignorePatterns, rootPath) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.relative(rootPath, fullPath);
      
      if (isIgnored(relativePath, ignorePatterns)) {
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat && stat.isDirectory()) {
        // Recurse into directory
        results = results.concat(getAllFiles(fullPath, ignorePatterns, rootPath));
      } else {
        // Add file
        results.push(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
  
  return results;
}

/**
 * Find tasks affected by file changes
 * @param {array} tasks List of tasks
 * @param {string[]} changedFiles List of changed files
 * @returns {array} Affected tasks with matched files
 */
function findAffectedTasks(tasks, changedFiles) {
  return tasks
    .filter(task => task.relatedFiles && task.relatedFiles.length > 0)
    .map(task => {
      const matchedFiles = task.relatedFiles.filter(taskFile => 
        changedFiles.some(changedFile => 
          changedFile === taskFile || 
          changedFile.endsWith(taskFile) || 
          taskFile.endsWith(changedFile)
        )
      );
      
      return matchedFiles.length > 0 ? { 
        id: task.id, 
        title: task.title,
        status: task.status,
        matchedFiles 
      } : null;
    })
    .filter(Boolean);
}

module.exports = {
  initPaths,
  trackChanges
}; 