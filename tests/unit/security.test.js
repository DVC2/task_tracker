/**
 * TaskTracker Security Tests
 * 
 * Tests for security-related functionality
 */

const fs = require('fs');
const path = require('path');
const security = require('../../lib/utils/security-middleware');
const taskManager = require('../../lib/core/task-manager');

// Export a function that takes the test context
module.exports = ({ describe, test, assert, skip }) => {
  // Initialize paths for testing
  const TEST_DIR = path.join(__dirname, '..', '..', 'temp-test');
  taskManager.initPaths(TEST_DIR);
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
  
  // Test cleanup function (run after all tests)
  process.on('exit', () => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      try {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
  
  describe('Input Sanitization', () => {
    test('sanitizeInput should remove HTML content', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const sanitized = security.sanitizeInput(input);
      assert.true(!sanitized.includes('<script>'), 'HTML tags should be removed');
      assert.contains(sanitized, 'Hello', 'Content should be preserved');
    });
    
    test('sanitizeInput should enforce maximum length', () => {
      const longInput = 'A'.repeat(10000);
      const sanitized = security.sanitizeInput(longInput, 100);
      assert.equal(sanitized.length, 100, 'String should be truncated to max length');
    });
    
    test('hasDangerousContent should detect malicious patterns', () => {
      assert.true(security.hasDangerousContent('<script>alert("XSS")</script>'), 'Should detect script tags');
      assert.true(security.hasDangerousContent('javascript:alert(1)'), 'Should detect javascript: protocol');
      assert.false(security.hasDangerousContent('Safe string'), 'Should not flag safe strings');
    });
  });
  
  describe('File Path Validation', () => {
    test('should reject path traversal attempts', () => {
      assert.false(security.validateFilePath('../../../etc/passwd').valid, 'Should reject relative path traversal');
      assert.false(security.validateFilePath('/etc/passwd').valid, 'Should reject absolute paths');
      assert.false(security.validateFilePath('..\\Windows\\System32').valid, 'Should reject Windows path traversal');
    });
    
    test('should validate allowed file extensions', () => {
      assert.true(security.validateFilePath('file.js').valid, 'Should allow .js files');
      assert.true(security.validateFilePath('file.md').valid, 'Should allow .md files');
      assert.false(security.validateFilePath('file.exe').valid, 'Should reject .exe files');
      assert.false(security.validateFilePath('file.sh').valid, 'Should reject .sh files');
    });
    
    test('should allow valid relative paths', () => {
      assert.true(security.validateFilePath('src/app.js').valid, 'Should allow relative paths');
      assert.true(security.validateFilePath('docs/README.md').valid, 'Should allow nested paths');
    });
  });
  
  describe('Task ID Validation', () => {
    test('should handle numeric and string IDs correctly', () => {
      // Create a test task
      const task = taskManager.createTask({
        title: 'Test Task',
        description: 'Description',
        category: 'test'
      });
      
      // Test numeric ID
      const numericResult = taskManager.getTaskById(task.id);
      assert.true(numericResult !== null, 'Should find task with numeric ID');
      assert.equal(numericResult.id, task.id, 'ID should match the original task');
      
      // Test string ID (should convert to number)
      const stringResult = taskManager.getTaskById(String(task.id));
      assert.true(stringResult !== null, 'Should find task with string ID');
      assert.equal(stringResult.id, task.id, 'ID should match the original task');
      
      // Test invalid ID - this will throw an error so we need to handle it
      try {
        taskManager.getTaskById('not-a-number');
        assert.false(true, 'Should have thrown an error for invalid ID');
      } catch (error) {
        assert.contains(error.message, 'Invalid task ID', 'Error message should mention invalid ID');
      }
    });
  });
  
  describe('Safe JSON Operations', () => {
    test('should safely parse valid JSON', () => {
      const validJson = '{"name":"test","value":123}';
      const result = security.safeJsonParse(validJson);
      assert.equal(result.name, 'test', 'Should parse string property correctly');
      assert.equal(result.value, 123, 'Should parse numeric property correctly');
    });
    
    test('should return default value for invalid JSON', () => {
      const invalidJson = '{name:"test",value:123}'; // Missing quotes
      const result = security.safeJsonParse(invalidJson, { defaulted: true });
      assert.equal(result.defaulted, true, 'Should return the default value');
    });
  });
  
  describe('Safe File Operations', () => {
    test('should safely write and read files', () => {
      const testFile = path.join(TEST_DIR, 'test.json');
      const testData = JSON.stringify({ test: 'data' });
      
      // Write data
      const writeResult = security.safeFileOperation(null, testFile, testData);
      assert.true(writeResult, 'File write should succeed');
      
      // Read data
      const readData = fs.readFileSync(testFile, 'utf8');
      const parsed = JSON.parse(readData);
      assert.equal(parsed.test, 'data', 'File content should match what was written');
    });
    
    test('should create backups when writing files', () => {
      const testFile = path.join(TEST_DIR, 'backup-test.json');
      
      // Write initial data
      security.safeFileOperation(null, testFile, JSON.stringify({ version: 1 }));
      
      // Update the file to trigger backup
      security.safeFileOperation(null, testFile, JSON.stringify({ version: 2 }));
      
      // Check if a backup was created (find files with the backup pattern)
      const files = fs.readdirSync(TEST_DIR);
      const backups = files.filter(f => f.startsWith('backup-test.json.backup.'));
      
      assert.true(backups.length > 0, 'Backup file should have been created');
    });
  });
}; 