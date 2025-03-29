#!/usr/bin/env node

/**
 * Quick Task - A simple utility for faster task creation
 * 
 * This script provides a simplified way to create TaskTracker tasks
 * with minimal input, great for quick task entry.
 * 
 * Usage: 
 *   node quick-task.js "Task title" [category] [files...]
 * 
 * Examples:
 *   node quick-task.js "Fix login button"
 *   node quick-task.js "Add user profile" feature src/profile.js src/user.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG_PATH = '.tasktracker/config.json';
const TASKS_PATH = '.tasktracker/tasks.json';

// Default category if not specified
const DEFAULT_CATEGORY = 'feature';

// Check if TaskTracker is initialized
if (!fs.existsSync(CONFIG_PATH) || !fs.existsSync(TASKS_PATH)) {
  console.error('❌ TaskTracker not initialized! Please run: node tasktracker.js init');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
Quick Task - Faster task creation for TaskTracker

Usage:
  node quick-task.js "Task title" [category] [files...]

Examples:
  node quick-task.js "Fix login button" 
  node quick-task.js "Add user profile" feature
  node quick-task.js "Fix CSS layout" bugfix src/styles.css

Categories: (from your TaskTracker configuration)
  ${getValidCategories().join(', ')}
  `);
  process.exit(0);
}

// Global options to filter out
const globalOptionFlags = [
  '--json', '-j',
  '--silent', '-s',
  '--non-interactive', '--ni'
];

// Extract task information
const title = args[0];
let category = args[1];

// Filter out global option flags from files
const rawFiles = args.slice(category ? 2 : 1);
const files = rawFiles.filter(file => !globalOptionFlags.includes(file));

// Validate category
const validCategories = getValidCategories();
if (!category) {
  category = DEFAULT_CATEGORY;
} else if (!validCategories.includes(category)) {
  console.warn(`⚠️ Invalid category: "${category}"`);
  console.log(`Valid categories: ${validCategories.join(', ')}`);
  console.log(`Using default category: "${DEFAULT_CATEGORY}"`);
  category = DEFAULT_CATEGORY;
}

// Create the task
try {
  // Load existing tasks
  const taskData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
  
  // Get Git info
  let username = 'Unknown';
  let branch = 'Unknown';
  try {
    username = execSync('git config --get user.name').toString().trim();
    branch = execSync('git branch --show-current').toString().trim();
  } catch (error) {
    // Git commands failed, use defaults
  }
  
  // Create new task
  const task = {
    id: taskData.lastId + 1,
    title,
    description: '',
    category,
    status: 'todo',
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    createdBy: username,
    branch,
    relatedFiles: files,
    comments: []
  };
  
  // Add task
  taskData.tasks.push(task);
  taskData.lastId = task.id;
  
  // Save tasks
  fs.writeFileSync(TASKS_PATH, JSON.stringify(taskData, null, 2));
  
  console.log(`✅ Created task #${task.id}: [${category}] ${title}`);
  
  if (files.length > 0) {
    console.log(`📎 Linked files: ${files.join(', ')}`);
  }
  
} catch (error) {
  console.error('❌ Error creating task:', error.message);
  process.exit(1);
}

// Helper function to get valid categories from config
function getValidCategories() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return config.taskCategories || ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore'];
  } catch (error) {
    return ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore'];
  }
} 