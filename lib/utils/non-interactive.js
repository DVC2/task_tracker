/**
 * TaskTracker Non-Interactive Mode Utilities
 * 
 * Provides utilities for running commands in non-interactive mode,
 * which is especially useful for AI agent integration.
 */

const { output } = require('../core/formatting');

/**
 * Execute a function with appropriate handling for non-interactive mode
 * @param {Function} action Function to execute
 * @param {object} options Options object with nonInteractive flag
 * @param {object} defaults Default values to use in non-interactive mode
 * @returns {any} Result of the function
 */
function executeNonInteractive(action, options = {}, defaults = {}) {
  const isNonInteractive = options.nonInteractive || options.json;
  
  try {
    if (isNonInteractive) {
      // Use default values instead of prompting
      return action(defaults);
    } else {
      // Run normally
      return action();
    }
  } catch (error) {
    if (options.json) {
      // In JSON mode, format errors as structured data
      output(error, 'error', { globalOptions: options });
      process.exit(1);
    } else {
      throw error; // Re-throw for normal error handling
    }
  }
}

/**
 * Handle confirmation in a way that respects non-interactive mode
 * @param {string} message Confirmation message
 * @param {object} options Options object
 * @param {boolean} defaultAnswer Default answer to use in non-interactive mode
 * @returns {Promise<boolean>} Promise resolving to the user's answer
 */
async function confirm(message, options = {}, defaultAnswer = false) {
  // In non-interactive mode, use the default answer
  if (options.nonInteractive || options.json) {
    if (options.verbose && !options.silent) {
      output(`Non-interactive mode: Using default answer (${defaultAnswer ? 'yes' : 'no'}) for confirmation: ${message}`, 'info', { globalOptions: options });
    }
    return defaultAnswer;
  }
  
  // Otherwise, prompt the user normally
  const readline = require('readline-sync');
  const formattedMessage = `${message} (y/n) `;
  const answer = readline.question(formattedMessage).toLowerCase();
  return answer === 'y' || answer === 'yes';
}

/**
 * Select an option non-interactively
 * @param {string} message Selection message
 * @param {string[]} choices Available choices
 * @param {object} options Options object
 * @param {number|string} defaultChoice Default choice index or value
 * @returns {string} Selected option
 */
function select(message, choices, options = {}, defaultChoice = 0) {
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('No choices provided for selection');
  }
  
  // In non-interactive mode, use the default choice
  if (options.nonInteractive || options.json) {
    let selectedChoice;
    
    if (typeof defaultChoice === 'number') {
      // If default is an index, use that
      const index = Math.min(Math.max(0, defaultChoice), choices.length - 1);
      selectedChoice = choices[index];
    } else if (typeof defaultChoice === 'string') {
      // If default is a value, find it in choices
      selectedChoice = choices.find(c => c === defaultChoice) || choices[0];
    } else {
      // Fallback to first choice
      selectedChoice = choices[0];
    }
    
    if (options.verbose && !options.silent) {
      output(`Non-interactive mode: Using default choice "${selectedChoice}" for: ${message}`, 'info', { globalOptions: options });
    }
    
    return selectedChoice;
  }
  
  // Otherwise, prompt the user normally
  const readline = require('readline-sync');
  const index = readline.keyInSelect(choices, message, { cancel: false });
  return choices[index];
}

/**
 * Get user input non-interactively
 * @param {string} message Prompt message
 * @param {object} options Options object
 * @param {string} defaultValue Default value to use in non-interactive mode
 * @returns {string} User input or default value
 */
function input(message, options = {}, defaultValue = '') {
  // In non-interactive mode, use the default value
  if (options.nonInteractive || options.json) {
    if (options.verbose && !options.silent) {
      output(`Non-interactive mode: Using default value "${defaultValue}" for: ${message}`, 'info', { globalOptions: options });
    }
    return defaultValue;
  }
  
  // Otherwise, prompt the user normally
  const readline = require('readline-sync');
  return readline.question(`${message}: `);
}

/**
 * Handle batch operations in a consistent way
 * @param {Array} items Items to process
 * @param {Function} processor Function to process each item
 * @param {object} options Options object
 * @returns {Array} Array of results
 */
async function processBatch(items, processor, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  
  const results = [];
  const errors = [];
  
  // Process each item
  for (const item of items) {
    try {
      const result = await processor(item, options);
      results.push(result);
    } catch (error) {
      errors.push({ item, error: error.message });
      if (!options.continueOnError) {
        break;
      }
    }
  }
  
  // Return the results with metadata
  return {
    success: errors.length === 0,
    data: results,
    errors: errors.length > 0 ? errors : null,
    metadata: {
      total: items.length,
      processed: results.length,
      failed: errors.length,
      timestamp: new Date().toISOString()
    }
  };
}

module.exports = {
  executeNonInteractive,
  confirm,
  select,
  input,
  processBatch
}; 