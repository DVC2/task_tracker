# TaskTracker Security Guide

## Overview

This document outlines the security measures implemented in TaskTracker to address potential vulnerabilities and ensure data integrity.

## Recent Security Improvements

The following security enhancements have been implemented to address identified issues:

### Input Validation & Sanitization

1. **HTML Content Sanitization**
   - Implemented DOMPurify for comprehensive HTML sanitization
   - Removed all HTML tags from user inputs to prevent XSS attacks
   - Added detection for suspicious content patterns (JavaScript code, event handlers)

2. **Task ID Validation**
   - Enforced numeric validation for all task IDs
   - Added type conversion and validation for string IDs
   - Improved error handling for invalid ID formats

3. **Length Limits**
   - Added maximum length constraints for:
     - Task titles (200 characters)
     - Task descriptions (5000 characters)
     - Comments (2000 characters)
   - Automatic truncation of oversized inputs

4. **File Path Validation**
   - Implemented comprehensive path traversal prevention
   - Added whitelist of allowed file extensions
   - Normalized paths to detect evasion techniques
   - Validated paths before any file operations

5. **Command-Line Argument Validation**
   - Added strict validation for CLI arguments to prevent injection attacks
   - Implemented contextual validation based on argument type (command, ID, file path, etc.)
   - Added automatic sanitization of potentially dangerous inputs
   - Created early detection and blocking of critical security issues

### Data Storage Security

1. **Atomic File Operations**
   - Implemented write-to-temp-then-rename pattern for file updates
   - Added file locking during critical operations
   - Created backup system to prevent data loss

2. **Data Recovery Mechanisms**
   - Added automatic backup creation before file modifications
   - Implemented recovery system for corrupted JSON data
   - Created validation system for configuration integrity

3. **Secure File Permissions**
   - Set proper file permissions (0600) on data files (Unix systems)
   - Restricted directory permissions to prevent unauthorized access
   - Added directory security checks

### Error Handling & Recovery

1. **Robust Error Management**
   - Improved error messages with actionable guidance
   - Added graceful degradation for non-critical failures
   - Implemented comprehensive logging of security events

2. **JSON Validation**
   - Added schema validation for task and configuration data
   - Implemented safe JSON parsing with fallback to defaults
   - Added corruption detection with auto-repair for common issues

## Security Guidelines for Developers

When contributing to TaskTracker, please follow these security guidelines:

### Input Handling

1. **Always sanitize user inputs**
   - Use the `security.sanitizeInput()` function for all user-provided strings
   - Never insert raw user input into the DOM or files
   - Check for dangerous content with `security.hasDangerousContent()`

2. **Validate all file paths**
   - Use `security.validateFilePath()` for all file operations
   - Never allow absolute paths or path traversal via `..`
   - Only allow approved file extensions

3. **Validate command-line arguments**
   - Use `cliSecurity.sanitizeArgs()` for all command-line arguments
   - Check for validation issues before processing arguments
   - Use type-specific validation with `cliSecurity.validateArg()`

### File Operations

1. **Use atomic operations for data files**
   - Use `security.safeFileOperation()` for all file writes
   - Create backups before modifying critical data
   - Implement proper error handling

2. **Validate JSON data**
   - Use `security.safeJsonParse()` for parsing JSON files
   - Provide default values for parsing failures
   - Validate data structure before using

### Error Handling

1. **Provide detailed error messages**
   - Include the specific reason for failures
   - Don't expose sensitive information in errors
   - Always catch and properly handle exceptions

2. **Gracefully degrade functionality**
   - Fall back to safe defaults when errors occur
   - Log security-related errors
   - Prevent data loss where possible

## Security Testing

A comprehensive test suite has been added for security features:

1. **Input Sanitization Tests**
   - Tests for HTML content removal
   - Tests for length limits enforcement
   - Tests for dangerous content detection

2. **File Path Validation Tests**
   - Tests for path traversal detection
   - Tests for file extension validation
   - Tests for relative path handling

3. **Task ID Validation Tests**
   - Tests for numeric ID handling
   - Tests for string ID conversion
   - Tests for invalid ID rejection

4. **Safe File Operation Tests**
   - Tests for atomic file writing
   - Tests for backup creation
   - Tests for recovery mechanisms

5. **CLI Argument Validation Tests**
   - Tests for command injection prevention
   - Tests for contextual argument validation
   - Tests for automatic sanitization
   - Tests for critical security issue detection

## Reporting Security Issues

If you discover a security vulnerability in TaskTracker, please follow these steps:

1. **Do not disclose the issue publicly**
2. Email details to security@tasktracker.com
3. Include steps to reproduce the vulnerability
4. Allow time for the issue to be addressed before disclosure 