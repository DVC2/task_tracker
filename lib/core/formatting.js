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
  console.warn('⚠️ Advanced terminal formatting disabled due to compatibility issues.');
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
 * Output function with minimal mode support
 * @param {string|object} message Message to output
 * @param {string} type Type of message (info, error, success, warning, data)
 * @param {object} options Additional options
 */
function output(message, type = 'info', options = {}) {
  const globalOptions = options.globalOptions || {};
  
  // In silent mode, only output errors and data
  if (globalOptions.silent && type !== 'error' && type !== 'data') {
    return;
  }
  
  // In minimal mode, use compact output (except for errors and data)
  if (globalOptions.minimal && type !== 'error' && type !== 'data') {
    // Simplify formatted output
    if (typeof message === 'string') {
      // Remove emoji and decorative chars for minimal output
      message = message
        .replace(/^[^a-zA-Z0-9]*/, '')  // Remove leading non-alphanumeric (emojis, etc)
        .replace(/─+/g, '-')            // Replace fancy separator with simple dash
        .replace(/[│├┤┌┐└┘┬┴┼]/g, '|')  // Replace box drawing chars with pipe
        .replace(/^\s+|\s+$/g, '')      // Trim whitespace
        .replace(/\n+/g, '\n');         // Remove multiple blank lines
    }
  }
  
  // Handle data output (usually for --json mode)
  if (type === 'data') {
    if (options.field && typeof options.field === 'string') {
      // If a specific field is requested, output just that field as JSON
      const dataObj = { [options.field]: message };
      console.log(JSON.stringify(dataObj, null, 2));
    } else {
      // Otherwise output the entire message as JSON
      console.log(JSON.stringify(message, null, 2));
    }
    return;
  }
  
  // For normal output, print the message
  if (typeof message === 'string') {
    console.log(message);
  } else {
    console.log(JSON.stringify(message, null, 2));
  }
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
function formatCategory(category, isCompactMode = false) {
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