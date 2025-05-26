/**
 * TaskTracker Command Registry
 * 
 * Simplified registry for context journal commands only
 */

// Import only the essential commands
const list = require('./list');
const init = require('./init');
const quick = require('./quick');
const help = require('./help');
const context = require('./context');
const stats = require('./stats');
const journal = require('./journal');
const prd = require('./prd');
const contextV2 = require('./context-v2');

// Import the command registry
const commandRegistry = require('../core/command-registry');

/**
 * Register essential commands only
 */
function registerAllCommands() {
  // Core context journal commands
  commandRegistry.registerCommands({
    'init': { 
      description: 'Initialize TaskTracker in the current directory',
      handler: init.initializeTaskTracker
    },
    'journal': {
      description: 'Add development journal entry for context tracking',
      handler: journal.addEntry
    },
    'journal-show': {
      description: 'Show recent journal entries',
      handler: journal.showEntries
    },
    'journal-search': {
      description: 'Search journal entries by content, tags, or type',
      handler: journal.searchEntries
    },
    'journal-export': {
      description: 'Export journal entries to markdown or JSON',
      handler: journal.exportEntries
    },
    'prd': {
      description: 'Parse and store Product Requirements Document',
      handler: prd.parsePRD
    },
    'prd-show': {
      description: 'Show current PRD summary',
      handler: prd.showPRD
    },
    'prd-context': {
      description: 'Generate context from PRD for AI assistants',
      handler: prd.generatePRDContext
    },
    'context-quick': {
      description: 'Generate quick context for immediate AI assistance',
      handler: contextV2.quickContext
    },
    'context-full': {
      description: 'Generate comprehensive development context',
      handler: contextV2.generateFullContext
    },
    
    // Legacy commands (minimal support)
    'quick': { 
      description: 'Quickly add a task (legacy)',
      handler: quick.quickAddTask
    },
    'list': { 
      description: 'List tasks (legacy)',
      handler: list.listTasks
    },
    'stats': {
      description: 'Show project statistics',
      handler: stats.showStats
    },
    'context': {
      description: 'Generate context (legacy)',
      handler: context.generateContext
    },
    
    // Help
    'help': { 
      description: 'Show help information',
      handler: help.showHelp
    }
  });
  
  // Simple aliases
  commandRegistry.registerCommands({
    'j': {
      description: 'Alias for journal',
      alias: 'journal'
    },
    'js': {
      description: 'Alias for journal-show',
      alias: 'journal-show'
    },
    'c': {
      description: 'Alias for context-quick',
      alias: 'context-quick'
    },
    'cf': {
      description: 'Alias for context-full',
      alias: 'context-full'
    },
    'ls': {
      description: 'Alias for list',
      alias: 'list'
    }
  });
}

/**
 * Initialize command modules with paths
 * @param {string} rootDir Application root directory
 */
function initCommandPaths(rootDir) {
  // Only initialize essential modules
  const modules = [
    list, init, quick, help, context, stats, journal, prd, contextV2
  ];
  
  modules.forEach(module => {
    if (typeof module.initPaths === 'function') {
      module.initPaths(rootDir);
    }
  });
}

module.exports = {
  initCommandPaths,
  registerAllCommands
};