#!/usr/bin/env node

/**
 * TaskTracker - Task Context Export
 * 
 * Generates a markdown summary of task details suitable for PR descriptions,
 * sharing with team members, or AI context windows.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const DATA_DIR = path.join(process.cwd(), '.tasktracker');
const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');

/**
 * Generate a markdown context summary for a task
 * 
 * @param {string} taskId - The ID of the task
 * @param {Object} options - Options for format and included fields
 */
function generateTaskContext(taskId, options = {}) {
  try {
    // Check if TaskTracker is initialized
    if (!fs.existsSync(TASKS_PATH)) {
      console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
      process.exit(1);
    }

    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    let task;
    
    // If taskId is "current", try to find an in-progress task
    if (taskId === 'current') {
      task = tasksData.tasks.find(t => t.status.toLowerCase() === 'in-progress');
      if (!task) {
        console.error('❌ No task currently in progress. Specify a task ID or start working on a task.');
        process.exit(1);
      }
    } else {
      // Find the task by ID
      task = tasksData.tasks.find(t => t.id.toString() === taskId.toString());
      if (!task) {
        console.error(`❌ Task #${taskId} not found`);
        process.exit(1);
      }
    }

    // Generate context
    const format = options.format || 'markdown';
    
    if (format === 'markdown') {
      generateMarkdownContext(task, options);
    } else if (format === 'json') {
      console.log(JSON.stringify(task, null, 2));
    } else if (format === 'plain') {
      generatePlainTextContext(task, options);
    } else {
      console.error(`❌ Unknown format: ${format}. Supported formats: markdown, json, plain`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate markdown context for a task
 */
function generateMarkdownContext(task, options = {}) {
  const includeFiles = options.includeFiles !== false;
  const includeComments = options.includeComments !== false;
  const includeCommits = options.includeCommits !== false;
  const includeDependencies = options.includeDependencies !== false;
  const includeCodeSnippets = options.includeCodeSnippets === true;
  const forPr = options.forPr === true;
  
  let markdown = '';
  
  // PR title format if requested
  if (forPr) {
    markdown += `# ${task.title}\n\n`;
    markdown += `Resolves #${task.id}\n\n`;
  } else {
    markdown += `## Task #${task.id}: ${task.title}\n\n`;
  }
  
  // Task metadata
  markdown += `**Status:** ${task.status}\n`;
  markdown += `**Category:** ${task.category}\n`;
  
  if (task.priority) {
    markdown += `**Priority:** ${task.priority}\n`;
  }
  
  if (task.effort) {
    markdown += `**Effort:** ${task.effort}\n`;
  }
  
  markdown += `**Created:** ${new Date(task.created).toLocaleString()}\n`;
  
  if (task.lastUpdated) {
    markdown += `**Last Updated:** ${new Date(task.lastUpdated).toLocaleString()}\n`;
  }
  
  markdown += '\n';
  
  // Task description
  if (task.description) {
    markdown += `### Description\n\n${task.description}\n\n`;
  }
  
  // Related files
  if (includeFiles && task.relatedFiles && task.relatedFiles.length > 0) {
    markdown += '### Related Files\n\n';
    
    task.relatedFiles.forEach(file => {
      markdown += `- \`${file}\`\n`;
      
      // Add code snippets if requested
      if (includeCodeSnippets && fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          if (stats.isFile() && stats.size < 100 * 1024) { // Skip files larger than 100KB
            const extension = path.extname(file).substring(1);
            const content = fs.readFileSync(file, 'utf8');
            const snippet = content.length > 1000 ? content.substring(0, 997) + '...' : content;
            
            markdown += '\n```' + extension + '\n' + snippet + '\n```\n\n';
          }
        } catch (error) {
          // Silently skip files with issues
        }
      }
    });
    
    markdown += '\n';
  }
  
  // Comments
  if (includeComments && task.comments && task.comments.length > 0) {
    markdown += '### Comments\n\n';
    
    task.comments.forEach(comment => {
      const date = new Date(comment.date).toLocaleString();
      markdown += `**${comment.author}** (${date}):\n`;
      markdown += `${comment.text}\n\n`;
    });
  }
  
  // Commits
  if (includeCommits && task.commits && task.commits.length > 0) {
    markdown += '### Commits\n\n';
    
    task.commits.forEach(commit => {
      const shortHash = commit.hash.substring(0, 8);
      const date = new Date(commit.date).toLocaleString();
      markdown += `- **${shortHash}** (${date}): ${commit.message}\n`;
      
      if (commit.files && commit.files.length > 0) {
        markdown += '  - Files:\n';
        commit.files.forEach(file => {
          if (file.trim()) {
            markdown += `    - \`${file}\`\n`;
          }
        });
      }
      
      markdown += '\n';
    });
  }
  
  // Dependencies
  if (includeDependencies) {
    if (task.dependencies && task.dependencies.length > 0) {
      markdown += '### Dependencies\n\n';
      markdown += 'This task depends on:\n\n';
      
      task.dependencies.forEach(depId => {
        const dep = tasksData.tasks.find(t => t.id.toString() === depId.toString());
        if (dep) {
          markdown += `- #${dep.id}: ${dep.title} (${dep.status})\n`;
        } else {
          markdown += `- #${depId} (not found)\n`;
        }
      });
      
      markdown += '\n';
    }
    
    if (task.blockedBy && task.blockedBy.length > 0) {
      markdown += '### Blocked By\n\n';
      
      task.blockedBy.forEach(blockerId => {
        const blocker = tasksData.tasks.find(t => t.id.toString() === blockerId.toString());
        if (blocker) {
          markdown += `- #${blocker.id}: ${blocker.title} (${blocker.status})\n`;
        } else {
          markdown += `- #${blockerId} (not found)\n`;
        }
      });
      
      markdown += '\n';
    }
  }
  
  // Additional PR information
  if (forPr) {
    markdown += '### Testing Performed\n\n';
    markdown += '- [ ] Unit tests\n';
    markdown += '- [ ] Integration tests\n';
    markdown += '- [ ] Manual testing\n\n';
    
    markdown += '### Screenshots/Recordings\n\n';
    markdown += '_Add screenshots or recordings if applicable._\n\n';
  }
  
  console.log(markdown);
}

/**
 * Generate plain text context for a task
 */
function generatePlainTextContext(task, options = {}) {
  const includeFiles = options.includeFiles !== false;
  const includeComments = options.includeComments !== false;
  
  let text = '';
  
  // Basic info
  text += `Task #${task.id}: ${task.title}\n`;
  text += `Status: ${task.status}   Category: ${task.category}\n`;
  
  if (task.priority) {
    text += `Priority: ${task.priority}`;
  }
  
  if (task.effort) {
    text += `   Effort: ${task.effort}`;
  }
  
  text += '\n\n';
  
  // Description
  if (task.description) {
    text += `Description:\n${task.description}\n\n`;
  }
  
  // Related files
  if (includeFiles && task.relatedFiles && task.relatedFiles.length > 0) {
    text += 'Related Files:\n';
    task.relatedFiles.forEach(file => {
      text += `- ${file}\n`;
    });
    text += '\n';
  }
  
  // Comments
  if (includeComments && task.comments && task.comments.length > 0) {
    text += 'Comments:\n';
    
    task.comments.forEach(comment => {
      const date = new Date(comment.date).toLocaleString();
      text += `${comment.author} (${date}):\n${comment.text}\n\n`;
    });
  }
  
  console.log(text);
}

// Allow use as a command-line script or imported module
if (require.main === module) {
  const args = process.argv.slice(2);
  const taskId = args[0] || 'current';
  
  const options = {
    format: 'markdown',
    includeFiles: true,
    includeComments: true,
    includeCommits: true,
    includeCodeSnippets: false,
    forPr: false
  };
  
  // Parse additional options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--json') {
      options.format = 'json';
    } else if (args[i] === '--plain') {
      options.format = 'plain';
    } else if (args[i] === '--pr') {
      options.forPr = true;
    } else if (args[i] === '--no-files') {
      options.includeFiles = false;
    } else if (args[i] === '--no-comments') {
      options.includeComments = false;
    } else if (args[i] === '--no-commits') {
      options.includeCommits = false;
    } else if (args[i] === '--snippets') {
      options.includeCodeSnippets = true;
    }
  }
  
  generateTaskContext(taskId, options);
} else {
  module.exports = { generateTaskContext };
} 