/**
 * Integration Tests for Command Registry
 * 
 * Tests the command registry functionality including aliases and error handling
 */

const assert = require('assert');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const sinon = require('sinon');

// Modules to test
const commandRegistry = require('../../lib/commands/index');
const help = require('../../lib/commands/help');

describe('Command Registry Integration', () => {
  // Track spies/stubs to restore
  const sandbox = sinon.createSandbox();
  
  before(() => {
    // Initialize paths for command registry
    commandRegistry.initCommandPaths(path.join(__dirname, '../..'));
    
    // Stub console to keep test output clean
    sandbox.stub(console, 'log');
    sandbox.stub(console, 'error');
  });
  
  after(() => {
    // Restore all spies/stubs
    sandbox.restore();
  });
  
  describe('Command Registration', () => {
    it('should register all core commands', () => {
      // Check essential commands
      assert.ok(commandRegistry.commands.init, 'init command should be registered');
      assert.ok(commandRegistry.commands.add, 'add command should be registered');
      assert.ok(commandRegistry.commands.list, 'list command should be registered');
      assert.ok(commandRegistry.commands.update, 'update command should be registered');
      assert.ok(commandRegistry.commands.view, 'view command should be registered');
      assert.ok(commandRegistry.commands.help, 'help command should be registered');
      assert.ok(commandRegistry.commands.changes, 'changes command should be registered');
      assert.ok(commandRegistry.commands.verify, 'verify command should be registered');
      assert.ok(commandRegistry.commands.stats, 'stats command should be registered');
    });
    
    it('should register all commands with proper structure', () => {
      // Count commands with proper metadata
      const validCommands = Object.values(commandRegistry.commands)
        .filter(cmd => cmd.description && (cmd.handler || cmd.alias));
      
      // Should have at least 10 valid commands
      assert.ok(validCommands.length >= 10, 'Should have at least 10 valid commands');
      
      // All commands should have descriptions
      const allHaveDescriptions = Object.values(commandRegistry.commands)
        .every(cmd => typeof cmd.description === 'string');
      assert.strictEqual(allHaveDescriptions, true, 'All commands should have descriptions');
    });
  });
  
  describe('Command Aliases', () => {
    it('should resolve aliases to their target commands', () => {
      // Check some common aliases
      assert.strictEqual(
        commandRegistry.getCommand('ls'),
        commandRegistry.getCommand('list'),
        'ls should alias to list command'
      );
      
      assert.strictEqual(
        commandRegistry.getCommand('status'),
        commandRegistry.getCommand('list'),
        'status should alias to list command'
      );
      
      assert.strictEqual(
        commandRegistry.getCommand('files'),
        commandRegistry.getCommand('changes'),
        'files should alias to changes command'
      );
    });
    
    it('should handle multi-level aliases gracefully', () => {
      // Create a test multi-level alias
      const originalCommand = commandRegistry.commands.list;
      
      // Create a fake chain of aliases for testing
      commandRegistry.commands.testAlias1 = { alias: 'testAlias2', description: 'Test alias 1' };
      commandRegistry.commands.testAlias2 = { alias: 'list', description: 'Test alias 2' };
      
      try {
        // Should resolve through the chain
        assert.strictEqual(
          commandRegistry.getCommand('testAlias1'),
          originalCommand.handler,
          'Should resolve multi-level aliases'
        );
      } finally {
        // Clean up the test aliases
        delete commandRegistry.commands.testAlias1;
        delete commandRegistry.commands.testAlias2;
      }
    });
  });
  
  describe('Command Execution', () => {
    it('should return non-existent for unknown commands', () => {
      // Get a non-existent command
      const nonExistentCommand = commandRegistry.getCommand('non-existent-command');
      
      // Should be null
      assert.strictEqual(nonExistentCommand, null, 'Non-existent command should return null');
    });
    
    it('should handle empty or undefined command names', () => {
      // Null command should return null
      const nullCommand = commandRegistry.getCommand(null);
      assert.strictEqual(nullCommand, null, 'Null command should return null');
      
      // Undefined command should return null
      const undefinedCommand = commandRegistry.getCommand(undefined);
      assert.strictEqual(undefinedCommand, null, 'Undefined command should return null');
      
      // Empty string command should return null
      const emptyCommand = commandRegistry.getCommand('');
      assert.strictEqual(emptyCommand, null, 'Empty command should return null');
    });
  });
  
  describe('Help Integration', () => {
    let helpShowHelpSpy;
    
    before(() => {
      // Spy on the help.showHelp method
      helpShowHelpSpy = sandbox.spy(help, 'showHelp');
    });
    
    it('should show general help when no specific command is provided', () => {
      // Call help with no specific command
      help.showHelp(null, {});
      
      // Should be called once
      assert.strictEqual(helpShowHelpSpy.callCount, 1, 'help.showHelp should be called once');
      
      // The first argument should be null
      assert.strictEqual(helpShowHelpSpy.firstCall.args[0], null, 'First argument should be null');
    });
    
    it('should show specific command help when command is provided', () => {
      // Reset the spy
      helpShowHelpSpy.resetHistory();
      
      // Call help with a specific command
      help.showHelp('list', {});
      
      // Should be called once
      assert.strictEqual(helpShowHelpSpy.callCount, 1, 'help.showHelp should be called once');
      
      // The first argument should be the command name
      assert.strictEqual(helpShowHelpSpy.firstCall.args[0], 'list', 'First argument should be "list"');
    });
    
    it('should handle non-existent command gracefully', () => {
      // Reset the spy
      helpShowHelpSpy.resetHistory();
      
      // Call help with a non-existent command
      help.showHelp('non-existent-command', {});
      
      // Should be called once
      assert.strictEqual(helpShowHelpSpy.callCount, 1, 'help.showHelp should be called once');
      
      // First argument should be the non-existent command
      assert.strictEqual(
        helpShowHelpSpy.firstCall.args[0], 
        'non-existent-command', 
        'Should accept non-existent command name'
      );
    });
  });
  
  describe('Performance Considerations', () => {
    it('should efficiently look up commands', () => {
      // Time command lookups
      const startTime = process.hrtime();
      
      // Perform many lookups (simulating high usage)
      for (let i = 0; i < 1000; i++) {
        commandRegistry.getCommand('list');
        commandRegistry.getCommand('add');
        commandRegistry.getCommand('view');
        commandRegistry.getCommand('non-existent-command');
      }
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      
      // 1000 lookups should be fast (< 100ms)
      assert.ok(totalTimeMs < 500, `Command lookups should be efficient (took ${totalTimeMs.toFixed(2)}ms)`);
    });
  });
}); 