/**
 * TaskTracker Claude Integration Tests
 * Tests the integration with Claude agents through batch templates
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const assert = require('assert');

// Import test utilities
const { describe, it, before, after } = require('mocha');

// Path to the tasktracker CLI and batch processor
const TASKTRACKER_CLI = path.resolve(__dirname, '../../bin/tasktracker');
const TASKTRACKER_BATCH = path.resolve(__dirname, '../../bin/tasktracker-batch');

// Path to Claude templates
const CLAUDE_TEMPLATES_DIR = path.resolve(__dirname, '../../examples/claude-templates');

// Test task data
const TEST_TASKS = {
  main: 'Claude integration main task',
  sub1: 'Claude integration subtask 1',
  sub2: 'Claude integration subtask 2'
};

// Helper function to run tasktracker commands in test mode
function runCommand(args) {
  const command = `${TASKTRACKER_CLI} ${args} --test-mode --silent`;
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout);
    console.error(error.stderr);
    throw error;
  }
}

// Helper function to run batch commands
function runBatch(batchFile) {
  const command = `${TASKTRACKER_BATCH} ${batchFile} --test-mode`;
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Batch command failed: ${command}`);
    console.error(error.stdout);
    console.error(error.stderr);
    throw error;
  }
}

// Verify Claude templates exist
function verifyClaudeTemplates() {
  const templateFiles = [
    'daily-update.txt',
    'task-create.txt',
    'pr-prepare.txt'
  ];
  
  templateFiles.forEach(file => {
    const templatePath = path.join(CLAUDE_TEMPLATES_DIR, file);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Claude template file not found: ${templatePath}`);
    }
  });
  
  return true;
}

// Test suite
describe('Claude Agent Integration', () => {
  let testTaskIds = {};
  
  // Setup: Create test tasks
  before(() => {
    try {
      console.log('Setting up Claude integration test environment...');
      
      // Create test task
      const result = runCommand(`quick "${TEST_TASKS.main}" feature --json`);
      const task = JSON.parse(result);
      testTaskIds.main = task.id;
      
      console.log(`Created main test task with ID: ${testTaskIds.main}`);
      
      // Verify Claude templates
      const templatesExist = verifyClaudeTemplates();
      assert(templatesExist, 'Claude templates should exist');
      
    } catch (error) {
      console.error('Failed to set up test environment:', error);
      process.exit(1);
    }
  });
  
  // Cleanup: Remove test tasks
  after(() => {
    try {
      console.log('Cleaning up integration test environment...');
      // In a real implementation, we would delete the test tasks
      console.log('Test cleanup completed');
    } catch (error) {
      console.error('Failed to clean up test environment:', error);
    }
  });

  // Test cases
  describe('Claude-Specific Templates', () => {
    it('should have all required Claude templates', () => {
      assert(verifyClaudeTemplates());
    });
    
    it('should create tasks using the task-create template', function() {
      // Create a temporary batch file based on the template
      const templatePath = path.join(CLAUDE_TEMPLATES_DIR, 'task-create.txt');
      const tempBatchPath = path.join(__dirname, '../temp/temp-task-create.txt');
      
      // Read template and customize it for testing
      let templateContent = fs.readFileSync(templatePath, 'utf8');
      templateContent = templateContent.replace(/Main feature: User authentication/g, 'Claude test: Feature A');
      templateContent = templateContent.replace(/Implement login form/g, 'Claude test: Task B');
      templateContent = templateContent.replace(/Add validation logic/g, 'Claude test: Task C');
      templateContent = templateContent.replace(/Create backend API/g, 'Claude test: Task D');
      
      // Write to temp file
      fs.writeFileSync(tempBatchPath, templateContent);
      
      // Run the batch file
      runBatch(tempBatchPath);
      
      // Verify tasks were created
      const result = runCommand('list --json');
      const tasks = JSON.parse(result).tasks;
      
      // Find the tasks we just created
      const createdTasks = tasks.filter(task => 
        task.title.startsWith('Claude test:')
      );
      
      assert(createdTasks.length >= 4, 'Should have created at least 4 tasks');
      
      // Find tasks by title
      const taskA = createdTasks.find(t => t.title.includes('Feature A'));
      const taskB = createdTasks.find(t => t.title.includes('Task B'));
      const taskC = createdTasks.find(t => t.title.includes('Task C'));
      const taskD = createdTasks.find(t => t.title.includes('Task D'));
      
      // Store IDs for other tests
      if (taskA) testTaskIds.taskA = taskA.id;
      if (taskB) testTaskIds.taskB = taskB.id;
      
      assert(taskA, 'Feature A task should exist');
      assert(taskB, 'Task B should exist');
      assert(taskC, 'Task C should exist');
      assert(taskD, 'Task D should exist');
    });
    
    it('should update task statuses using the daily-update template', function() {
      // Skip if we don't have tasks from previous test
      if (!testTaskIds.taskA || !testTaskIds.taskB) {
        this.skip();
        return;
      }
      
      // Create a temporary batch file based on the template
      const templatePath = path.join(CLAUDE_TEMPLATES_DIR, 'daily-update.txt');
      const tempBatchPath = path.join(__dirname, '../temp/temp-daily-update.txt');
      
      // Read template and customize it for testing
      let templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with actual task IDs
      templateContent = templateContent.replace(/update 1 status/g, `update ${testTaskIds.taskA} status`);
      templateContent = templateContent.replace(/update 2 status/g, `update ${testTaskIds.taskB} status`);
      templateContent = templateContent.replace(/update 3 status/g, '# update 3 status'); // Comment out unused ID
      
      // Write to temp file
      fs.writeFileSync(tempBatchPath, templateContent);
      
      // Run the batch file
      runBatch(tempBatchPath);
      
      // Verify task statuses were updated
      const taskAResult = runCommand(`view ${testTaskIds.taskA} --json`);
      const taskA = JSON.parse(taskAResult);
      
      const taskBResult = runCommand(`view ${testTaskIds.taskB} --json`);
      const taskB = JSON.parse(taskBResult);
      
      assert.strictEqual(taskA.status, 'done', 'TaskA status should be "done"');
      assert.strictEqual(taskB.status, 'in-progress', 'TaskB status should be "in-progress"');
    });
    
    it('should prepare a PR using the pr-prepare template', function() {
      // Skip if we don't have main task ID
      if (!testTaskIds.main) {
        this.skip();
        return;
      }
      
      // Create a temporary batch file based on the template
      const templatePath = path.join(CLAUDE_TEMPLATES_DIR, 'pr-prepare.txt');
      const tempBatchPath = path.join(__dirname, '../temp/temp-pr-prepare.txt');
      
      // Read template and customize it for testing
      let templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with actual task ID
      templateContent = templateContent.replace(/view 5/g, `view ${testTaskIds.main}`);
      templateContent = templateContent.replace(/update 5 status/g, `update ${testTaskIds.main} status`);
      templateContent = templateContent.replace(/task\.pr_desc 5/g, `task.pr_desc ${testTaskIds.main}`);
      
      // Write to temp file
      fs.writeFileSync(tempBatchPath, templateContent);
      
      // Run the batch file
      runBatch(tempBatchPath);
      
      // Verify task status was updated to review
      const taskResult = runCommand(`view ${testTaskIds.main} --json`);
      const task = JSON.parse(taskResult);
      
      assert.strictEqual(task.status, 'review', 'Task status should be "review"');
    });
  });
  
  describe('Claude Helper Commands', () => {
    it('should generate AI context for a task', () => {
      // Skip if we don't have main task ID
      if (!testTaskIds.main) {
        this.skip();
        return;
      }
      
      // Use ai-context command
      const result = runCommand(`ai-context ${testTaskIds.main} --json`);
      const contextData = JSON.parse(result);
      
      assert(contextData.task, 'Context should include task data');
      assert.strictEqual(contextData.task.id, testTaskIds.main, 'Context should be for the correct task');
      assert(contextData.task.title, 'Context should include task title');
    });
  });
});

// If running directly (not through a test runner)
if (require.main === module) {
  console.log('Running Claude integration tests...');
  
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
  
  // Run basic template verification
  runTest('Verify Claude templates exist', () => {
    assert(verifyClaudeTemplates());
  });
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
} 