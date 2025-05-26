/**
 * TaskTracker Formatting Utilities
 * 
 * Handles terminal output formatting, colors, and display helpers
 */

const chalk = require('chalk');

// Handle potential chalk compatibility issues
let chalkEnabled = true;
let terminalSupportsColor = true;

// Check if NO_COLOR environment variable is set - respect color suppression standards
if (process.env.NO_COLOR !== undefined || process.env.FORCE_COLOR === '0') {
  terminalSupportsColor = false;
}

try {
  // Test chalk functionality
  chalk.green('test');
} catch (error) {
  chalkEnabled = false;
  console.error('Formatting Warning: Advanced terminal formatting disabled due to compatibility issues.');
}

// Create a more robust chalk-like fallback object 
const reliableChalk = {
  // Base colors
  red: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.red(text) : `\x1b[31m${text}\x1b[0m`;
  },
  green: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.green(text) : `\x1b[32m${text}\x1b[0m`;
  },
  yellow: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.yellow(text) : `\x1b[33m${text}\x1b[0m`;
  },
  blue: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.blue(text) : `\x1b[34m${text}\x1b[0m`;
  },
  magenta: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.magenta(text) : `\x1b[35m${text}\x1b[0m`;
  },
  cyan: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.cyan(text) : `\x1b[36m${text}\x1b[0m`;
  },
  white: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.white(text) : `\x1b[37m${text}\x1b[0m`;
  },
  gray: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.gray(text) : `\x1b[90m${text}\x1b[0m`;
  },
  grey: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.grey(text) : `\x1b[90m${text}\x1b[0m`;
  },
  dim: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.dim(text) : `\x1b[2m${text}\x1b[0m`;
  },
  bold: text => {
    if (!terminalSupportsColor) return text;
    return chalkEnabled ? chalk.bold(text) : `\x1b[1m${text}\x1b[0m`;
  },
  // Compound styles
  bgRed: {
    white: text => {
      if (!terminalSupportsColor) return text;
      return chalkEnabled ? chalk.bgRed.white(text) : `\x1b[41m\x1b[37m${text}\x1b[0m`;
    }
  }
};

/**
 * Centralized output function. Handles JSON, silent, plain, minimal modes.
 * Routes output to stdout or stderr appropriately.
 * @param {string|object|Error} message Message to output or an Error object.
 * @param {string} type Type: 'info', 'error', 'success', 'warning', 'data', 'debug'.
 * @param {object} [options={}] Additional options { globalOptions: object, errorCode: string, metadata: object }.
 */
