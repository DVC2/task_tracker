/**
 * TaskTracker Security Middleware
 * 
 * Centralized security validation, error handling, and protection
 * against common security issues.
 */

const fs = require('fs');
const path = require('path');
const { output } = require('../core/formatting');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Security constants
const MAX_STRING_LENGTH = 5000;
const VALID_FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html', '.md', '.json', '.txt'];
const DANGEROUS_PATTERNS = [
  /<script/i, 
  /javascript:/i, 
  /onerror=/i, 
  /onload=/i, 
  /eval\(/i
];

/**
 * Sanitize a string to prevent XSS attacks
 * @param {string} input String to sanitize
 * @param {number} maxLength Maximum length (default: MAX_STRING_LENGTH)
 * @returns {string} Sanitized string
 */
function sanitizeInput(input, maxLength = MAX_STRING_LENGTH) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Use DOMPurify to sanitize HTML and prevent XSS
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep the content of removed tags
    SANITIZE_DOM: true, // Sanitize DOM to prevent unwanted behaviors
    WHOLE_DOCUMENT: false // Only sanitize the input, not the whole document
  });
  
  // Further clean up the string
  return sanitized
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .substring(0, maxLength);
}

/**
 * Check if a string contains potentially dangerous content
 * @param {string} input String to check
 * @returns {boolean} True if the string is potentially dangerous
 */
function hasDangerousContent(input) {
  if (typeof input !== 'string') {
    return false;
  }
  
  // Check for dangerous patterns
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Validate a file path to prevent traversal attacks
 * @param {string} filePath File path to validate
 * @returns {object} Validation result {valid: boolean, reason: string}
 */
function validateFilePath(filePath) {
  if (typeof filePath !== 'string') {
    return { valid: false, reason: 'File path must be a string' };
  }
  
  // Clean the input first
  const cleanPath = sanitizeInput(filePath, 1000);
  
  // Normalize the path to detect path traversal attempts
  const normalizedPath = path.normalize(cleanPath);
  
  // Check for path traversal patterns
  if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
    return { valid: false, reason: 'Path traversal not allowed' };
  }
  
  // Check file extension if it has one
  const ext = path.extname(normalizedPath).toLowerCase();
  if (ext && !VALID_FILE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      reason: `File extension "${ext}" not allowed. Valid extensions: ${VALID_FILE_EXTENSIONS.join(', ')}`
    };
  }
  
  return { valid: true, path: normalizedPath };
}

/**
 * Safely execute a function with error handling and validation
 * @param {Function} fn Function to execute
 * @param {Array} args Arguments to pass to the function
 * @param {string} actionName Name of the action for error reporting
 * @returns {any} Result of the function or null if it failed
 */
function safeExecute(fn, args, actionName) {
  try {
    // Validate input args for common security issues
    args = args.map(arg => {
      if (typeof arg === 'string') {
        // Check for potentially dangerous content
        if (hasDangerousContent(arg)) {
          output(`⚠️ Warning: Potentially dangerous content detected in ${actionName}`, 'warning');
        }
        return sanitizeInput(arg);
      }
      return arg;
    });
    
    return fn(...args);
  } catch (error) {
    output(`❌ Error in ${actionName}: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Create a backup of a file
 * @param {string} filePath Path to the file to backup
 * @returns {string|null} Path to the backup file or null if failed
 */
function createBackup(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    output(`⚠️ Failed to create backup of ${filePath}: ${error.message}`, 'warning');
    return null;
  }
}

/**
 * Ensure file operation is done safely
 * @param {Function} operation Function to perform the file operation
 * @param {string} filePath Path to the file
 * @param {any} data Data to write (if applicable)
 * @returns {boolean} Success status
 */
function safeFileOperation(operation, filePath, data = null) {
  try {
    // Create a backup first
    createBackup(filePath);
    
    // Write to a temporary file first
    let tempPath = null;
    
    if (data !== null) {
      tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, data);
      
      // Set secure permissions
      if (process.platform !== 'win32') {
        fs.chmodSync(tempPath, 0o600); // Only owner can read/write
      }
      
      // Atomic rename
      fs.renameSync(tempPath, filePath);
    } else {
      // Just execute the operation
      operation(filePath);
    }
    
    return true;
  } catch (error) {
    output(`❌ Error in file operation: ${error.message}`, 'error');
    
    // Clean up temp file if it exists
    if (tempPath && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
    }
    
    return false;
  }
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString JSON string to parse
 * @param {object} defaultValue Default value if parsing fails
 * @returns {object} Parsed JSON or default value
 */
function safeJsonParse(jsonString, defaultValue = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    output(`❌ Error parsing JSON: ${error.message}`, 'error');
    return defaultValue;
  }
}

module.exports = {
  sanitizeInput,
  hasDangerousContent,
  validateFilePath,
  safeExecute,
  createBackup,
  safeFileOperation,
  safeJsonParse,
  MAX_STRING_LENGTH,
  VALID_FILE_EXTENSIONS
}; 