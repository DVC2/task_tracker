/**
 * TaskTracker Quick Command (Legacy)
 * 
 * Simplified legacy command - use journal instead
 */

const { output } = require('../core/formatting');

/**
 * Initialize paths required by the quick command
 * @param {string} rootDir The application root directory
 */
function initPaths(_rootDir) {
  // Legacy command - no initialization needed
}

/**
 * Quick add task (legacy command)
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function quickAddTask(args, options = {}) {
  const taskText = args.join(' ');
  
  if (taskText) {
    output('📝 TaskTracker 3.0: Use journal instead', 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    output('This is a legacy command. For context journal:', 'info', { globalOptions: options });
    output(`  tt journal "${taskText}"`, 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    output('Journal entries maintain context better than tasks.', 'info', { globalOptions: options });
  } else {
    output('📝 TaskTracker 3.0: Use journal for progress tracking', 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    output('Usage: tt journal "your progress update"', 'info', { globalOptions: options });
    output('Example: tt journal "Implemented user authentication"', 'info', { globalOptions: options });
  }
  
  return { success: true };
}

module.exports = {
  initPaths,
  quickAddTask
}; 