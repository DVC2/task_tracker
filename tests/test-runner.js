#!/usr/bin/env node

/**
 * TaskTracker Test Runner
 * 
 * A simple test runner for TaskTracker commands and functionality.
 * 
 * Usage: node test-runner.js [test-file]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const chalk = require('chalk');

// Constants
const TEST_DIR = path.join(__dirname);
const TASKTRACKER_BIN = path.join(__dirname, '..', 'bin', 'tasktracker');

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Test utilities
const assert = {
  equal: (actual, expected, message) => {
    results.total++;
    if (actual === expected) {
      console.log(chalk.green('✓ PASS:'), message || 'Values are equal');
      results.passed++;
      return true;
    } else {
      console.log(chalk.red('✗ FAIL:'), message || 'Values are not equal');
      console.log('  Expected:', expected);
      console.log('  Actual:', actual);
      results.failed++;
      return false;
    }
  },
  
  contains: (haystack, needle, message) => {
    results.total++;
    if (haystack.includes(needle)) {
      console.log(chalk.green('✓ PASS:'), message || `Value contains "${needle}"`);
      results.passed++;
      return true;
    } else {
      console.log(chalk.red('✗ FAIL:'), message || `Value does not contain "${needle}"`);
      console.log('  Haystack:', haystack);
      console.log('  Needle:', needle);
      results.failed++;
      return false;
    }
  },
  
  true: (value, message) => {
    results.total++;
    if (value) {
      console.log(chalk.green('✓ PASS:'), message || 'Value is true');
      results.passed++;
      return true;
    } else {
      console.log(chalk.red('✗ FAIL:'), message || 'Value is not true');
      console.log('  Value:', value);
      results.failed++;
      return false;
    }
  },
  
  false: (value, message) => {
    results.total++;
    if (!value) {
      console.log(chalk.green('✓ PASS:'), message || 'Value is false');
      results.passed++;
      return true;
    } else {
      console.log(chalk.red('✗ FAIL:'), message || 'Value is not false');
      console.log('  Value:', value);
      results.failed++;
      return false;
    }
  }
};

// Test command
const runCommand = (command, args = [], options = {}) => {
  const cmd = command === 'tasktracker' ? TASKTRACKER_BIN : command;
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    ...options
  });
  
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
    success: result.status === 0
  };
};

// Run a test file
const runTestFile = (filePath) => {
  console.log(chalk.cyan('\n=============================================='));
  console.log(chalk.cyan(`Running Tests: ${path.basename(filePath)}`));
  console.log(chalk.cyan('==============================================\n'));
  
  try {
    // Create a test context with required utilities
    const context = {
      assert,
      runCommand,
      describe: (description, fn) => {
        console.log(chalk.yellow(`\n# ${description}`));
        fn();
      },
      test: (description, fn) => {
        console.log(chalk.blue(`\n## Test: ${description}`));
        try {
          fn();
        } catch (error) {
          console.log(chalk.red('✗ FAIL:'), `Test threw an exception: ${error.message}`);
          console.log(error.stack);
          results.failed++;
          results.total++;
        }
      },
      skip: (description) => {
        console.log(chalk.gray(`\n## SKIPPED: ${description}`));
        results.skipped++;
        results.total++;
      }
    };
    
    // Load and run the test file
    const testModule = require(filePath);
    if (typeof testModule === 'function') {
      testModule(context);
    } else {
      console.log(chalk.red('Error: Test file does not export a function.'));
      results.failed++;
    }
  } catch (error) {
    console.log(chalk.red(`Error running test file: ${error.message}`));
    console.log(error.stack);
    results.failed++;
  }
};

// Discover and run tests
const runTests = (specificFile = null) => {
  // Check if TaskTracker bin exists
  if (!fs.existsSync(TASKTRACKER_BIN)) {
    console.error(chalk.red(`Error: TaskTracker binary not found at ${TASKTRACKER_BIN}`));
    process.exit(1);
  }
  
  // Get test files
  let testFiles = [];
  
  if (specificFile) {
    // Run a specific test file
    const filePath = path.resolve(specificFile);
    if (fs.existsSync(filePath)) {
      testFiles.push(filePath);
    } else {
      console.error(chalk.red(`Error: Test file not found: ${filePath}`));
      process.exit(1);
    }
  } else {
    // Run all test files in the test directory
    const files = fs.readdirSync(TEST_DIR);
    testFiles = files
      .filter(file => file.startsWith('test-') && file.endsWith('.js') && file !== 'test-runner.js')
      .map(file => path.join(TEST_DIR, file));
  }
  
  // No test files found
  if (testFiles.length === 0) {
    console.log(chalk.yellow('No test files found. Create test files with the naming pattern "test-*.js".'));
    process.exit(0);
  }
  
  // Run each test file
  testFiles.forEach(runTestFile);
  
  // Show summary
  console.log(chalk.cyan('\n=============================================='));
  console.log(chalk.cyan('Test Summary'));
  console.log(chalk.cyan('=============================================='));
  console.log(`Total Tests: ${results.total}`);
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));
  console.log(chalk.gray(`Skipped: ${results.skipped}`));
  console.log(chalk.cyan('==============================================\n'));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
};

// If this file is executed directly, run tests
if (require.main === module) {
  const specificFile = process.argv[2];
  runTests(specificFile);
}

module.exports = {
  assert,
  runCommand,
  runTests
}; 