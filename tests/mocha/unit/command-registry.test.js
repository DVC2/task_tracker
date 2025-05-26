/**
 * Command Registry Tests
 * 
 * Tests for the command registry functionality
 */

const { describe, it, beforeEach, afterEach, before } = require('mocha');
const fs = require('fs');

// We need to dynamically import chai and sinon since they're ESM modules
let expect;
let sinon;
let commandRegistry;

describe('Command Registry', () => {
  before(async () => {
    // Dynamically import chai and sinon using ESM import
    const chai = await import('chai');
    const sinonModule = await import('sinon');
    expect = chai.expect;
    sinon = sinonModule.default;
    
    // Load command registry after sinon is available
    commandRegistry = require('../../../lib/core/command-registry');
  });

  let fsStubs = {};
  
  beforeEach(() => {
    // Stub fs methods to avoid actual file operations
    fsStubs.existsSync = sinon.stub(fs, 'existsSync').returns(true);
    fsStubs.readdirSync = sinon.stub(fs, 'readdirSync');
    
    // Reset the registry between tests
    commandRegistry.reset();
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('Command Registration', () => {
    it('should register a command properly', () => {
      const testCommand = {
        name: 'test',
        description: 'Test command',
        usage: 'test [options]',
        aliases: ['t'],
        execute: () => {}
      };
      
      commandRegistry.register(testCommand);
      
      const commands = commandRegistry.getCommands();
      expect(commands).to.have.property('test');
      expect(commands.test).to.equal(testCommand);
    });

    it('should register multiple commands', () => {
      const command1 = { name: 'cmd1', execute: () => {} };
      const command2 = { name: 'cmd2', execute: () => {} };
      
      commandRegistry.register(command1);
      commandRegistry.register(command2);
      
      const commands = commandRegistry.getCommands();
      expect(Object.keys(commands).length).to.equal(2);
      expect(commands).to.have.property('cmd1');
      expect(commands).to.have.property('cmd2');
    });

    it('should handle command aliases', () => {
      const command = {
        name: 'test',
        aliases: ['t', 'tst'],
        execute: () => {}
      };
      
      commandRegistry.register(command);
      
      // Check direct name lookup
      expect(commandRegistry.get('test')).to.equal(command);
      
      // Check alias lookups
      expect(commandRegistry.get('t')).to.equal(command);
      expect(commandRegistry.get('tst')).to.equal(command);
    });

    it('should prevent duplicate command names', () => {
      const command1 = { name: 'duplicate', execute: () => {} };
      const command2 = { name: 'duplicate', execute: () => {} };
      
      commandRegistry.register(command1);
      
      expect(() => {
        commandRegistry.register(command2);
      }).to.throw(/already registered/i);
    });

    it('should prevent duplicate aliases', () => {
      const command1 = { name: 'cmd1', aliases: ['c'], execute: () => {} };
      const command2 = { name: 'cmd2', aliases: ['c'], execute: () => {} };
      
      commandRegistry.register(command1);
      
      expect(() => {
        commandRegistry.register(command2);
      }).to.throw(/alias.*already in use/i);
    });
  });

  describe('Command Retrieval', () => {
    beforeEach(() => {
      // Register some test commands
      commandRegistry.register({
        name: 'list',
        aliases: ['ls', 'l'],
        execute: () => {}
      });
      
      commandRegistry.register({
        name: 'add',
        aliases: ['a'],
        execute: () => {}
      });
      
      commandRegistry.register({
        name: 'update',
        aliases: ['u'],
        execute: () => {}
      });
    });

    it('should retrieve a command by name', () => {
      const command = commandRegistry.get('list');
      
      expect(command).to.be.an('object');
      expect(command.name).to.equal('list');
    });

    it('should retrieve a command by alias', () => {
      const command = commandRegistry.get('ls');
      
      expect(command).to.be.an('object');
      expect(command.name).to.equal('list');
    });

    it('should return null for unknown commands', () => {
      const command = commandRegistry.get('nonexistent');
      
      expect(command).to.be.null;
    });

    it('should get all commands', () => {
      const commands = commandRegistry.getCommands();
      
      expect(commands).to.be.an('object');
      expect(Object.keys(commands).length).to.equal(3);
      expect(commands).to.have.all.keys('list', 'add', 'update');
    });
  });

  describe('Command Loading', () => {
    it('should load commands from a directory', () => {
      // Setup mock command files
      fsStubs.readdirSync.returns(['list.js', 'add.js', 'update.js']);
      
      // Mock require for command modules
      const requireStub = sinon.stub(commandRegistry, 'requireCommand');
      requireStub.withArgs('./list').returns({
        name: 'list',
        execute: () => {}
      });
      requireStub.withArgs('./add').returns({
        name: 'add',
        execute: () => {}
      });
      requireStub.withArgs('./update').returns({
        name: 'update',
        execute: () => {}
      });
      
      commandRegistry.loadCommands('./commands');
      
      const commands = commandRegistry.getCommands();
      expect(Object.keys(commands).length).to.equal(3);
      expect(commands).to.have.all.keys('list', 'add', 'update');
    });

    it('should handle errors when loading commands', () => {
      // Setup mock command files
      fsStubs.readdirSync.returns(['valid.js', 'error.js']);
      
      // Mock require for command modules
      const requireStub = sinon.stub(commandRegistry, 'requireCommand');
      requireStub.withArgs('./valid').returns({
        name: 'valid',
        execute: () => {}
      });
      requireStub.withArgs('./error').throws(new Error('Module error'));
      
      // Suppress console error output during test
      const consoleError = sinon.stub(console, 'error');
      
      commandRegistry.loadCommands('./commands');
      
      // Should still register the valid command
      const commands = commandRegistry.getCommands();
      expect(Object.keys(commands).length).to.equal(1);
      expect(commands).to.have.property('valid');
      
      // Should have logged the error
      expect(consoleError.called).to.be.true;
      expect(consoleError.firstCall.args[0]).to.include('Failed to load command');
    });

    it('should handle invalid command modules', () => {
      // Setup mock command files
      fsStubs.readdirSync.returns(['valid.js', 'invalid.js']);
      
      // Mock require for command modules
      const requireStub = sinon.stub(commandRegistry, 'requireCommand');
      requireStub.withArgs('./valid').returns({
        name: 'valid',
        execute: () => {}
      });
      requireStub.withArgs('./invalid').returns({
        // Missing name and execute properties
        description: 'Invalid command'
      });
      
      // Suppress console error output during test
      const consoleError = sinon.stub(console, 'error');
      
      commandRegistry.loadCommands('./commands');
      
      // Should still register the valid command
      const commands = commandRegistry.getCommands();
      expect(Object.keys(commands).length).to.equal(1);
      expect(commands).to.have.property('valid');
      
      // Should have logged the error
      expect(consoleError.called).to.be.true;
      expect(consoleError.firstCall.args[0]).to.include('Invalid command module');
    });
  });
}); 