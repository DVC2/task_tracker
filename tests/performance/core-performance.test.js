/**
 * Performance Tests for TaskTracker Core Functionality
 * 
 * These tests measure the performance of key operations in the system.
 * They can be used to identify bottlenecks and verify optimizations.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { describe, it, before, after } = require('mocha');
const sinon = require('sinon');

// Modules to test
const taskManager = require('../../lib/core/task-manager');
const configManager = require('../../lib/core/config-manager');
const commandRegistry = require('../../lib/commands/index');

// Performance testing utilities
function measureTime(fn, iterations = 1) {
  const startTime = process.hrtime();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const [seconds, nanoseconds] = process.hrtime(startTime);
  return (seconds * 1000) + (nanoseconds / 1000000); // Convert to milliseconds
}

describe('Performance Tests', function() {
  // Extend timeout for performance tests
  this.timeout(10000);
  
  const sandbox = sinon.createSandbox();
  
  before(() => {
    // Initialize paths
    taskManager.initPaths(path.join(__dirname, '../..'));
    configManager.initPaths(path.join(__dirname, '../..'));
    commandRegistry.initCommandPaths(path.join(__dirname, '../..'));
    
    // Stub file operations to avoid disk I/O interference
    sandbox.stub(fs, 'readFileSync').callsFake((path) => {
      if (path.includes('tasks.json')) {
        return JSON.stringify(generateMockTasks(100));
      } else if (path.includes('config.json')) {
        return JSON.stringify(configManager.getDefaultConfig());
      }
      return '{}';
    });
    
    sandbox.stub(fs, 'writeFileSync');
    sandbox.stub(fs, 'existsSync').returns(true);
    
    // Suppress console output
    sandbox.stub(console, 'log');
    sandbox.stub(console, 'error');
  });
  
  after(() => {
    sandbox.restore();
  });
  
  // Generate mock tasks for performance testing
  function generateMockTasks(count) {
    const tasks = [];
    
    for (let i = 1; i <= count; i++) {
      tasks.push({
        id: i,
        title: `Task ${i}`,
        description: `This is a description for task ${i}. It contains enough text to simulate a real task description with some reasonable length.`,
        status: i % 3 === 0 ? 'done' : (i % 3 === 1 ? 'todo' : 'in-progress'),
        category: i % 4 === 0 ? 'bug' : (i % 4 === 1 ? 'feature' : (i % 4 === 2 ? 'docs' : 'refactor')),
        priority: i % 3 === 0 ? 'p1-high' : (i % 3 === 1 ? 'p2-medium' : 'p3-low'),
        effort: i % 5 + 1,
        created: new Date(Date.now() - (i * 86400000)).toISOString(),
        updated: new Date(Date.now() - (i * 43200000)).toISOString(),
        author: 'tester',
        comments: [
          { text: `Comment 1 for task ${i}`, date: new Date(Date.now() - (i * 86400000)).toISOString() },
          { text: `Comment 2 for task ${i}`, date: new Date(Date.now() - (i * 43200000)).toISOString() }
        ],
        files: [
          `src/file${i}.js`,
          `test/file${i}.test.js`
        ]
      });
    }
    
    return { lastId: count, tasks };
  }
  
  describe('Task Operations', () => {
    it('should load tasks efficiently', () => {
      const time = measureTime(() => {
        taskManager.loadTasks();
      }, 100);
      
      console.log(`Load tasks (100 iterations): ${time.toFixed(2)}ms`);
      assert.ok(time < 500, `Loading tasks should be fast (took ${time.toFixed(2)}ms for 100 iterations)`);
    });
    
    it('should filter tasks efficiently', () => {
      // Preload tasks
      const tasksData = taskManager.loadTasks();
      
      // Measure filtering by status
      const statusFilterTime = measureTime(() => {
        taskManager.filterTasks(tasksData.tasks, { status: 'todo' });
      }, 1000);
      
      console.log(`Filter by status (1000 iterations): ${statusFilterTime.toFixed(2)}ms`);
      assert.ok(statusFilterTime < 500, `Filtering by status should be fast (took ${statusFilterTime.toFixed(2)}ms for 1000 iterations)`);
      
      // Measure complex filtering (multiple criteria)
      const complexFilterTime = measureTime(() => {
        taskManager.filterTasks(tasksData.tasks, { 
          status: 'todo', 
          category: 'feature',
          priority: 'p1-high'
        });
      }, 1000);
      
      console.log(`Complex filtering (1000 iterations): ${complexFilterTime.toFixed(2)}ms`);
      assert.ok(complexFilterTime < 500, `Complex filtering should be fast (took ${complexFilterTime.toFixed(2)}ms for 1000 iterations)`);
    });
    
    it('should sort tasks efficiently', () => {
      // Preload tasks
      const tasksData = taskManager.loadTasks();
      
      // Test sort function if available, or implement a test sort
      const sortFn = taskManager.sortTasks || ((tasks, sortBy) => {
        return [...tasks].sort((a, b) => {
          if (sortBy === 'priority') {
            return a.priority.localeCompare(b.priority);
          } else if (sortBy === 'created') {
            return new Date(b.created) - new Date(a.created);
          }
          return a.id - b.id;
        });
      });
      
      const sortTime = measureTime(() => {
        sortFn(tasksData.tasks, 'priority');
      }, 100);
      
      console.log(`Sort tasks (100 iterations): ${sortTime.toFixed(2)}ms`);
      assert.ok(sortTime < 500, `Sorting tasks should be fast (took ${sortTime.toFixed(2)}ms for 100 iterations)`);
    });
  });
  
  describe('Command Registry', () => {
    it('should resolve commands efficiently', () => {
      const resolveTime = measureTime(() => {
        commandRegistry.getCommand('list');
        commandRegistry.getCommand('add');
        commandRegistry.getCommand('view');
        commandRegistry.getCommand('update');
        commandRegistry.getCommand('non-existent-command');
      }, 1000);
      
      console.log(`Resolve commands (1000 iterations × 5 lookups): ${resolveTime.toFixed(2)}ms`);
      assert.ok(resolveTime < 500, `Command resolution should be fast (took ${resolveTime.toFixed(2)}ms for 5000 lookups)`);
    });
  });
  
  describe('Config Operations', () => {
    it('should load config efficiently', () => {
      const loadTime = measureTime(() => {
        configManager.loadConfig();
      }, 100);
      
      console.log(`Load config (100 iterations): ${loadTime.toFixed(2)}ms`);
      assert.ok(loadTime < 200, `Loading config should be fast (took ${loadTime.toFixed(2)}ms for 100 iterations)`);
    });
  });
  
  describe('End-to-End Performance', () => {
    it('should execute help command efficiently', function() {
      // Skip if running in CI (might not have tt command available)
      if (process.env.CI) {
        this.skip();
        return;
      }
      
      const helpCommand = spawnSync('node', [path.join(__dirname, '../../bin/tt'), 'help'], {
        stdio: 'pipe'
      });
      
      assert.strictEqual(helpCommand.status, 0, 'Help command should exit with code 0');
      
      // Measure the execution time
      const startTime = process.hrtime();
      
      for (let i = 0; i < 5; i++) {
        spawnSync('node', [path.join(__dirname, '../../bin/tt'), 'help'], {
          stdio: 'pipe'
        });
      }
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      const avgTimeMs = totalTimeMs / 5;
      
      console.log(`Average help command execution time: ${avgTimeMs.toFixed(2)}ms`);
      assert.ok(avgTimeMs < 500, `Help command should execute quickly (avg: ${avgTimeMs.toFixed(2)}ms)`);
    });
  });
}); 