#!/usr/bin/env node

/**
 * TaskTracker Quick Task
 * 
 * A minimal interface for quickly adding tasks with minimal input.
 * Format: quick "<title>" <category> [--priority=X] [--effort=Y]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fileCache = require('./file-cache');

// Constants
const DATA_DIR = path.join(process.cwd(), '.tasktracker');
const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

// Process command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Quick task requires a title and category');
  console.error('Usage: tasktracker quick "<title>" <category> [--priority=X] [--effort=Y]');
  process.exit(1);
}

// Parse arguments
const title = args[0];
const category = args[1];
let priority = null;
let effort = null;
let silent = false;

// Check for additional options
for (let i = 2; i < args.length; i++) {
  const arg = args[i].toLowerCase();
  
  if (arg.startsWith('--priority=')) {
    priority = arg.split('=')[1];
  } else if (arg.startsWith('--effort=')) {
    effort = arg.split('=')[1];
  } else if (arg === '--silent' || arg === '-s') {
    silent = true;
  }
}

// Create a task using optimized file access
try {
  // Check if task file exists
  if (!fs.existsSync(TASKS_PATH)) {
    console.error('❌ TaskTracker not initialized! Run: tasktracker init');
    process.exit(1);
  }
  
  // Use our batch process functionality for optimized, atomic operations
  const operations = [
    { type: 'read', path: CONFIG_PATH, id: 'config' },
    { type: 'read', path: TASKS_PATH, id: 'tasks' },
    { 
      type: 'update', 
      path: TASKS_PATH, 
      updateFn: (tasksData) => {
        // Reference to the config data (already read)
        const config = operations.find(op => op.id === 'config').result;
        
        // Validate category
        const validCategories = config.taskCategories || ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore'];
        if (!validCategories.includes(category)) {
          throw new Error(`Invalid category: ${category}. Valid categories: ${validCategories.join(', ')}`);
        }
        
        // Validate priority if provided
        if (priority) {
          const validPriorities = config.priorityLevels || ['p0-critical', 'p1-high', 'p2-medium', 'p3-low'];
          if (!validPriorities.includes(priority)) {
            throw new Error(`Invalid priority: ${priority}. Valid priorities: ${validPriorities.join(', ')}`);
          }
        }
        
        // Validate effort if provided
        if (effort) {
          const validEfforts = config.effortEstimation || ['1-trivial', '2-small', '3-medium', '5-large', '8-xlarge', '13-complex'];
          if (!validEfforts.includes(effort)) {
            throw new Error(`Invalid effort: ${effort}. Valid efforts: ${validEfforts.join(', ')}`);
          }
        }
        
        // Create a new task object
        const newTask = {
          id: tasksData.lastId + 1,
          title: title,
          description: "",
          category: category,
          status: "todo",
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          createdBy: process.env.USER || "unknown",
          branch: "main",
          relatedFiles: [],
          comments: []
        };
        
        // Add optional fields if provided
        if (priority) {
          newTask.priority = priority;
        }
        
        if (effort) {
          newTask.effort = effort;
        }
        
        // Update the tasks data
        tasksData.lastId = newTask.id;
        tasksData.tasks.push(newTask);
        
        // Return the modified data
        return {
          taskId: newTask.id,
          tasksData: tasksData
        };
      },
      options: { atomic: true }
    }
  ];
  
  // Execute all operations as a transaction
  fileCache.batchProcess(operations);
  
  // Get the result
  const result = operations.find(op => op.type === 'update').result;
  
  if (!silent) {
    console.log(`✅ Task #${result.taskId} created: "${title}" (${category})`);
  }
  
} catch (error) {
  console.error(`❌ Error creating task: ${error.message}`);
  process.exit(1);
}
