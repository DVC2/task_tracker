/**
 * Integration Tests for Command Execution Flow
 * 
 * Tests the full command execution pipeline from registry to handlers
 */

const assert = require('assert');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const sinon = require('sinon');

// Modules to test
const commandRegistry = require('../../lib/commands/index');
const help = require('../../lib/commands/help');
const configManager = require('../../lib/core/config-manager');
const taskManager = require('../../lib/core/task-manager');

describe('Command Execution Integration', () => {
  // Track spies/stubs to restore
  const sandbox = sinon.createSandbox();
  
  // Setup spies
  let helpShowHelpSpy;
  let taskListTasksSpy;
  let taskCreateTaskSpy;
  
  before(() => {
    // Initialize paths for modules
    commandRegistry.initCommandPaths(path.join(__dirname, '../..'));
    
    // Setup spies on command modules
    helpShowHelpSpy = sandbox.spy(help, 'showHelp');
    
    // Stub any file operations to prevent side effects
    sandbox.stub(configManager, 'saveConfig').returns();
    sandbox.stub(taskManager, 'saveTasks').returns();
    
    // Stub task operations but allow execution
    taskListTasksSpy = sandbox.spy(taskManager, 'loadTasks');
    taskCreateTaskSpy = sandbox.spy(taskManager, 'createTask');
    
    // Stub any output to keep test output clean
    sandbox.stub(console, 'log');
  });
  
  after(() => {
    // Restore all spies/stubs
    sandbox.restore();
  });
  
  describe('Command Registry', () => {
    it('should register core commands', () => {
      // Check a few important commands
      assert.ok(commandRegistry.commands.init, 'init command should be registered');
      assert.ok(commandRegistry.commands.list, 'list command should be registered');
      assert.ok(commandRegistry.commands.add, 'add command should be registered');
      assert.ok(commandRegistry.commands.help, 'help command should be registered');
    });
    
    it('should have handlers for registered commands', () => {
      // Check a few important command handlers
      assert.strictEqual(typeof commandRegistry.commands.help.handler, 'function', 'help command should have handler');
      assert.strictEqual(typeof commandRegistry.commands.list.handler, 'function', 'list command should have handler');
    });
    
    it('should resolve command aliases', () => {
      // Test a few common aliases
      assert.strictEqual(
        commandRegistry.getCommand('help'),
        commandRegistry.commands.help.handler,
        'help command should resolve directly'
      );
      
      assert.strictEqual(
        commandRegistry.getCommand('ls'),
        commandRegistry.commands.list.handler,
        'ls alias should resolve to list handler'
      );
    });
  });
  
  describe('Command Execution', () => {
    it('should execute help command', () => {
      // Get the help command handler and execute it
      const helpHandler = commandRegistry.getCommand('help');
      helpHandler();
      
      // Check if the help function was called
      assert.strictEqual(helpShowHelpSpy.callCount, 1, 'help.showHelp should be called');
    });
    
    it('should pass arguments to commands', () => {
      // Mock list command options
      const options = { json: true };
      
      // Get the list command handler and execute it with status filter
      const listHandler = commandRegistry.getCommand('list');
      listHandler('todo', options);
      
      // Check if task loading function was called
      assert.strictEqual(taskListTasksSpy.callCount, 1, 'taskManager.loadTasks should be called');
    });
    
    it('should handle command errors gracefully', () => {
      // Create a stub for console.error to check error messages
      const errorStub = sandbox.stub(console, 'error');
      
      // Get the add command handler and try to execute it with invalid data (missing title)
      const addHandler = commandRegistry.getCommand('add');
      
      // Execute with empty data (should fail validation)
      const result = addHandler({}, { nonInteractive: true });
      
      // Should return failure object
      assert.strictEqual(result.success, false, 'Failed command should return success: false');
      assert.ok(result.error, 'Failed command should have error property');
    });
  });
}); 