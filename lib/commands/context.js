/**
 * TaskTracker Context Command
 * 
 * Generates AI context information based on tasks and project structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import dependencies
const { output } = require('../core/formatting');
const taskManager = require('../core/task-manager');

// Data paths (will be initialized)
let TASKS_PATH = '';
let CONFIG_PATH = '';

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  const DATA_DIR = process.env.TASKTRACKER_DATA_DIR || path.join(rootDir, '.tasktracker');
  TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
}

/**
 * Get the current working file(s) based on specified criteria
 * @param {string} file Specific file to get context for
 * @param {boolean} useGit Whether to use git for determining relevant files
 * @returns {Array} List of file paths
 */
function getWorkingFiles(file, useGit = true) {
  const files = [];
  
  // If a specific file is provided, use that
  if (file && fs.existsSync(file)) {
    files.push(file);
    return files;
  }
  
  // Try to use git to get the most recently modified files
  if (useGit) {
    try {
      // Get recently modified files from git
      const gitOutput = execSync('git ls-files --modified --others --exclude-standard').toString();
      const gitFiles = gitOutput.split('\n').filter(Boolean);
      
      if (gitFiles.length > 0) {
        return gitFiles.slice(0, 5); // Limit to 5 files
      }
    } catch (error) {
      // Git not available, fall back to other methods
    }
  }
  
  // If no files found yet, check current directory
  const currentDir = process.cwd();
  try {
    const dirFiles = fs.readdirSync(currentDir)
      .filter(f => !f.startsWith('.') && fs.statSync(path.join(currentDir, f)).isFile())
      .slice(0, 5); // Limit to 5 files
    
    return dirFiles.map(f => path.join(currentDir, f));
  } catch (error) {
    // Unable to read directory
  }
  
  return files;
}

/**
 * Get tasks related to a specific file
 * @param {string} filePath Path to the file
 * @returns {Array} Related tasks
 */
function getTasksForFile(filePath) {
  if (!filePath) return [];
  
  try {
    const allTasks = taskManager.loadTasks().tasks;
    return allTasks.filter(task => {
      if (!task.relatedFiles || !Array.isArray(task.relatedFiles)) {
        return false;
      }
      
      // Normalize paths for comparison
      const normalizedPath = path.normalize(filePath);
      return task.relatedFiles.some(taskFile => {
        const normalizedTaskFile = path.normalize(taskFile);
        return normalizedTaskFile === normalizedPath || 
               normalizedPath.includes(normalizedTaskFile) ||
               normalizedTaskFile.includes(normalizedPath);
      });
    });
  } catch (error) {
    return [];
  }
}

/**
 * Generate a summary of the project
 * @returns {string} Project summary
 */
function generateProjectSummary() {
  let summary = '';
  
  // Try to get package.json for project info
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      summary += `Project: ${packageInfo.name || 'Unknown'}\n`;
      summary += `Description: ${packageInfo.description || 'No description available'}\n`;
      summary += `Version: ${packageInfo.version || 'Unknown'}\n\n`;
    }
  } catch (error) {
    // Unable to get package info
  }
  
  // Get active tasks
  try {
    const allTasks = taskManager.loadTasks().tasks;
    const todoTasks = allTasks.filter(task => task.status.toLowerCase() === 'todo').length;
    const inProgressTasks = allTasks.filter(task => 
      task.status.toLowerCase() === 'in-progress' || 
      task.status.toLowerCase() === 'inprogress'
    ).length;
    
    summary += `Tasks: ${allTasks.length} total, ${todoTasks} todo, ${inProgressTasks} in progress\n\n`;
  } catch (error) {
    // Unable to get task info
  }
  
  return summary;
}

/**
 * Generate AI context information
 * @param {string[]} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status and generated context
 */
