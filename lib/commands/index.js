/**
 * Command Module Index
 * 
 * Central registry for all TaskTracker commands.
 * This module initializes paths, registers commands, and provides command management.
 */

const fs = require('fs');
const path = require('path');

// Import all command modules
const journalCommands = require('./journal');
const contextCommands = require('./context-v2');
const prdCommands = require('./prd');
const statsCommands = require('./stats');
const initCommands = require('./init');
const helpCommands = require('./help');
const listCommands = require('./list');
const quickCommands = require('./quick');
const demoCommands = require('./demo');
const gitCommands = require('./git');

// Import command registry
const commandRegistry = require('../core/command-registry');

// Store the application root path
let appRootPath = null;

/**
 * Create an alias command with preset options
 * @param {string} targetCommand The base command to call
 * @param {object} presetOptions Options to merge with user input
 */
function createAliasCommand(targetCommand, presetOptions) {
  return function(args, options = {}) {
    // Merge preset options with user options
    const mergedOptions = { ...presetOptions, ...options };
    
    // Get the actual command handler
    const handler = commandRegistry.getCommand(targetCommand);
    if (!handler) {
      throw new Error(`Target command '${targetCommand}' not found`);
    }
    
    // Call the target command with merged options
    return handler(args, mergedOptions);
  };
}

/**
 * Initialize command paths for all modules
 * @param {string} rootDir The application root directory
 */
function initCommandPaths(rootDir) {
  appRootPath = rootDir;
  
  // Initialize paths for all command modules that have initPaths
  journalCommands.initPaths(rootDir);
  contextCommands.initPaths(rootDir);
  prdCommands.initPaths(rootDir);
  initCommands.initPaths(rootDir);
  helpCommands.initPaths(rootDir);
  listCommands.initPaths(rootDir);
  quickCommands.initPaths(rootDir);
  demoCommands.initPaths(rootDir);
  gitCommands.initPaths(rootDir);
  // Note: stats module doesn't need path initialization
}

/**
 * Register all commands with the central registry
 */
function registerAllCommands() {
  // Register journal commands with aliases
  commandRegistry.registerCommand('journal', journalCommands.addEntry);
  commandRegistry.registerCommand('j', journalCommands.addEntry); // Alias
  commandRegistry.registerCommand('journal-show', journalCommands.showEntries);
  commandRegistry.registerCommand('js', journalCommands.showEntries); // Alias
  commandRegistry.registerCommand('journal-search', journalCommands.searchEntries);
  commandRegistry.registerCommand('journal-export', journalCommands.exportEntries);

  // Register context commands with aliases
  commandRegistry.registerCommand('context-quick', contextCommands.quickContext);
  commandRegistry.registerCommand('c', contextCommands.quickContext); // Alias
  commandRegistry.registerCommand('context-full', contextCommands.generateFullContext);
  commandRegistry.registerCommand('cf', contextCommands.generateFullContext); // Alias

  // Register PRD commands
  commandRegistry.registerCommand('prd', prdCommands.parsePRD);
  commandRegistry.registerCommand('prd-show', prdCommands.showPRD);
  commandRegistry.registerCommand('prd-context', prdCommands.generatePRDContext);

  // Register utility commands
  commandRegistry.registerCommand('stats', statsCommands.showStats);
  commandRegistry.registerCommand('init', initCommands.initializeTaskTracker);
  commandRegistry.registerCommand('list', listCommands.listProjects);
  commandRegistry.registerCommand('quick', quickCommands.addQuickTask);
  
  // Register demo commands
  commandRegistry.registerCommand('demo', demoCommands.showDemo);
  commandRegistry.registerCommand('quickstart', demoCommands.createQuickstart);

  // Register helpful productivity aliases
  commandRegistry.registerCommand('done', createAliasCommand('j', { type: 'progress' }));
  commandRegistry.registerCommand('decided', createAliasCommand('j', { type: 'decision' }));
  commandRegistry.registerCommand('blocked', createAliasCommand('j', { type: 'blocker' }));
  commandRegistry.registerCommand('til', createAliasCommand('j', { type: 'learning' }));

  // Register git integration commands
  commandRegistry.registerCommand('git-install-hook', gitCommands.installHook);
  commandRegistry.registerCommand('git-sync', gitCommands.syncCommits);
  commandRegistry.registerCommand('git-auto', gitCommands.toggleAuto);
  commandRegistry.registerCommand('git-status', gitCommands.showStatus);

  // Note: Help command is handled specially in the main CLI
}



module.exports = {
  initCommandPaths,
  registerAllCommands
};