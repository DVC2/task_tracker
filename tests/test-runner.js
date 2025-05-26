/**
 * Test Runner / Command Execution Utilities
 * 
 * Provides utilities for running TaskTracker commands in tests
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * Runs a TaskTracker command and returns the result
 * 
 * @param {string} command - The base command (usually 'tt')
 * @param {string[]} args - Array of arguments
 * @param {object} options - Options for command execution
 * @param {string} options.cwd - Working directory for command
 * @param {boolean} options.captureOutput - Whether to capture stdout/stderr
 * @returns {object} Command result with status, stdout, stderr
 */
function runCommand(command, args = [], options = {}) {
  const { cwd = process.cwd(), captureOutput = true } = options;
  const ttBin = path.resolve(__dirname, '../bin/tt');
  
  // Default options for execSync
  const execOptions = {
    cwd,
    encoding: 'utf8',
    stdio: captureOutput ? 'pipe' : 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  };

  // Allow for direct command strings (e.g. "tt list") or command + args array
  const fullCommand = Array.isArray(args)
    ? `node ${ttBin} ${args.join(' ')}`
    : `node ${ttBin} ${args}`;

  try {
    const stdout = execSync(fullCommand, execOptions);
    return {
      status: 0,
      stdout: stdout.toString(),
      stderr: '',
      command: fullCommand
    };
  } catch (error) {
    // Command execution failed
    return {
      status: error.status || 1,
      stdout: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : '',
      error,
      command: fullCommand
    };
  }
}

module.exports = {
  runCommand
}; 