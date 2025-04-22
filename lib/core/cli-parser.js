/**
 * TaskTracker CLI Parser
 * 
 * Handles command line argument parsing for TaskTracker
 */

const { output } = require('./formatting');
const cliSecurity = require('../utils/cli-security');

/**
 * Parse command line arguments
 * @param {string[]} args Command line arguments to parse
 * @param {object} parserOptions Options for parsing
 * @returns {object} Parsed arguments and options
 */
function parseArgs(args = [], parserOptions = {}) {
  // First sanitize and validate all arguments
  const { valid, sanitizedArgs, validationIssues } = cliSecurity.sanitizeArgs(args, {
    skipCommandValidation: parserOptions.skipCommandValidation || false
  });
  
  // If there are validation issues, log them as warnings
  if (!valid) {
    validationIssues.forEach(issue => {
      output(`⚠️ ${issue}`, 'warning');
    });
  }
  
  // Use the sanitized args for parsing
  const safeArgs = sanitizedArgs;
  const commandArgs = [];
  const options = {
    silent: false,
    json: false,
    nonInteractive: false,
    plain: false
  };
  
  // Process all arguments
  for (let i = 0; i < safeArgs.length; i++) {
    const arg = safeArgs[i];
    
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
          const cleanName = optName.replace(/^--/, '');
          options[cleanName] = optValue;
        } else if (i + 1 < safeArgs.length && !safeArgs[i + 1].startsWith('-')) {
          // Handle --option value format
          const cleanName = arg.replace(/^--/, '');
          options[cleanName] = safeArgs[i + 1];
          i++; // Skip next argument as it's the value
        } else {
          // Handle flag options (--flag)
          const cleanName = arg.replace(/^--/, '');
          options[cleanName] = true;
        }
      }
    } else {
      // Non-option arguments are command arguments
      commandArgs.push(arg);
    }
  }
  
  return { commandArgs, options, validationIssues, valid };
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
  
  // Validate and sanitize the formatted args
  const { sanitizedArgs } = cliSecurity.sanitizeArgs(args);
  return sanitizedArgs;
}

module.exports = {
  parseArgs,
  formatArgs
}; 