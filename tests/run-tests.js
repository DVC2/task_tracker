/**
 * TaskTracker Unified Test Runner
 * 
 * This script runs tests with appropriate configuration to handle ESM and CommonJS modules.
 * It's designed to standardize the test approach and handle the specific challenges
 * of the current codebase.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Constants
const TEST_DIRS = {
  unit: path.join(__dirname, 'tests', 'mocha', 'unit'),
  integration: path.join(__dirname, 'tests', 'mocha', 'integration'),
  e2e: path.join(__dirname, 'tests', 'mocha', 'e2e'),
  legacy: path.join(__dirname, 'tests', 'unit') // Original test location
};

// Make sure test directories exist
for (const dir of Object.values(TEST_DIRS)) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Get command line arguments
const args = process.argv.slice(2);
let testType = args[0] || 'all';
let specificTest = args[1] || null;

// Parse and validate test type
if (testType.startsWith('--')) {
  testType = testType.substring(2);
}

if (testType !== 'all' && !TEST_DIRS[testType]) {
  console.error(`❌ Unknown test type: ${testType}`);
  console.log('Available test types: all, unit, integration, e2e, legacy');
  throw new Error(`Unknown test type: ${testType}`);
}

// Determine which test directories to run
const dirsToRun = testType === 'all'
  ? Object.values(TEST_DIRS)
  : [TEST_DIRS[testType]];

console.log('🧪 TaskTracker Test Runner');
console.log('=======================\n');

/**
 * Run mocha on a specific directory
 * @param {string} testDir - Directory containing test files
 * @returns {Promise<boolean>} - Whether all tests passed
 */
async function runMochaOnDir(testDir) {
  return new Promise((resolve) => {
    console.log(`\n📂 Running tests in: ${path.relative(__dirname, testDir)}`);
    
    // Set up mocha command with appropriate options to handle ESM
    const mochaArgs = [
      '--require=chai',
      '--timeout=5000',
      '--exit',
      `${testDir}/**/*.test.js`
    ];
    
    if (specificTest) {
      const specificPath = path.join(testDir, `${specificTest}.test.js`);
      if (fs.existsSync(specificPath)) {
        mochaArgs[mochaArgs.length - 1] = specificPath;
      } else {
        console.log(`❓ Test file not found: ${specificPath}`);
        resolve(true); // Skip this directory
        return;
      }
    }
    
    // Log the command we're running
    console.log(`> npx mocha ${mochaArgs.join(' ')}\n`);
    
    // Run mocha with appropriate environment variables
    const mocha = spawn('npx', ['mocha', ...mochaArgs], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-vm-modules --no-warnings'
      }
    });
    
    mocha.on('close', (code) => {
      const passed = code === 0;
      if (passed) {
        console.log(`\n✅ All tests in ${path.basename(testDir)} passed!`);
      } else {
        console.error(`\n❌ Some tests in ${path.basename(testDir)} failed!`);
      }
      resolve(passed);
    });
  });
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log(`Running ${testType} tests${specificTest ? ` (${specificTest})` : ''}...\n`);
  
  let allPassed = true;
  
  // Run each directory's tests in sequence
  for (const dir of dirsToRun) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ Directory ${dir} does not exist, skipping.`);
      continue;
    }
    
    const testFiles = fs.readdirSync(dir).filter(f => f.endsWith('.test.js'));
    if (testFiles.length === 0) {
      console.log(`⚠️ No test files found in ${path.relative(__dirname, dir)}`);
      continue;
    }
    
    const dirPassed = await runMochaOnDir(dir);
    allPassed = allPassed && dirPassed;
  }
  
  // Final summary
  console.log('\n🏁 Test run completed!');
  if (allPassed) {
    console.log('✅ All tests passed successfully!');
  } else {
    console.error('❌ Some tests failed. See above for details.');
    throw new Error('Some tests failed');
  }
}

// Run the tests
runTests().catch(err => {
  console.error('❌ Error running tests:', err.message);
  throw err;
}); 