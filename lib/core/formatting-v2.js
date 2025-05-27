/**
 * TaskTracker Formatting Utilities V2
 * Optimized, lightweight formatting module
 */

const chalk = require('chalk');

// Respect NO_COLOR environment variable
const supportsColor = !process.env.NO_COLOR && process.env.FORCE_COLOR !== '0';
const useChalk = supportsColor && chalk.supportsColor;

// Simplified chalk wrapper - no fallbacks needed, chalk handles this
const colors = {
  red: text => useChalk ? chalk.red(text) : text,
  green: text => useChalk ? chalk.green(text) : text,
  yellow: text => useChalk ? chalk.yellow(text) : text,
  blue: text => useChalk ? chalk.blue(text) : text,
  magenta: text => useChalk ? chalk.magenta(text) : text,
  cyan: text => useChalk ? chalk.cyan(text) : text,
  gray: text => useChalk ? chalk.gray(text) : text,
  bold: text => useChalk ? chalk.bold(text) : text,
  dim: text => useChalk ? chalk.dim(text) : text,
};

// Type configurations
const typeConfig = {
  error: { prefix: '❌', color: 'red', stream: 'stderr' },
  warning: { prefix: '⚠️', color: 'yellow', stream: 'stderr' },
  success: { prefix: '✅', color: 'green', stream: 'stdout' },
  info: { prefix: 'ℹ️', color: null, stream: 'stdout' },
  debug: { prefix: '🔧', color: 'gray', stream: 'stdout' },
  data: { prefix: null, color: null, stream: 'stdout' }
};

/**
 * Unified output function
 * @param {string|object|Error} message Message to output
 * @param {string} type Output type
 * @param {object} options Additional options
 */
function output(message, type = 'info', options = {}) {
  const { globalOptions = {} } = options;
  
  // JSON mode
  if (globalOptions.json) {
    const payload = {
      success: type !== 'error',
      [type === 'error' ? 'error' : type === 'data' ? 'data' : 'message']: 
        message instanceof Error ? message.message : message,
      metadata: {
        timestamp: new Date().toISOString(),
        type,
        ...options.metadata
      }
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    return;
  }
  
  // Silent mode
  if (globalOptions.silent && type !== 'error') return;
  
  // Debug mode
  if (type === 'debug' && !globalOptions.debug) return;
  
  // Format message
  const config = typeConfig[type] || typeConfig.info;
  let output = message instanceof Error ? message.message : String(message);
  
  // Add prefix
  if (config.prefix && !globalOptions.minimal) {
    output = `${config.prefix} ${output}`;
  }
  
  // Add color
  if (config.color && !globalOptions.plain) {
    output = colors[config.color](output);
  }
  
  // Output to appropriate stream
  const stream = config.stream === 'stderr' ? process.stderr : process.stdout;
  stream.write(output + '\n');
}

// Status emoji map
const statusEmojis = {
  'todo': '📋',
  'in-progress': '🔄',
  'review': '👀',
  'done': '✅',
  'blocked': '🚫',
  'archived': '📦'
};

// Type emoji map  
const typeEmojis = {
  progress: '📈',
  decision: '🎯',
  blocker: '🚫',
  idea: '💡',
  context: '📝',
  bug: '🐛',
  feature: '✨'
};

/**
 * Get emoji for status
 */
function getStatusEmoji(status) {
  return statusEmojis[status?.toLowerCase()] || '❓';
}

/**
 * Get emoji for entry type
 */
function getTypeEmoji(type) {
  return typeEmojis[type] || '📝';
}

/**
 * Simple text wrapper
 */
function wrapText(text, width = 80) {
  if (!text || text.length <= width) return [text || 'None'];
  
  const words = text.split(' ');
  const lines = [];
  let line = '';
  
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  
  if (line) lines.push(line);
  return lines;
}

module.exports = {
  output,
  colors,
  getStatusEmoji,
  getTypeEmoji,
  wrapText,
  // Compatibility exports
  reliableChalk: colors,
  colorize: (text, status) => {
    const colorMap = {
      'todo': 'blue',
      'in-progress': 'yellow',
      'review': 'magenta',
      'done': 'green',
      'blocked': 'red',
      'archived': 'gray'
    };
    const color = colorMap[status?.toLowerCase()];
    return color ? colors[color](text) : text;
  },
  formatCategory: (category) => {
    const categoryColors = {
      'feature': 'green',
      'bugfix': 'red',
      'bug': 'red',
      'refactor': 'blue',
      'docs': 'cyan',
      'test': 'magenta',
      'chore': 'gray'
    };
    const color = categoryColors[category?.toLowerCase()] || 'yellow';
    return colors[color](`[${category}]`);
  },
  getPriorityLabel: (priority) => {
    const labels = {
      'p0-critical': '🔴 P0-Critical',
      'p1-high': '🟠 P1-High',
      'p2-medium': '🟡 P2-Medium',
      'p3-low': '🟢 P3-Low'
    };
    return labels[priority?.toLowerCase()] || priority || 'None';
  },
  getTerminalDimensions: () => ({
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24
  })
}; 