function output(message, type = 'info', options = {}) {
    const globalOptions = options.globalOptions || {};
    const isJsonMode = !!globalOptions.json; // Ensure boolean

    // --- JSON Output Mode ---
    if (isJsonMode) {
        let jsonPayload;
        let successStatus = true;
        let dataContent = null;
        let errorContent = null;
        let messageContent = null;

        try {
            if (type === 'error') {
                successStatus = false;
                // Handle Error objects specifically
                if (message instanceof Error) {
                    errorContent = message.message;
                    // Optionally add stack trace to metadata in debug mode?
                    // if (globalOptions.debug && message.stack) {
                    //     options.metadata = { ...(options.metadata || {}), stack: message.stack };
                    // }
                } else {
                    errorContent = typeof message === 'string' ? message : JSON.stringify(message);
                }
                options.metadata = { ...(options.metadata || {}), errorCode: options.errorCode || 'ERROR' };
            } else if (type === 'data') {
                 // If 'message' looks like our standard structure, pass it through
                 if (message && typeof message === 'object' && 'success' in message && ('data' in message || 'error' in message)) {
                     jsonPayload = message; // Use as-is
                 } else {
                    dataContent = message; // Assume message is the data payload
                 }
            } else {
                // For info, success, warning, debug -> use message field
                messageContent = (typeof message === 'object' ? JSON.stringify(message) : message);
                options.metadata = { ...(options.metadata || {}), messageType: type };
            }

             // Only construct the standard payload if not already set (e.g., by passthrough 'data')
            if (!jsonPayload) {
                let dataPayload = null;
                if (dataContent !== null) {
                    // If type is 'data' and content is a string, try parsing it as JSON
                    if (type === 'data' && typeof dataContent === 'string') {
                        try {
                            dataPayload = JSON.parse(dataContent);
                        } catch (parseError) {
                            // If parsing fails, treat it as a plain string
                            dataPayload = dataContent;
                        }
                    } else {
                        // Otherwise, use the content as is (could be object, string, etc.)
                        dataPayload = dataContent;
                    }
                }
                                    
                jsonPayload = {
                    success: successStatus,
                    ...(dataPayload !== null && { data: dataPayload }), // Use potentially parsed/original dataPayload
                    ...(errorContent !== null && { error: errorContent }),
                    ...(messageContent !== null && { message: messageContent }),
                    metadata: {
                        ...(options.metadata || {}),
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // Output the final JSON string ONLY to stdout
            // Ensure the payload itself is stringified, not potentially stringified data within it.
            process.stdout.write(JSON.stringify(jsonPayload, null, 2) + '\n');

        } catch (err) {
            // If JSON generation fails, output a standard error JSON to stdout
            const errorPayload = {
                success: false,
                error: `Internal Error: Failed to generate JSON output. ${err.message}`,
                data: null,
                 metadata: { timestamp: new Date().toISOString(), errorCode: 'JSON_GENERATION_ERROR' }
            };
             process.stdout.write(JSON.stringify(errorPayload, null, 2) + '\n');
        }
        return; // Exit function after handling JSON output
    }

    // --- Non-JSON Output Modes ---

    // Handle Silent Mode (suppress non-errors)
    if (globalOptions.silent && type !== 'error') {
        return;
    }

    // Handle Debug Mode (only output if debug flag is set)
    if (type === 'debug' && !globalOptions.debug) {
        return;
    }


    let outputMessage = message;
    let targetStream = process.stdout; // Default to stdout

    // Prepare message based on type
    if (type === 'error') {
        targetStream = process.stderr; // Errors go to stderr
        if (outputMessage instanceof Error) {
             // Include stack trace in debug mode for non-JSON output
            outputMessage = globalOptions.debug && outputMessage.stack ? outputMessage.stack : outputMessage.message;
        }
        outputMessage = `❌ ${outputMessage}`; // Add emoji prefix
        outputMessage = globalOptions.plain ? outputMessage : reliableChalk.red(outputMessage);
    } else if (type === 'warning') {
        targetStream = process.stderr; // Warnings also go to stderr
        outputMessage = `⚠️ ${outputMessage}`;
        outputMessage = globalOptions.plain ? outputMessage : reliableChalk.yellow(outputMessage);
    } else if (type === 'success') {
        outputMessage = `✅ ${outputMessage}`;
        outputMessage = globalOptions.plain ? outputMessage : reliableChalk.green(outputMessage);
    } else if (type === 'info') {
         outputMessage = `ℹ️ ${outputMessage}`;
        // Default color or dim?
        // outputMessage = globalOptions.plain ? outputMessage : reliableChalk.dim(outputMessage);
    } else if (type === 'debug') {
         outputMessage = `🔧 DEBUG: ${outputMessage}`;
         outputMessage = globalOptions.plain ? outputMessage : reliableChalk.gray(outputMessage);
    }
    // No special prefix for 'data' type in non-JSON mode - assume pre-formatted or string


    // Apply minimal formatting if enabled (and not plain)
    if (globalOptions.minimal && !globalOptions.plain && typeof outputMessage === 'string') {
        // Basic simplification (remove emojis, maybe simplify complex formatting)
        // Remove problematic regex with combined characters and handle each emoji separately
        outputMessage = outputMessage.replace(/^(❌|⚠️|✅|ℹ️|🔧)\s*/u, '').trim(); // Remove leading emoji
        // Could add more simplifications here if needed
    }

    // Final output (convert objects to JSON string if not already string)
    if (typeof outputMessage !== 'string') {
        try {
            outputMessage = JSON.stringify(outputMessage, null, 2);
        } catch (stringifyError) {
             targetStream = process.stderr; // Output error to stderr
             outputMessage = `❌ Internal Formatting Error: Could not stringify object. ${stringifyError.message}`;
             outputMessage = globalOptions.plain ? outputMessage : reliableChalk.red(outputMessage);
        }
    }

    // Write to the determined stream
    targetStream.write(outputMessage + '\n');
}

/**
 * Get terminal dimensions, or use defaults if not available
 * @returns {object} Width and height of terminal
 */
function getTerminalDimensions() {
  try {
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    return { width: cols, height: rows };
  } catch (error) {
    return { width: 80, height: 24 };
  }
}

/**
 * Colorize output based on task status and category
 * @param {string} text Text to colorize 
 * @param {string} status Task status
 * @param {string} category Task category
 * @returns {string} Colorized text
 */
function colorize(text, status, category) {
  if (!text) return '';
  
  // Check if chalk is available
  if (!terminalSupportsColor) {
    return text;
  }
  
  // Determine color based on status
  if (status) {
    switch (status.toLowerCase()) {
      case 'todo':
        return reliableChalk.blue(text);
      case 'in-progress':
      case 'in progress':
      case 'inprogress':
        return reliableChalk.yellow(text);
      case 'review':
        return reliableChalk.magenta(text);
      case 'done':
        return reliableChalk.green(text);
      case 'blocked':
        return reliableChalk.red(text);
      case 'archived':
        return reliableChalk.gray(text);
    }
  }
  
  // Fallback to category-based coloring
  if (category) {
    switch (category.toLowerCase()) {
      case 'feature':
        return reliableChalk.blue(text);
      case 'bugfix':
        return reliableChalk.red(text);
      case 'docs':
        return reliableChalk.cyan(text);
      case 'test':
        return reliableChalk.magenta(text);
      case 'chore':
        return reliableChalk.gray(text);
    }
  }
  
  // Default
  return text;
}

/**
 * Format category with colors
 */
function formatCategory(category, _isCompactMode = false) {
  if (!category) return '';
  
  // Get different colors for different category types
  let formattedCategory;
  switch(category.toLowerCase()) {
    case 'feature':
      formattedCategory = reliableChalk.green(`[${category}]`);
      break;
    case 'bugfix':
    case 'bug':
      formattedCategory = reliableChalk.red(`[${category}]`);
      break;
    case 'refactor':
      formattedCategory = reliableChalk.blue(`[${category}]`);
      break;
    case 'docs':
      formattedCategory = reliableChalk.cyan(`[${category}]`);
      break;
    case 'test':
      formattedCategory = reliableChalk.magenta(`[${category}]`);
      break;
    case 'chore':
      formattedCategory = reliableChalk.gray(`[${category}]`);
      break;
    default:
      formattedCategory = reliableChalk.yellow(`[${category}]`);
  }
  
  return formattedCategory;
}

/**
 * Get an emoji for a given status
 * @param {string} status Task status
 * @returns {string} Emoji representation of the status
 */
function getStatusEmoji(status) {
  if (!status) return '❓';
  
  switch (status.toLowerCase()) {
    case 'todo':
      return '📋';
    case 'in-progress':
    case 'in progress':
    case 'inprogress':
      return '🔄';
    case 'review':
      return '👀';
    case 'done':
      return '✅';
    case 'blocked':
      return '🚫';
    case 'archived':
      return '📦';
    default:
      return '❓';
  }
}

/**
 * Get a formatted label for a priority
 * @param {string} priority Task priority
 * @returns {string} Formatted label
 */
function getPriorityLabel(priority) {
  if (!priority) return 'None';
  
  switch (priority.toLowerCase()) {
    case 'p0-critical':
      return '🔴 P0-Critical';
    case 'p1-high':
      return '🟠 P1-High';
    case 'p2-medium':
      return '🟡 P2-Medium';
    case 'p3-low':
      return '🟢 P3-Low';
    default:
      return priority;
  }
}

/**
 * Wrap text to a specified width
 * @param {string} text Text to wrap 
 * @param {number} width Width to wrap to
 * @returns {string[]} Array of wrapped lines
 */
function wrapText(text, width) {
  if (!text) return ['None'];
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine.length === 0 ? '' : ' ') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : ['None'];
}



module.exports = {
  reliableChalk,
  output,
  getTerminalDimensions,
  colorize,
  formatCategory,
  getStatusEmoji,
  getPriorityLabel,
  wrapText
}; 