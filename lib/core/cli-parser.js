/**
 * TaskTracker CLI Parser
 * 
 * Handles command line argument parsing for TaskTracker
 */

/**
 * Parse command line arguments
 * @param {string[]} args Command line arguments to parse
 * @returns {object} Parsed arguments and options
 */
function parseArgs(args = []) {
  const commandArgs = [];
  const options = {
    silent: false,
    json: false,
    nonInteractive: false,
    plain: false
  };
  
  // Process all arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle options
    if (arg.startsWith('-')) {
      if (arg === '--silent' || arg === '-s') {
        options.silent = true;
      } else if (arg === '--json' || arg === '-j') {
        options.json = true;
      } else if (arg === '--non-interactive' || arg === '--ni') {
        options.nonInteractive = true;
      } else if (arg === '--plain' || arg === '-p') {
        options.plain = true;
      } else if (arg === '--help' || arg === '-h') {
        // Help is handled separately by the command handler
      } else {
        // Handle options with values (--option value)
        if (arg.includes('=')) {
          // Handle --option=value format
          const [optName, optValue] = arg.split('=', 2);
          options[optName.replace(/^--/, '')] = optValue;
        } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          // Handle --option value format
          options[arg.replace(/^--/, '')] = args[i + 1];
          i++; // Skip next argument as it's the value
        } else {
          // Handle flag options (--flag)
          options[arg.replace(/^--/, '')] = true;
        }
      }
    } else {
      // Non-option arguments are command arguments
      commandArgs.push(arg);
    }
  }
  
  return { commandArgs, options };
}

/**
 * Format arguments for command execution
 * @param {object} options Global options object
 * @returns {string[]} Array of formatted arguments
 */
function formatArgs(options = {}) {
  const args = [];
  
  if (options.silent) {
    args.push('--silent');
  }
  
  if (options.json) {
    args.push('--json');
  }
  
  if (options.nonInteractive) {
    args.push('--non-interactive');
  }
  
  if (options.plain) {
    args.push('--plain');
  }
  
  // Add other options
  Object.entries(options).forEach(([key, value]) => {
    if (!['silent', 'json', 'nonInteractive', 'plain'].includes(key) && value !== false) {
      if (value === true) {
        args.push(`--${key}`);
      } else {
        args.push(`--${key}`, value.toString());
      }
    }
  });
  
  return args;
}

module.exports = {
  parseArgs,
  formatArgs
}; 