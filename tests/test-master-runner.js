/**
 * TaskTracker Test Master Runner
 * 
 * This script provides infrastructure to discover and run all custom framework tests
 * across different directories. It uses the test helpers defined below and injects
 * them into each test file.
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('./test-runner');

// Test suite configuration
const TEST_DIRS = {
  unit: path.join(__dirname, 'unit'),
  integration: path.join(__dirname, 'integration'),
  e2e: path.join(__dirname, 'e2e'),
  security: path.join(__dirname, 'security'),
  performance: path.join(__dirname, 'performance')
};

// Test helpers to inject into each test file
const testHelpers = {
  describe: (name, fn) => {
    console.log(`\n📋 ${name}`);
    fn();
  },
  
  test: (name, fn) => {
    try {
      fn();
      console.log(`✅ ${name}`);
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`  Error: ${error.message}`);
      if (error.stack) {
        console.error('  Stack:', error.stack.split('\n').slice(1).join('\n'));
      }
      throw error;
    }
  },
  
  assert: {
    equal: (actual, expected, message) => {
      if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
      }
    },
    
    true: (value, message) => {
      if (!value) {
        throw new Error(message || 'Expected value to be true');
      }
    },
    
    false: (value, message) => {
      if (value) {
        throw new Error(message || 'Expected value to be false');
      }
    },
    
    contains: (string, substring, message) => {
      if (!string || !string.includes(substring)) {
        throw new Error(message || `Expected "${string}" to contain "${substring}"`);
      }
    }
  },
  
  _skip: (name, _fn) => {
    console.log(`⏩ Skipped: ${name}`);
  },

  // Include the runCommand utility
  runCommand
};

// Run a specific test file
function runTestFile(filePath) {
  try {
    console.log(`\n🧪 Running test: ${path.relative(__dirname, filePath)}`);
    const test = require(filePath);
    if (typeof test === 'function') {
      test(testHelpers);
    } else {
      console.error(`❌ ${filePath} does not export a function`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to run test ${filePath}`);
    console.error(error);
    return false;
  }
}

// Run all tests in a directory
function runTestDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Test directory ${dirPath} does not exist`);
    return false;
  }
  
  console.log(`\n📁 Running tests in: ${path.relative(__dirname, dirPath)}`);
  
  const files = fs.readdirSync(dirPath);
  let allPassed = true;
  let testsRun = 0;
  
  for (const file of files) {
    if (file.endsWith('.test.js') || file.endsWith('-checks.js')) {
      const filePath = path.join(dirPath, file);
      const passed = runTestFile(filePath);
      if (!passed) {
        allPassed = false;
      }
      testsRun++;
    }
  }
  
  if (testsRun === 0) {
    console.log(`💬 No test files found in ${path.relative(__dirname, dirPath)}`);
  }
  
  return allPassed;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  let testsToRun = Object.keys(TEST_DIRS);
  let specificFile = null;
  
  // Handle command line arguments
  if (args.length > 0) {
    if (args[0].startsWith('--')) {
      // Run specific test type (e.g., --unit)
      const testType = args[0].substring(2);
      if (TEST_DIRS[testType]) {
        testsToRun = [testType];
      } else {
        console.error(`❌ Unknown test type: ${testType}`);
        throw new Error(`Unknown test type: ${testType}`);
      }
    } else {
      // Run specific test file
      specificFile = path.resolve(args[0]);
      if (!fs.existsSync(specificFile)) {
        console.error(`❌ Test file not found: ${specificFile}`);
        throw new Error(`Test file not found: ${specificFile}`);
      }
    }
  }
  
  console.log('🧪 Starting TaskTracker tests...\n');
  
  let allPassed = true;
  
  if (specificFile) {
    // Run specific file
    allPassed = runTestFile(specificFile);
  } else {
    // Run all specified test directories
    for (const testType of testsToRun) {
      const passed = runTestDir(TEST_DIRS[testType]);
      if (!passed) {
        allPassed = false;
      }
    }
  }
  
  console.log('\n🏁 All tests completed.');
  
  if (allPassed) {
    console.log('✅ All tests passed!');
    // Success - no error thrown
  } else {
    console.error('❌ Some tests failed!');
    throw new Error('Some tests failed');
  }
}

// Run the tests
try {
  main();
} catch (error) {
  console.error(error.message);
  // Let the error propagate
  throw error;
} 