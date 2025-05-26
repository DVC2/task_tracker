/**
 * TaskTracker Context Command (Legacy)
 * 
 * Simplified legacy command - use context-quick or context-full instead
 */

const { output } = require('../core/formatting');

/**
 * Initialize paths required by the context command
 * @param {string} rootDir The application root directory
 */
function initPaths(_rootDir) {
  // Legacy command - no initialization needed
}

/**
 * Generate context (legacy command)
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function generateContext(args, options = {}) {
  output('🤖 TaskTracker 3.0: Use context-quick or context-full', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  output('This is a legacy command. For AI context generation:', 'info', { globalOptions: options });
  output('  tt context-quick    # Quick context for immediate AI help', 'info', { globalOptions: options });
  output('  tt context-full     # Comprehensive development context', 'info', { globalOptions: options });
  output('  tt c                # Alias for context-quick', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  output('The new commands provide better context from journal entries and PRD.', 'info', { globalOptions: options });
  
  return { success: true };
}

module.exports = {
  initPaths,
  generateContext
}; 