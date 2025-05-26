/**
 * TaskTracker List Command (Legacy)
 * 
 * Simplified legacy command - use journal-show instead
 */

const { output } = require('../core/formatting');

/**
 * Initialize paths required by the list command
 * @param {string} rootDir The application root directory
 */
function initPaths(_rootDir) {
  // Legacy command - no initialization needed
}

/**
 * List tasks (legacy command)
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function listTasks(args, options = {}) {
  output('📝 TaskTracker 3.0: Use journal-show instead', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  output('This is a legacy command. For context journal:', 'info', { globalOptions: options });
  output('  tt journal-show     # Show recent journal entries', 'info', { globalOptions: options });
  output('  tt context-quick    # Generate AI context', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  output('To see your development progress:', 'info', { globalOptions: options });
  output('  tt journal-show', 'info', { globalOptions: options });
  
  return { success: true };
}

module.exports = {
  initPaths,
  listTasks
}; 