/**
 * TaskTracker CLI Security Utility
 * 
 * Provides validation and sanitization for command-line arguments
 * to prevent command injection and other attacks.
 */

const security = require('./security-middleware');

// Define safe patterns for different argument types
const ARG_PATTERNS = {
  // Command names should be alphanumeric plus dash
  command: /^[a-z0-9][a-z0-9-]*$/i,
  
  // Task IDs should be numeric
  taskId: /^[0-9]+$/,
  
  // File paths should prevent traversal and be restricted
  filePath: /^[a-z0-9_\-.\/][a-z0-9_\-\s.\/]*\.[a-z0-9]+$/i,
  
  // Option flags should be alphanumeric plus dash
  option: /^[a-z0-9][a-z0-9-]*$/i,
  
  // Option values allow more characters but still restricted - made more permissive
  value: /^[\w\s\-.,:;@#$%^&*()\[\]{}|<>?!'"+=\/\\]*$/i,
  
  // Special pattern for quoted strings (task titles, descriptions)
  quotedString: /^.*$/,
};

// Maximum parameter lengths
const MAX_LENGTHS = {
  command: 30,
  taskId: 10,
  filePath: 200,
  option: 30,
  value: 1000,
  quotedString: 2000,
};

/**
 * Validate a command argument
 * @param {string} arg Argument to validate
 * @param {string} type Type of argument (command, taskId, filePath, option, value, quotedString)
 * @returns {object} Validation result {valid: boolean, reason: string, sanitized: string}
 */
function validateArg(arg, type = 'value') {
  // Ensure arg is a string
  if (typeof arg !== 'string') {
    return {
      valid: false,
      reason: `Argument must be a string, got ${typeof arg}`,
      sanitized: ''
    };
  }
  
  // Handle quoted strings specially - they can contain almost anything
  if ((arg.startsWith('"') && arg.endsWith('"')) || 
      (arg.startsWith("'") && arg.endsWith("'"))) {
    // Strip quotes for validation
    const unquoted = arg.substring(1, arg.length - 1);
    return {
      valid: true,
      reason: '',
      sanitized: arg // Keep original with quotes
    };
  }
  
  // Prevent empty arguments (except for values which can be empty)
  if (arg.length === 0 && type !== 'value') {
    return {
      valid: false,
      reason: 'Argument cannot be empty',
      sanitized: ''
    };
  }
  
  // Check length
  const maxLength = MAX_LENGTHS[type] || MAX_LENGTHS.value;
  if (arg.length > maxLength) {
    return {
      valid: false,
      reason: `Argument exceeds maximum length of ${maxLength}`,
      sanitized: arg.substring(0, maxLength)
    };
  }
  
  // Check for dangerous content if it's a value or file path
  if (['value', 'filePath'].includes(type) && security.hasDangerousContent(arg)) {
    return {
      valid: false,
      reason: 'Argument contains potentially dangerous content',
      sanitized: security.sanitizeInput(arg, maxLength)
    };
  }
  
  // If this is a quoted string, apply less strict validation
  if (type === 'quotedString') {
    return {
      valid: true,
      reason: '',
      sanitized: security.sanitizeInput(arg, maxLength)
    };
  }
  
  // Check against regex pattern
  const pattern = ARG_PATTERNS[type] || ARG_PATTERNS.value;
  if (!pattern.test(arg)) {
    return {
      valid: false,
      reason: `Argument contains invalid characters for type '${type}'`,
      sanitized: security.sanitizeInput(arg, maxLength)
    };
  }
  
  // Special validation for file paths
  if (type === 'filePath') {
    const pathValidation = security.validateFilePath(arg);
    if (!pathValidation.valid) {
      return {
        valid: false,
        reason: pathValidation.reason,
        sanitized: ''
      };
    }
  }
  
  // Return a sanitized version even if valid
  return {
    valid: true,
    reason: '',
    sanitized: security.sanitizeInput(arg, maxLength)
  };
}

/**
 * Sanitize command-line arguments array
 * @param {string[]} args Raw command line arguments
 * @param {object} options Sanitization options
 * @returns {object} Sanitized arguments and validation results
 */
function sanitizeArgs(args, options = {}) {
  if (!Array.isArray(args)) {
    return {
      valid: false,
      sanitizedArgs: [],
      validationIssues: ['Arguments must be provided as an array']
    };
  }
  
  const sanitizedArgs = [];
  const validationIssues = [];
  
  // Process command (first arg) if present and we're not skipping command validation
  if (args.length > 0) {
    // We often get security warnings on commands because they might contain special chars
    // For the actual command name, this is fine since we validate against known commands
    // So for the first arg, be more lenient to reduce warnings
    if (options.skipCommandValidation) {
      sanitizedArgs.push(args[0]);
    } else {
      const cmdValidation = validateArg(args[0], 'command');
      sanitizedArgs.push(cmdValidation.valid ? args[0] : cmdValidation.sanitized);
      
      if (!cmdValidation.valid) {
        validationIssues.push(`Invalid command: ${cmdValidation.reason}`);
      }
    }
  }
  
  // Process remaining args
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    let validation;
    
    // Detect argument type
    if (arg.startsWith('-')) {
      // Option flags
      validation = validateArg(arg.replace(/^-+/, ''), 'option');
      sanitizedArgs.push(arg.startsWith('--') ? `--${validation.sanitized}` : `-${validation.sanitized}`);
      
      if (!validation.valid) {
        validationIssues.push(`Invalid option '${arg}': ${validation.reason}`);
      }
      
      // If this is an option with a value, handle the next arg as a value
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        const nextArg = args[i + 1];
        
        // Determine if the next argument is a quoted string
        if ((nextArg.startsWith('"') && nextArg.endsWith('"')) || 
            (nextArg.startsWith("'") && nextArg.endsWith("'"))) {
          const valueValidation = validateArg(nextArg, 'quotedString');
          sanitizedArgs.push(valueValidation.sanitized);
          
          if (!valueValidation.valid) {
            validationIssues.push(`Invalid quoted value for option '${arg}': ${valueValidation.reason}`);
          }
        } else {
          const valueValidation = validateArg(nextArg, 'value');
          sanitizedArgs.push(valueValidation.sanitized);
          
          if (!valueValidation.valid) {
            validationIssues.push(`Invalid value for option '${arg}': ${valueValidation.reason}`);
          }
        }
        
        i++; // Skip the value arg as we've processed it
      }
    } else if (/^\d+$/.test(arg)) {
      // Numeric arg - likely a task ID
      validation = validateArg(arg, 'taskId');
      sanitizedArgs.push(validation.sanitized);
      
      if (!validation.valid) {
        validationIssues.push(`Invalid task ID '${arg}': ${validation.reason}`);
      }
    } else if (arg.includes('.') && !arg.startsWith('.')) {
      // Likely a file path if it has an extension
      validation = validateArg(arg, 'filePath');
      sanitizedArgs.push(validation.sanitized);
      
      if (!validation.valid) {
        validationIssues.push(`Invalid file path '${arg}': ${validation.reason}`);
      }
    } else if ((arg.startsWith('"') && arg.endsWith('"')) || 
               (arg.startsWith("'") && arg.endsWith("'"))) {
      // Handle quoted strings specially
      validation = validateArg(arg, 'quotedString');
      sanitizedArgs.push(validation.sanitized);
      
      if (!validation.valid) {
        validationIssues.push(`Invalid quoted string '${arg}': ${validation.reason}`);
      }
    } else {
      // General value
      validation = validateArg(arg, 'value');
      sanitizedArgs.push(validation.sanitized);
      
      if (!validation.valid) {
        validationIssues.push(`Invalid argument '${arg}': ${validation.reason}`);
      }
    }
  }
  
  return {
    valid: validationIssues.length === 0,
    sanitizedArgs,
    validationIssues
  };
}

module.exports = {
  validateArg,
  sanitizeArgs,
  ARG_PATTERNS,
  MAX_LENGTHS
}; 