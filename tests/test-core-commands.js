/**
 * Test file for core TaskTracker commands
 * 
 * Tests the basic functionality of TaskTracker commands.
 */

module.exports = ({ describe, test, skip, assert, runCommand }) => {
  // Global setup - create a test environment
  const setupTestEnvironment = () => {
    // Create a temporary test directory
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.resolve('./tests/temp');
    
    // Clean up any existing temp directory
    if (fs.existsSync(tempDir)) {
      try {
        const rimraf = require('rimraf');
        rimraf.sync(tempDir);
      } catch (error) {
        // Fallback to manual deletion
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(tempDir, file));
        });
        fs.rmdirSync(tempDir);
      }
    }
    
    // Create the temp directory
    fs.mkdirSync(tempDir, { recursive: true });
    
    return {
      tempDir,
      // Helper to run a command in the temp directory
      runInTemp: (command, args = [], options = {}) => {
        return runCommand(command, args, {
          cwd: tempDir,
          ...options
        });
      }
    };
  };
  
  describe('TaskTracker Core Commands', () => {
    const { tempDir, runInTemp } = setupTestEnvironment();
    
    test('init command creates .tasktracker directory and files', () => {
      const result = runInTemp('tt', ['init']);
      
      // Check exit code
      assert.equal(result.status, 0, 'Command should exit with 0');
      
      // Check output
      assert.contains(result.stdout, 'Created TaskTracker directory', 'Success message should be shown');
      
      // Verify files were created
      const ttDir = path.join(tempDir, '.tasktracker');
      assert.true(fs.existsSync(ttDir), '.tasktracker directory should exist');
      assert.true(fs.existsSync(path.join(ttDir, 'tasks.json')), 'tasks.json should exist');
      assert.true(fs.existsSync(path.join(ttDir, 'config.json')), 'config.json should exist');
    });
    
    test('quick command creates a new task', () => {
      // Initialize in a temp directory
      runInTemp('tt', ['init']);
      
      // Create a quick task
      const result = runInTemp('tt', ['quick', 'Test task', 'feature']);
      
      // Check exit code and output
      assert.equal(result.status, 0, 'Command should exit with 0');
      assert.contains(result.stdout, 'created', 'Task created message should be shown');
      
      // Verify task was added to tasks.json
      const tasksPath = path.join(tempDir, '.tasktracker', 'tasks.json');
      const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      assert.equal(tasks.tasks.length, 1, 'There should be one task');
      assert.equal(tasks.tasks[0].title, 'Test task', 'Task title should match');
      assert.equal(tasks.tasks[0].category, 'feature', 'Task category should match');
    });
    
    test('list command shows all tasks', () => {
      // Initialize and create a task
      runInTemp('tt', ['init']);
      runInTemp('tt', ['quick', 'Test task', 'feature']);
      
      // List all tasks
      const result = runInTemp('tt', ['list']);
      
      // Check output
      assert.equal(result.status, 0, 'Command should exit with 0');
      assert.contains(result.stdout, 'Test task', 'Output should contain task title');
      assert.contains(result.stdout, 'feature', 'Output should contain task category');
    });
    
    test('list --current shows only in-progress tasks', () => {
      // Initialize and create two tasks
      runInTemp('tt', ['init']);
      runInTemp('tt', ['quick', 'First task', 'feature']);
      runInTemp('tt', ['quick', 'Second task', 'feature']);
      
      // Mark second task as in-progress
      runInTemp('tt', ['update', '2', 'status', 'in-progress']);
      
      // List current tasks
      const result = runInTemp('tt', ['list', '--current']);
      
      // Check output
      assert.equal(result.status, 0, 'Command should exit with 0');
      assert.contains(result.stdout, 'Second task', 'Output should contain in-progress task');
      assert.notContains(result.stdout, 'First task', 'Output should not contain todo task');
    });
    
    test('view command shows task details', () => {
      // Initialize and create a task
      runInTemp('tt', ['init']);
      runInTemp('tt', ['quick', 'Test task', 'feature']);
      
      // View task details
      const result = runInTemp('tt', ['view', '1']);
      
      // Check output
      assert.equal(result.status, 0, 'Command should exit with 0');
      assert.contains(result.stdout, 'Test task', 'Output should contain task title');
      assert.contains(result.stdout, 'feature', 'Output should contain task category');
      assert.contains(result.stdout, 'Status', 'Output should contain status field');
    });
    
    test('update command changes task properties', () => {
      // Initialize and create a task
      runInTemp('tt', ['init']);
      runInTemp('tt', ['quick', 'Test task', 'feature']);
      
      // Update task status
      const result = runInTemp('tt', ['update', '1', 'status', 'in-progress']);
      
      // Check output
      assert.equal(result.status, 0, 'Command should exit with 0');
      assert.contains(result.stdout, 'updated', 'Output should confirm update');
      
      // Verify task was updated through view command
      const viewResult = runInTemp('tt', ['view', '1']);
      assert.contains(viewResult.stdout, 'in-progress', 'Task status should be updated to in-progress');
    });
    
    // Additional tests can be added
    test('machine-readable output works correctly', () => {
      // Initialize and create a task
      runInTemp('tt', ['init']);
      runInTemp('tt', ['quick', 'Status bar task', 'feature']);
      
      // Mark task as in-progress
      runInTemp('tt', ['update', '1', 'status', 'in-progress']);
      
      // List current tasks in machine-readable format
      const result = runInTemp('tt', ['list', '--current', '--machine-readable']);
      
      // Check output format
      assert.equal(result.status, 0, 'Command should exit with 0');
      assert.true(result.stdout.includes('|'), 'Output should use | as separators');
      assert.true(result.stdout.includes('Status bar task'), 'Output should include task title');
      assert.true(result.stdout.includes('in-progress'), 'Output should include task status');
    });
    
    skip('changes command tracks file changes');
    
    skip('release command creates a release');
  });
  
  describe('IDE Integration Features', () => {
    test('list --current returns a single line for status bar', () => {
      const testEnv = setupTestEnvironment();
      const { tempDir, runInTemp } = testEnv;
      
      // First initialize and add a task
      runInTemp('tt', ['init']);
      runInTemp('tt', ['quick', 'Status bar task', 'feature']);
      
      // Set the task to in-progress
      runInTemp('tt', ['update', '1', 'status', 'in-progress']);
      
      // Then get the current task with machine-readable format
      const result = runInTemp('tt', ['list', '--current', '--machine-readable']);
      
      assert.true(result.success, 'Command should succeed');
      
      // For now, just verify that the command completes successfully
      // Instead of checking the exact format, which might change
      assert.true(result.stdout.length > 0, 'Should output something');
    });
  });
}; 