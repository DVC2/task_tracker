/**
 * Test file for core TaskTracker commands
 * 
 * Tests the basic functionality of TaskTracker commands.
 */

module.exports = ({ describe, test, skip, assert, runCommand }) => {
  // Global setup - create a test environment
  const setupTestEnvironment = () => {
    // Create a temporary test directory
    const tempDir = './tests/temp';
    const fs = require('fs');
    const path = require('path');
    
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
      const result = runInTemp('tasktracker', ['init']);
      
      assert.true(result.success, 'Command should succeed');
      assert.contains(result.stdout, 'TaskTracker initialized successfully', 'Success message should be shown');
      
      // Check if the directory was created
      const fs = require('fs');
      const path = require('path');
      
      const ttDir = path.join(tempDir, '.tasktracker');
      assert.true(fs.existsSync(ttDir), '.tasktracker directory should exist');
      
      // Check if config file was created
      const configPath = path.join(ttDir, 'config.json');
      assert.true(fs.existsSync(configPath), 'config.json should exist');
      
      // Check if tasks file was created
      const tasksPath = path.join(ttDir, 'tasks.json');
      assert.true(fs.existsSync(tasksPath), 'tasks.json should exist');
      
      // Verify the config content
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.true(config.hasOwnProperty('projectName'), 'Config should have projectName');
      assert.true(config.hasOwnProperty('versioningType'), 'Config should have versioningType');
      assert.true(config.hasOwnProperty('currentVersion'), 'Config should have currentVersion');
    });
    
    test('quick command adds a task', () => {
      // First initialize
      runInTemp('tasktracker', ['init']);
      
      // Then add a task
      const result = runInTemp('tasktracker', ['quick', 'Test task', 'feature']);
      
      assert.true(result.success, 'Command should succeed');
      assert.contains(result.stdout, 'Created task', 'Success message should be shown');
      
      // Check if the task was added to tasks.json
      const fs = require('fs');
      const path = require('path');
      
      const tasksPath = path.join(tempDir, '.tasktracker', 'tasks.json');
      const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      assert.equal(tasksData.tasks.length, 1, 'Should have 1 task');
      assert.equal(tasksData.tasks[0].title, 'Test task', 'Task title should match');
      assert.equal(tasksData.tasks[0].category, 'feature', 'Task category should match');
    });
    
    test('list command shows tasks', () => {
      // First initialize and add a task
      runInTemp('tasktracker', ['init']);
      runInTemp('tasktracker', ['quick', 'Test task', 'feature']);
      
      // Then list tasks
      const result = runInTemp('tasktracker', ['list']);
      
      assert.true(result.success, 'Command should succeed');
      assert.contains(result.stdout, 'Test task', 'Task title should be shown');
      assert.contains(result.stdout, 'feature', 'Task category should be shown');
    });
    
    test('list --current shows current task', () => {
      // First initialize and add tasks
      runInTemp('tasktracker', ['init']);
      runInTemp('tasktracker', ['quick', 'First task', 'feature']);
      runInTemp('tasktracker', ['quick', 'Second task', 'feature']);
      
      // Set the second task to in-progress
      const fs = require('fs');
      const path = require('path');
      
      const tasksPath = path.join(tempDir, '.tasktracker', 'tasks.json');
      const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      tasksData.tasks[1].status = 'in-progress';
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));
      
      // Then list current task
      const result = runInTemp('tasktracker', ['list', '--current']);
      
      assert.true(result.success, 'Command should succeed');
      assert.contains(result.stdout, 'Second task', 'In-progress task should be shown');
    });
    
    test('view command shows task details', () => {
      // First initialize and add a task
      runInTemp('tasktracker', ['init']);
      runInTemp('tasktracker', ['quick', 'Test task', 'feature']);
      
      // Then view the task
      const result = runInTemp('tasktracker', ['view', '1']);
      
      assert.true(result.success, 'Command should succeed');
      assert.contains(result.stdout, 'Task #1: Test task', 'Task title should be shown');
      assert.contains(result.stdout, 'Status: todo', 'Task status should be shown');
      assert.contains(result.stdout, 'Category: feature', 'Task category should be shown');
    });
    
    test('update command changes task status', () => {
      // First initialize and add a task
      runInTemp('tasktracker', ['init']);
      runInTemp('tasktracker', ['quick', 'Test task', 'feature']);
      
      // Then update the task status
      const result = runInTemp('tasktracker', ['update', '1', 'status', 'in-progress']);
      
      assert.true(result.success, 'Command should succeed');
      assert.contains(result.stdout, 'Task #1 updated successfully', 'Success message should be shown');
      
      // Check if the task status was updated
      const fs = require('fs');
      const path = require('path');
      
      const tasksPath = path.join(tempDir, '.tasktracker', 'tasks.json');
      const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      assert.equal(tasksData.tasks[0].status, 'in-progress', 'Task status should be updated');
    });
    
    skip('changes command tracks file changes');
    
    skip('release command creates a release');
  });
  
  describe('IDE Integration Features', () => {
    test('list --current returns a single line for status bar', () => {
      const { runInTemp } = setupTestEnvironment();
      
      // First initialize and add a task
      runInTemp('tasktracker', ['init']);
      runInTemp('tasktracker', ['quick', 'Status bar task', 'feature']);
      
      // Set the task to in-progress
      const fs = require('fs');
      const path = require('path');
      
      const tasksPath = path.join(tempDir, '.tasktracker', 'tasks.json');
      const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      tasksData.tasks[0].status = 'in-progress';
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));
      
      // Then get the current task
      const result = runInTemp('tasktracker', ['list', '--current']);
      
      assert.true(result.success, 'Command should succeed');
      
      // Split by newlines and check the number of lines
      const lines = result.stdout.trim().split('\n');
      assert.equal(lines.length, 1, 'Should output a single line for status bar');
      assert.contains(lines[0], 'Status bar task', 'Should contain the task title');
    });
  });
}; 