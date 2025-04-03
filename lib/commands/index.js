/**
 * TaskTracker Command Registry
 * 
 * Central registry of all available commands
 * This makes it easy to add new commands without modifying the main script
 */

// Import command handlers as they're developed
const list = require('./list');
const view = require('./view');
const init = require('./init');
const update = require('./update');
const add = require('./add');
const quick = require('./quick');
const stats = require('./stats');
const changes = require('./changes');
const help = require('./help');
const updateConfig = require('./update-config');
const verify = require('./verify');
const ignore = require('./ignore');
const cleanup = require('./cleanup');
const context = require('./context');
const link = require('./link');
const batch = require('./batch');

// Import archive functionality
const archiveManager = require('../core/archive-manager');

/**
 * Command registry with metadata
 * Each command has:
 * - description: Short description shown in help
 * - handler: Function that implements the command
 * - alias: (Optional) Points to another command
 * - standalone: (Optional) Indicates this command needs special handling
 */
const commands = {
  // Core task management
  'init': { 
    description: 'Initialize TaskTracker in the current directory',
    handler: init.initializeTaskTracker
  },
  'add': { 
    description: 'Add a new task (interactive)',
    handler: add.addTaskInteractive
  },
  'quick': { 
    description: 'Quickly add a task (non-interactive)',
    handler: quick.quickAddTask
  },
  'update': { 
    description: 'Update an existing task',
    handler: update.updateTask
  },
  'list': { 
    description: 'List all tasks',
    handler: list.listTasks
  },
  'view': { 
    description: 'View details of a specific task',
    handler: view.viewTask
  },
  'archive': { 
    description: 'Archive a task',
    handler: archiveManager.archiveTask
  },
  'restore': { 
    description: 'Restore a task from archives',
    handler: archiveManager.restoreTask
  },
  'archives': { 
    description: 'List archived tasks',
    handler: archiveManager.listArchivedTasks
  },
  'cleanup': {
    description: 'Clean up task data for consistent formatting',
    handler: cleanup.cleanupTasks
  },
  'changes': { 
    description: 'Track file changes',
    handler: changes.trackChanges
  },
  'stats': { 
    description: 'Show task statistics',
    handler: stats.showTaskStats
  },
  'update-config': { 
    description: 'Update configuration settings',
    handler: updateConfig.updateConfig
  },
  'verify': { 
    description: 'Verify TaskTracker installation and configuration',
    handler: verify.verifyInstallation
  },
  'ignore': { 
    description: 'Manage ignore patterns (.taskignore)',
    handler: ignore.manageIgnorePatterns
  },
  'context': {
    description: 'Generate AI context from tasks and files',
    handler: context.generateContext
  },
  'link': {
    description: 'Link a file to a task (auto-detects current file)',
    handler: link.linkFileToTask
  },
  'unlink': {
    description: 'Unlink a file from a task',
    handler: link.unlinkFileFromTask
  },
  'files-for-task': {
    description: 'List files linked to a task',
    handler: link.listLinkedFiles
  },
  'batch': {
    description: 'Process multiple task operations in a single command',
    handler: batch
  },
  
  // Aliases for convenient shortcuts
  'status': { 
    description: 'Alias for list - show task status',
    alias: 'list'
  },
  'ls': {
    description: 'Alias for list - show tasks',
    alias: 'list'
  },
  'files': {
    description: 'Alias for changes - track file changes',
    alias: 'changes'
  },
  'config': {
    description: 'Alias for update-config - manage configuration',
    alias: 'update-config'
  },
  'check': {
    description: 'Alias for verify - check installation',
    alias: 'verify'
  },
  'ai': {
    description: 'Alias for context - generate AI context',
    alias: 'context'
  },
  'attach': {
    description: 'Alias for link - link current file to a task',
    alias: 'link'
  },
  'detach': {
    description: 'Alias for unlink - unlink current file from a task',
    alias: 'unlink'
  },
  'bulk': {
    description: 'Alias for batch - process multiple operations',
    alias: 'batch'
  },
  
  // Help command
  'help': { 
    description: 'Show help information',
    handler: help.showHelp
  }
};

/**
 * Get a command handler by name
 * @param {string} commandName Name of the command
 * @returns {function|null} Command handler or null if not found
 */
function getCommand(commandName) {
  if (!commandName) return null;
  
  const command = commands[commandName];
  if (!command) return null;
  
  // If this is an alias, get the actual command
  if (command.alias) {
    return getCommand(command.alias);
  }
  
  return command.handler;
}

/**
 * Initialize all command modules with paths
 * @param {string} rootDir Application root directory
 */
function initCommandPaths(rootDir) {
  // Initialize paths for each command module that has an init function
  if (list.initPaths) {
    list.initPaths(rootDir);
  }
  
  if (view.initPaths) {
    view.initPaths(rootDir);
  }
  
  if (init.initPaths) {
    init.initPaths(rootDir);
  }
  
  if (stats.initPaths) {
    stats.initPaths(rootDir);
  }
  
  if (changes.initPaths) {
    changes.initPaths(rootDir);
  }
  
  if (verify.initPaths) {
    verify.initPaths(rootDir);
  }
  
  if (ignore.initPaths) {
    ignore.initPaths(rootDir);
  }
  
  if (cleanup.initPaths) {
    cleanup.initPaths(rootDir);
  }
  
  if (context.initPaths) {
    context.initPaths(rootDir);
  }
  
  if (link.initPaths) {
    link.initPaths(rootDir);
  }
  
  // Initialize core modules
  archiveManager.initPaths(rootDir);
}

module.exports = {
  commands,
  getCommand,
  initCommandPaths
}; 