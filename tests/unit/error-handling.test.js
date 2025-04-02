/**
 * Error Handling and Edge Case Tests
 * 
 * Tests for proper error handling in core modules
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');

// Modules to test
const taskManager = require('../../lib/core/task-manager');
const configManager = require('../../lib/core/config-manager');
const formatting = require('../../lib/core/formatting');

describe('Error Handling', () => {
  let fsReadStub;
  let fsWriteStub;
  let fsExistsStub;
  let consoleErrorStub;
  let consoleLogStub;
  
  beforeEach(() => {
    // Initialize paths
    taskManager.initPaths(path.join(__dirname, '../..'));
    configManager.initPaths(path.join(__dirname, '../..'));
    
    // Setup stubs
    fsReadStub = sinon.stub(fs, 'readFileSync');
    fsWriteStub = sinon.stub(fs, 'writeFileSync');
    fsExistsStub = sinon.stub(fs, 'existsSync');
    consoleErrorStub = sinon.stub(console, 'error');
    consoleLogStub = sinon.stub(console, 'log');
    
    // Default stub responses
    fsExistsStub.returns(true);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('Task Manager', () => {
    it('should handle corrupt task data gracefully', () => {
      // Setup corrupt data
      fsReadStub.returns('{ "lastId": 2, "tasks": [{"id": 1, "title": "Task 1"}, THIS IS CORRUPT DATA]}');
      
      // Should not throw exception
      const tasks = taskManager.loadTasks();
      
      // Should return default empty tasks
      assert.deepStrictEqual(tasks, { lastId: 0, tasks: [] }, 'Should return empty tasks on corrupt data');
    });
    
    it('should handle file system permission errors', () => {
      // Setup permission error
      const permissionError = new Error('EACCES: permission denied');
      permissionError.code = 'EACCES';
      fsWriteStub.throws(permissionError);
      
      // Should throw error
      assert.throws(() => {
        taskManager.saveTasks({ lastId: 1, tasks: [] });
      }, /permission denied/, 'Should throw permission error');
    });
    
    it('should handle null or undefined task properties', () => {
      // Create a task with missing properties
      const result = taskManager.createTask({
        title: 'Task with missing properties',
        // status is missing
        // category is missing
        priority: null,
        effort: undefined,
        description: null
      });
      
      assert.strictEqual(result.success, true, 'Should create task despite missing properties');
      assert.ok(result.task.status, 'Should apply default status');
      assert.ok(result.task.category, 'Should apply default category');
      assert.ok(result.task.priority, 'Should apply default priority');
      assert.ok(result.task.effort, 'Should apply default effort');
      assert.strictEqual(result.task.description, '', 'Should set empty string for null description');
    });
    
    it('should prevent creating a task with an empty title', () => {
      // Test with empty title
      const result1 = taskManager.createTask({ title: '' });
      assert.strictEqual(result1.success, false, 'Should fail with empty title');
      
      // Test with only whitespace title
      const result2 = taskManager.createTask({ title: '   ' });
      assert.strictEqual(result2.success, false, 'Should fail with whitespace title');
      
      // Test with null title
      const result3 = taskManager.createTask({ title: null });
      assert.strictEqual(result3.success, false, 'Should fail with null title');
    });
    
    it('should handle extremely long titles and descriptions', () => {
      // Create a very long title (1000 chars)
      const longTitle = 'A'.repeat(1000);
      const longDescription = 'B'.repeat(10000);
      
      const result = taskManager.createTask({
        title: longTitle,
        description: longDescription
      });
      
      assert.strictEqual(result.success, true, 'Should accept long title and description');
      assert.strictEqual(result.task.title, longTitle, 'Should store full title');
      assert.strictEqual(result.task.description, longDescription, 'Should store full description');
    });
  });
  
  describe('Config Manager', () => {
    it('should handle corrupt config data gracefully', () => {
      // Setup corrupt data
      fsReadStub.returns('{ "taskCategories": ["feature", "bug"], THIS IS CORRUPT DATA}');
      
      // Should not throw exception
      const config = configManager.loadConfig();
      
      // Should return default config
      assert.deepStrictEqual(config, configManager.getDefaultConfig(), 'Should return default config on corrupt data');
    });
    
    it('should prevent adding duplicate categories', () => {
      // Mock existing config
      const mockConfig = {
        taskCategories: ['feature', 'bug', 'docs'],
        taskStatuses: ['todo', 'in-progress', 'done'],
        showChalkWarnings: false
      };
      
      fsReadStub.returns(JSON.stringify(mockConfig));
      
      // Try to add existing category
      const result = configManager.addCategory('bug');
      
      assert.strictEqual(result.success, false, 'Should fail with duplicate category');
      assert.ok(result.error.includes('already exists'), 'Should mention category exists');
    });
    
    it('should prevent removing non-existent categories', () => {
      // Mock existing config
      const mockConfig = {
        taskCategories: ['feature', 'bug', 'docs'],
        taskStatuses: ['todo', 'in-progress', 'done'],
        showChalkWarnings: false
      };
      
      fsReadStub.returns(JSON.stringify(mockConfig));
      
      // Try to remove non-existent category
      const result = configManager.removeCategory('non-existent');
      
      assert.strictEqual(result.success, false, 'Should fail with non-existent category');
      assert.ok(result.error.includes('not found'), 'Should mention category not found');
    });
    
    it('should prevent removing the last category', () => {
      // Mock config with only one category
      const mockConfig = {
        taskCategories: ['feature'],
        taskStatuses: ['todo', 'in-progress', 'done'],
        showChalkWarnings: false
      };
      
      fsReadStub.returns(JSON.stringify(mockConfig));
      
      // Try to remove the last category
      const result = configManager.removeCategory('feature');
      
      assert.strictEqual(result.success, false, 'Should fail when removing last category');
      assert.ok(result.error.includes('last category'), 'Should mention cannot remove last category');
    });
  });
  
  describe('Formatting', () => {
    it('should handle undefined or null input gracefully', () => {
      // Test with undefined
      formatting.output(undefined, 'info', { globalOptions: {} });
      sinon.assert.calledWith(consoleLogStub, sinon.match('undefined'));
      
      // Test with null
      consoleLogStub.resetHistory();
      formatting.output(null, 'info', { globalOptions: {} });
      sinon.assert.calledWith(consoleLogStub, sinon.match('null'));
    });
    
    it('should handle various output types', () => {
      // Test with string
      formatting.output('Test message', 'info', { globalOptions: {} });
      sinon.assert.calledWith(consoleLogStub, sinon.match('Test message'));
      
      // Test with number
      consoleLogStub.resetHistory();
      formatting.output(42, 'info', { globalOptions: {} });
      sinon.assert.calledWith(consoleLogStub, sinon.match('42'));
      
      // Test with object
      consoleLogStub.resetHistory();
      formatting.output({ test: 'value' }, 'info', { globalOptions: {} });
      // In normal mode, objects should be stringified
      sinon.assert.calledOnce(consoleLogStub);
      
      // Test with object in json mode
      consoleLogStub.resetHistory();
      formatting.output({ test: 'value' }, 'data', { globalOptions: { json: true } });
      // In json mode, objects should be sent to JSON.stringify
      sinon.assert.calledOnce(consoleLogStub);
    });
    
    it('should respect --silent flag', () => {
      // With silent flag
      formatting.output('Test message', 'info', { globalOptions: { silent: true } });
      sinon.assert.notCalled(consoleLogStub);
      
      // With no silent flag
      consoleLogStub.resetHistory();
      formatting.output('Test message', 'info', { globalOptions: { silent: false } });
      sinon.assert.calledOnce(consoleLogStub);
    });
  });
}); 