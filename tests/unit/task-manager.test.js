/**
 * Unit Tests for Task Manager Module
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');

// Module to test
const taskManager = require('../../lib/core/task-manager');

describe('Task Manager', () => {
  // Setup temp task path for tests
  const tempDir = path.join(__dirname, '../temp');
  const tasksPath = path.join(tempDir, 'tasks.json');
  
  let fsReadStub;
  let fsWriteStub;
  let fsExistsStub;
  
  beforeEach(() => {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Initialize the task path
    taskManager.initPaths(path.join(__dirname, '../..'));
    
    // Setup stubs
    fsReadStub = sinon.stub(fs, 'readFileSync');
    fsWriteStub = sinon.stub(fs, 'writeFileSync');
    fsExistsStub = sinon.stub(fs, 'existsSync');
    
    // Default stub responses
    fsExistsStub.returns(true);
  });
  
  afterEach(() => {
    // Restore stubs
    sinon.restore();
  });
  
  describe('loadTasks', () => {
    it('should load tasks from file when it exists', () => {
      // Mock tasks data
      const mockTasks = {
        lastId: 2,
        tasks: [
          { id: 1, title: 'Task 1', status: 'todo' },
          { id: 2, title: 'Task 2', status: 'done' }
        ]
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const loadedTasks = taskManager.loadTasks();
      
      assert.deepStrictEqual(loadedTasks, mockTasks, 'Should load tasks from file');
      sinon.assert.calledOnce(fsReadStub);
    });
    
    it('should return empty tasks object if file not found', () => {
      // Setup stub to throw error (file not found)
      fsExistsStub.returns(false);
      
      const loadedTasks = taskManager.loadTasks();
      
      assert.deepStrictEqual(loadedTasks, { lastId: 0, tasks: [] }, 'Should return empty tasks object');
    });
    
    it('should return empty tasks object if file contains invalid JSON', () => {
      // Setup stub to return invalid JSON
      fsReadStub.returns('invalid json');
      
      const loadedTasks = taskManager.loadTasks();
      
      assert.deepStrictEqual(loadedTasks, { lastId: 0, tasks: [] }, 'Should return empty tasks object');
    });
  });
  
  describe('saveTasks', () => {
    it('should save tasks to file', () => {
      const tasks = { 
        lastId: 1, 
        tasks: [{ id: 1, title: 'Test task' }] 
      };
      
      taskManager.saveTasks(tasks);
      
      sinon.assert.calledOnce(fsWriteStub);
      sinon.assert.calledWith(fsWriteStub, sinon.match.any, JSON.stringify(tasks, null, 2));
    });
    
    it('should handle errors when saving tasks', () => {
      // Setup stub to throw error
      fsWriteStub.throws(new Error('Write error'));
      
      const tasks = { lastId: 1, tasks: [] };
      
      // Wrap in try/catch because we expect an error
      try {
        taskManager.saveTasks(tasks);
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Error saving tasks: Write error');
      }
    });
  });
  
  describe('getTaskById', () => {
    it('should return task when found', () => {
      // Mock tasks data
      const mockTasks = {
        lastId: 2,
        tasks: [
          { id: 1, title: 'Task 1' },
          { id: 2, title: 'Task 2' }
        ]
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const task = taskManager.getTaskById(2);
      
      assert.deepStrictEqual(task, mockTasks.tasks[1], 'Should return the correct task');
    });
    
    it('should return null when task not found', () => {
      // Mock tasks data
      const mockTasks = {
        lastId: 1,
        tasks: [{ id: 1, title: 'Task 1' }]
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const task = taskManager.getTaskById(2);
      
      assert.strictEqual(task, null, 'Should return null for non-existent task');
    });
  });
  
  describe('createTask', () => {
    it('should create and save a new task', () => {
      // Mock tasks data
      const mockTasks = {
        lastId: 1,
        tasks: [{ id: 1, title: 'Task 1' }]
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const taskData = {
        title: 'New Task',
        status: 'todo',
        category: 'feature'
      };
      
      const result = taskManager.createTask(taskData);
      
      assert.strictEqual(result.success, true, 'Should return success');
      assert.strictEqual(typeof result.task, 'object', 'Should return task object');
      assert.strictEqual(result.task.id, 2, 'Should increment lastId');
      assert.strictEqual(result.task.title, 'New Task', 'Should set task title');
      assert.strictEqual(result.task.status, 'todo', 'Should set task status');
      assert.strictEqual(result.task.category, 'feature', 'Should set task category');
      
      // Check if saveTasks was called
      sinon.assert.calledOnce(fsWriteStub);
    });
    
    it('should validate required fields', () => {
      // Task without title
      const taskData = {
        status: 'todo',
        category: 'feature'
      };
      
      const result = taskManager.createTask(taskData);
      
      assert.strictEqual(result.success, false, 'Should return failure');
      assert.strictEqual(result.error, 'Title is required', 'Should return error message');
    });
  });
  
  describe('updateTask', () => {
    it('should update an existing task', () => {
      // Mock tasks data
      const mockTasks = {
        lastId: 1,
        tasks: [{ 
          id: 1, 
          title: 'Task 1', 
          status: 'todo',
          description: '',
          category: 'feature'
        }]
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const result = taskManager.updateTask(1, {
        status: 'done',
        description: 'Updated description'
      });
      
      assert.strictEqual(result.success, true, 'Should return success');
      assert.strictEqual(result.task.status, 'done', 'Should update task status');
      assert.strictEqual(result.task.description, 'Updated description', 'Should update task description');
      assert.strictEqual(result.task.title, 'Task 1', 'Should preserve existing fields');
      
      // Check if saveTasks was called
      sinon.assert.calledOnce(fsWriteStub);
    });
    
    it('should fail for non-existent task', () => {
      // Mock empty tasks data
      const mockTasks = {
        lastId: 0,
        tasks: []
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const result = taskManager.updateTask(1, { status: 'done' });
      
      assert.strictEqual(result.success, false, 'Should return failure');
      assert.strictEqual(result.error, 'Task not found', 'Should return error message');
    });
  });
  
  describe('deleteTask', () => {
    it('should delete an existing task', () => {
      // Mock tasks data
      const mockTasks = {
        lastId: 2,
        tasks: [
          { id: 1, title: 'Task 1' },
          { id: 2, title: 'Task 2' }
        ]
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const result = taskManager.deleteTask(1);
      
      assert.strictEqual(result.success, true, 'Should return success');
      
      // Check if saveTasks was called with updated tasks
      sinon.assert.calledOnce(fsWriteStub);
      const savedArg = JSON.parse(fsWriteStub.firstCall.args[1]);
      assert.strictEqual(savedArg.tasks.length, 1, 'Should have one task remaining');
      assert.strictEqual(savedArg.tasks[0].id, 2, 'Should keep the other task');
    });
    
    it('should fail for non-existent task', () => {
      // Mock empty tasks data
      const mockTasks = {
        lastId: 0,
        tasks: []
      };
      
      // Setup stub to return mock tasks
      fsReadStub.returns(JSON.stringify(mockTasks));
      
      const result = taskManager.deleteTask(1);
      
      assert.strictEqual(result.success, false, 'Should return failure');
      assert.strictEqual(result.error, 'Task not found', 'Should return error message');
    });
  });
}); 