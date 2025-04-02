#!/usr/bin/env node

/**
 * TaskTracker Test Runner
 * 
 * Runs the test suite for TaskTracker
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Mocha = require('mocha');

// Arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all'; // 'all', 'unit', 'integration', 'security', 'performance'
const pattern = args[1] || '*.test.js'; // Test file pattern

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test directory
const testDir = __dirname;
const unitDir = path.join(testDir, 'unit');
const integrationDir = path.join(testDir, 'integration');
const securityDir = path.join(testDir, 'security');
const performanceDir = path.join(testDir, 'performance');

// Create test directories if they don't exist
[unitDir, integrationDir, securityDir, performanceDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Print header
console.log(`
${colors.bright}${colors.blue}===========================================${colors.reset}
${colors.bright}${colors.blue}         TaskTracker Test Runner          ${colors.reset}
${colors.bright}${colors.blue}===========================================${colors.reset}
`);

/**
 * Find test files in a directory
 * @param {string} dir Directory to search
 * @param {string} pattern File pattern to match
 * @returns {string[]} Array of test file paths
 */
function findTestFiles(dir, pattern) {
  // Convert glob pattern to regex-compatible pattern
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  const regex = new RegExp(regexPattern);
  
  try {
    const files = fs.readdirSync(dir);
    return files
      .filter(file => regex.test(file))
      .map(file => path.join(dir, file));
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
    return [];
  }
}

/**
 * Run tests in a directory
 * @param {string} dir Directory containing tests
 * @param {string} pattern File pattern to match
 * @param {string} name Test category name
 * @param {object} options Additional options for this test category
 * @returns {Promise<object>} Test results
 */
async function runTests(dir, pattern, name, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.bright}${colors.cyan}Running ${name} tests...${colors.reset}`);
    
    // Create a new Mocha instance
    const mocha = new Mocha({
      reporter: 'spec',
      timeout: options.timeout || 5000
    });
    
    // Find and add test files
    const testFiles = findTestFiles(dir, pattern);
    
    if (testFiles.length === 0) {
      console.log(`${colors.yellow}No ${name} tests found matching ${pattern}${colors.reset}`);
      return resolve({ passed: 0, failed: 0, total: 0 });
    }
    
    console.log(`${colors.dim}Found ${testFiles.length} test files${colors.reset}`);
    
    // Add each test file to Mocha
    testFiles.forEach(file => {
      mocha.addFile(file);
    });
    
    // Track pass/fail counts
    let passed = 0;
    let failed = 0;
    
    // Run the tests
    mocha.run()
      .on('pass', () => { passed++; })
      .on('fail', () => { failed++; })
      .on('end', () => {
        const total = passed + failed;
        resolve({ passed, failed, total });
      });
  });
}

/**
 * Print test results
 * @param {object} results Test results
 * @param {string} name Test category name
 */
function printResults(results, name) {
  const { passed, failed, total } = results;
  
  if (total === 0) {
    return;
  }
  
  console.log(`\n${colors.bright}${name} Test Results:${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.cyan}Total: ${total}${colors.reset}`);
  
  // Print pass percentage
  const passPercent = total > 0 ? Math.round((passed / total) * 100) : 0;
  const passColor = passPercent >= 90 ? colors.green : (passPercent >= 70 ? colors.yellow : colors.red);
  console.log(`${passColor}Pass Rate: ${passPercent}%${colors.reset}`);
}

/**
 * Main function to run tests
 */
async function main() {
  let unitResults = { passed: 0, failed: 0, total: 0 };
  let integrationResults = { passed: 0, failed: 0, total: 0 };
  let securityResults = { passed: 0, failed: 0, total: 0 };
  let performanceResults = { passed: 0, failed: 0, total: 0 };
  
  // Run the appropriate tests based on the specified type
  try {
    if (testType === 'all' || testType === 'unit') {
      unitResults = await runTests(unitDir, pattern, 'Unit');
    }
    
    if (testType === 'all' || testType === 'integration') {
      integrationResults = await runTests(integrationDir, pattern, 'Integration');
    }
    
    if (testType === 'all' || testType === 'security') {
      securityResults = await runTests(securityDir, pattern, 'Security');
    }
    
    if (testType === 'all' || testType === 'performance') {
      // Performance tests get a longer timeout
      performanceResults = await runTests(performanceDir, pattern, 'Performance', { timeout: 30000 });
    }
    
    // Print combined results
    if (testType === 'all') {
      const totalResults = {
        passed: unitResults.passed + integrationResults.passed + securityResults.passed + performanceResults.passed,
        failed: unitResults.failed + integrationResults.failed + securityResults.failed + performanceResults.failed,
        total: unitResults.total + integrationResults.total + securityResults.total + performanceResults.total
      };
      
      console.log(`\n${colors.bright}${colors.blue}===========================================${colors.reset}`);
      printResults(totalResults, 'Combined');
    }
    
    // Exit with appropriate code
    const anyFailed = 
      unitResults.failed > 0 || 
      integrationResults.failed > 0 || 
      securityResults.failed > 0 ||
      performanceResults.failed > 0;
    
    process.exit(anyFailed ? 1 : 0);
  } catch (error) {
    console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Print usage information
function printUsage() {
  console.log(`
${colors.bright}Usage:${colors.reset}
  node run-tests.js [test-type] [pattern]

${colors.bright}Arguments:${colors.reset}
  test-type   Type of tests to run: 'unit', 'integration', 'security', 'performance', or 'all' (default: 'all')
  pattern     File pattern to match (default: '*.test.js')

${colors.bright}Examples:${colors.reset}
  node run-tests.js                    # Run all tests
  node run-tests.js unit               # Run only unit tests
  node run-tests.js integration        # Run only integration tests
  node run-tests.js performance        # Run only performance tests
  node run-tests.js unit task*.test.js # Run unit tests matching 'task*.test.js'
`);
}

// If help flag is provided, print usage
if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
} 