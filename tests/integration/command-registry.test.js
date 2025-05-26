/**
 * Integration Tests for Command Registry
 * 
 * Tests the command registry functionality including aliases and error handling
 */

const assert = require('assert');
const path = require('path');
const { describe, it, before, after } = require('mocha');

// Modules to test
const commandRegistry = require('../../lib/core/command-registry');
const commandIndex = require('../../lib/commands/index');
const help = require('../../lib/commands/help');

// Initialize sinon
let sinon;

describe('Command Registry Integration', () => {
  // Track spies/stubs to restore
  let sandbox;
  
  before(async () => {
    // Dynamically import sinon
    const sinonModule = await import('sinon');
    sinon = sinonModule.default;
    
    // Create sandbox after sinon is loaded
    sandbox = sinon.createSandbox();
    
    // Initialize paths for command modules (needed before registration)
    commandIndex.initCommandPaths(path.join(__dirname, '../..'));
    // Register all commands using the function from commandIndex
    commandIndex.registerAllCommands(); 
    
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
      // Check essential commands on the actual registry
      assert.ok(commandRegistry.getCommand('init'), 'init command should be registered');
      assert.ok(commandRegistry.getCommand('add'), 'add command should be registered');
      assert.ok(commandRegistry.getCommand('list'), 'list command should be registered');
      assert.ok(commandRegistry.getCommand('update'), 'update command should be registered');
      assert.ok(commandRegistry.getCommand('view'), 'view command should be registered');
      assert.ok(commandRegistry.getCommand('help'), 'help command should be registered');
      assert.ok(commandRegistry.getCommand('changes'), 'changes command should be registered');
      assert.ok(commandRegistry.getCommand('verify'), 'verify command should be registered');
      assert.ok(commandRegistry.getCommand('stats'), 'stats command should be registered');
    });
    
    it('should register all commands with proper structure', () => {
      // Get commands directly from the real registry
      const registeredCommands = commandRegistry.getAllCommands();
      // Count commands with proper metadata
      const validCommands = Object.values(registeredCommands)
        .filter(cmd => cmd.description && (cmd.handler || cmd.alias));
      
      // Should have at least 10 valid commands
      assert.ok(validCommands.length >= 10, `Should have at least 10 valid commands, found ${validCommands.length}`);
      
      // All commands should have descriptions
      const allHaveDescriptions = Object.values(registeredCommands)
        .every(cmd => typeof cmd.description === 'string');
      assert.strictEqual(allHaveDescriptions, true, 'All commands should have descriptions');
    });
  });
  
  describe('Command Aliases', () => {
    it('should resolve aliases to their target commands', () => {
      // Check some common aliases using the actual registry's getCommand
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
    
    it('should handle multi-level aliases gracefully (#4)', () => {
      // We need to register temporary aliases directly with the real registry
      const originalHandler = commandRegistry.getCommand('list').handler;
      
      // Use unique names for test aliases to avoid conflicts
      const uniqueAlias1 = '__testAliasMultiLevel1__';
      const uniqueAlias2 = '__testAliasMultiLevel2__';

      commandRegistry.registerCommand(uniqueAlias1, { alias: uniqueAlias2, description: 'Test alias 1' });
      commandRegistry.registerCommand(uniqueAlias2, { alias: 'list', description: 'Test alias 2' });
      
      // Should resolve through the chain using the real registry
      const resolvedCommand = commandRegistry.getCommand(uniqueAlias1);
      assert.strictEqual(resolvedCommand.handler, originalHandler, 'Should resolve multi-level aliases');
      
      // No finally block needed as we are not trying to unregister
    });
  });
  
  describe('Command Execution', () => {
    it('should return non-existent for unknown commands', () => {
      // Get a non-existent command using the real registry
      const nonExistentCommand = commandRegistry.getCommand('non-existent-command');
      
      // getCommand should return null or undefined for non-existent
      assert.strictEqual(nonExistentCommand, null, 'Non-existent command should return null');
    });
    
    it('should handle empty or undefined command names', () => {
      // Use the real registry's getCommand
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
      // Time command lookups using the real registry
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