function generateContext(args = [], options = {}) {
  try {
    // Parse options
    const fileArg = args[0];
    const useGit = !options.disableGit;
    const format = options.format || 'text';
    const outputToFile = options.output;
    
    // Get files to generate context for
    const files = getWorkingFiles(fileArg, useGit);
    
    if (files.length === 0) {
      output('⚠️ No files found to generate context for.', 'warning', { globalOptions: options });
      return { success: false, error: 'No files found' };
    }
    
    // Start building the context
    let context = '';
    
    // Add project summary
    context += '# Project Context\n\n';
    context += generateProjectSummary();
    
    // Add file-specific information
    context += '# Current Files\n\n';
    
    for (const file of files) {
      const relatedTasks = getTasksForFile(file);
      
      context += `## ${path.basename(file)}\n`;
      context += `Path: ${file}\n`;
      
      // Add related tasks
      if (relatedTasks.length > 0) {
        context += 'Related Tasks:\n';
        relatedTasks.forEach(task => {
          context += `- #${task.id}: ${task.title} [${task.status}]\n`;
          if (task.description) {
            context += `  Description: ${task.description}\n`;
          }
        });
      } else {
        context += 'No related tasks.\n';
      }
      
      // Add file summary
      try {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
          const fileContent = fs.readFileSync(file, 'utf8');
          const fileLines = fileContent.split('\n');
          
          context += `\nFile Type: ${path.extname(file)}\n`;
          context += `Lines: ${fileLines.length}\n`;
          
          // Add a brief sample of the file (first 5 lines)
          context += '\nSample Content:\n```\n';
          context += fileLines.slice(0, 5).join('\n');
          context += '\n...\n```\n\n';
        }
      } catch (error) {
        context += `Error reading file: ${error.message}\n\n`;
      }
    }
    
    // Add active tasks overview
    context += '# Active Tasks\n\n';
    
    try {
      const allTasks = taskManager.loadTasks().tasks;
      const activeTasks = allTasks.filter(task => 
        task.status.toLowerCase() === 'todo' || 
        task.status.toLowerCase() === 'in-progress' || 
        task.status.toLowerCase() === 'inprogress'
      );
      
      if (activeTasks.length > 0) {
        activeTasks.forEach(task => {
          context += `## Task #${task.id}: ${task.title}\n`;
          context += `Status: ${task.status}, Category: ${task.category}\n`;
          if (task.description) {
            context += `Description: ${task.description}\n`;
          }
          if (task.relatedFiles && task.relatedFiles.length > 0) {
            context += `Related Files: ${task.relatedFiles.join(', ')}\n`;
          }
          context += '\n';
        });
      } else {
        context += 'No active tasks found.\n\n';
      }
    } catch (error) {
      context += `Error loading tasks: ${error.message}\n\n`;
    }
    
    // Format output based on requested format
    let formattedOutput = context;
    
    if (format === 'json') {
      const contextObj = {
        project: generateProjectSummary(),
        files: files.map(file => ({
          name: path.basename(file),
          path: file,
          relatedTasks: getTasksForFile(file).map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            description: task.description
          }))
        })),
        activeTasks: taskManager.loadTasks().tasks
          .filter(task => 
            task.status.toLowerCase() === 'todo' || 
            task.status.toLowerCase() === 'in-progress' || 
            task.status.toLowerCase() === 'inprogress'
          )
          .map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            category: task.category,
            description: task.description,
            relatedFiles: task.relatedFiles
          }))
      };
      
      formattedOutput = JSON.stringify(contextObj, null, 2);
    }
    
    // Output to file if requested
    if (outputToFile) {
      const outputPath = typeof outputToFile === 'string' ? 
        outputToFile : `tasktracker-context-${new Date().toISOString().replace(/:/g, '-')}.${format === 'json' ? 'json' : 'md'}`;
      
      fs.writeFileSync(outputPath, formattedOutput);
      output(`✅ Context information written to ${outputPath}`, 'success', { globalOptions: options });
    } else {
      // Output to console
      output(formattedOutput, 'info', { globalOptions: options });
    }
    
    return { 
      success: true, 
      context: formattedOutput,
      files: files,
      relatedTasks: files.flatMap(file => getTasksForFile(file))
    };
  } catch (error) {
    output(`❌ Error generating context: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initPaths,
  generateContext,
  getWorkingFiles,
  getTasksForFile
}; 