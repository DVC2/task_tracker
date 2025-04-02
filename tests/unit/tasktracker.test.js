/**
 * TaskTracker Core Functionality Tests
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Path to the TaskTracker CLI
const TT_CLI = path.resolve(__dirname, '../../bin/tt');

// Test task data
const TEST_TASK = {
  title: 'Test task for unit tests',
  category: 'test',
  description: 'This is a test task created by the automated test suite'
};

// Test directory for temporary files
const TEST_DIR = path.resolve(__dirname, '../temp');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Helper function to run TaskTracker commands in test mode
function runCommand(args) {
  const command = `${TT_CLI} ${args} --test-mode --silent`;
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout);
    console.error(error.stderr);
    throw error;
  }
}

// Test suite
describe('TaskTracker Core Functionality', () => {
  let testTaskId;
  
  // Setup: Create a test task
  before(() => {
    try {
      console.log('Setting up test environment...');
      // Create a test task
      const result = runCommand(`quick "${TEST_TASK.title}" ${TEST_TASK.category} --json`);
      const task = JSON.parse(result);
      testTaskId = task.id;
      console.log(`Created test task with ID: ${testTaskId}`);
    } catch (error) {
      console.error('Failed to set up test environment:', error);
      process.exit(1);
    }
  });
  
  // Cleanup: Remove test task
  after(() => {
    try {
      console.log('Cleaning up test environment...');
      // In a real implementation, we would delete the test task
      // runCommand(`delete ${testTaskId} --force`);
      console.log('Test cleanup completed');
    } catch (error) {
      console.error('Failed to clean up test environment:', error);
    }
  });

  // Test cases
  describe('Task Creation', () => {
    it('should create a task with the correct title', () => {
      const result = runCommand(`view ${testTaskId} --json`);
      const task = JSON.parse(result);
      assert.strictEqual(task.title, TEST_TASK.title);
    });
    
    it('should create a task with the correct category', () => {
      const result = runCommand(`view ${testTaskId} --json`);
      const task = JSON.parse(result);
      assert.strictEqual(task.category, TEST_TASK.category);
    });
  });
  
  describe('Task Updates', () => {
    it('should update task status', () => {
      runCommand(`update ${testTaskId} status in-progress --silent`);
      const result = runCommand(`view ${testTaskId} --json`);
      const task = JSON.parse(result);
      assert.strictEqual(task.status, 'in-progress');
    });
    
    it('should add a comment to a task', () => {
      const comment = 'Test comment from automated tests';
      runCommand(`update ${testTaskId} comment "${comment}" --silent`);
      const result = runCommand(`view ${testTaskId} --json`);
      const task = JSON.parse(result);
      assert(task.comments && task.comments.length > 0);
      assert(task.comments.some(c => c.text === comment));
    });
  });
  
  describe('Task Listing', () => {
    it('should list tasks including the test task', () => {
      const result = runCommand('list --json');
      const tasks = JSON.parse(result).tasks;
      const found = tasks.some(task => task.id === testTaskId);
      assert(found, 'Test task should be included in the task list');
    });
    
    it('should filter tasks by category', () => {
      const result = runCommand(`list --category=${TEST_TASK.category} --json`);
      const tasks = JSON.parse(result).tasks;
      const allMatch = tasks.every(task => task.category === TEST_TASK.category);
      assert(allMatch, 'All tasks should match the requested category');
    });
  });
  
  describe('Task Status Changes', () => {
    const statuses = ['todo', 'in-progress', 'review', 'done'];
    
    statuses.forEach(status => {
      it(`should change task status to ${status}`, () => {
        runCommand(`update ${testTaskId} status ${status} --silent`);
        const result = runCommand(`view ${testTaskId} --json`);
        const task = JSON.parse(result);
        assert.strictEqual(task.status, status);
      });
    });
  });
  
  // Add more test cases as needed
});

// If running directly (not through a test runner)
if (require.main === module) {
  console.log('Running TaskTracker unit tests...');
  
  // Simple test runner
  let passed = 0;
  let failed = 0;
  
  const runTest = (name, fn) => {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ FAIL: ${name}`);
      console.error(error);
      failed++;
    }
  };
  
  // Run a subset of tests directly
  const testTaskId = '1'; // Assume task 1 exists for simple testing
  
  runTest('Create task', () => {
    const result = runCommand(`quick "Test direct run" test --json`);
    const task = JSON.parse(result);
    assert(task.id > 0);
    assert.strictEqual(task.title, "Test direct run");
  });
  
  runTest('List tasks', () => {
    const result = runCommand('list --json');
    const tasks = JSON.parse(result).tasks;
    assert(Array.isArray(tasks));
  });
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
} 