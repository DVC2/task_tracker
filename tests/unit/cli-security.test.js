/**
 * TaskTracker CLI Security Tests
 * 
 * Tests for CLI argument validation and sanitization
 */

const cliSecurity = require('../../lib/utils/cli-security');

module.exports = ({ describe, test, assert, skip }) => {
  describe('Command Line Argument Validation', () => {
    test('validateArg should validate command arguments', () => {
      // Valid commands
      assert.true(cliSecurity.validateArg('list', 'command').valid, 'Should accept valid command name');
      assert.true(cliSecurity.validateArg('add-file', 'command').valid, 'Should accept command with dash');
      
      // Invalid commands
      assert.false(cliSecurity.validateArg('list;rm -rf /', 'command').valid, 'Should reject command injection');
      assert.false(cliSecurity.validateArg('.hidden', 'command').valid, 'Should reject command starting with dot');
      assert.false(cliSecurity.validateArg('a'.repeat(50), 'command').valid, 'Should reject too long command');
    });
    
    test('validateArg should validate task IDs', () => {
      // Valid IDs
      assert.true(cliSecurity.validateArg('123', 'taskId').valid, 'Should accept numeric ID');
      assert.true(cliSecurity.validateArg('0', 'taskId').valid, 'Should accept zero ID');
      
      // Invalid IDs
      assert.false(cliSecurity.validateArg('123abc', 'taskId').valid, 'Should reject alphanumeric ID');
      assert.false(cliSecurity.validateArg('-1', 'taskId').valid, 'Should reject negative ID');
      assert.false(cliSecurity.validateArg('9'.repeat(20), 'taskId').valid, 'Should reject too long ID');
    });
    
    test('validateArg should validate file paths', () => {
      // Valid paths
      assert.true(cliSecurity.validateArg('file.js', 'filePath').valid, 'Should accept simple file');
      assert.true(cliSecurity.validateArg('path/to/file.txt', 'filePath').valid, 'Should accept nested path');
      
      // Invalid paths
      assert.false(cliSecurity.validateArg('../../../etc/passwd', 'filePath').valid, 'Should reject path traversal');
      assert.false(cliSecurity.validateArg('/etc/passwd', 'filePath').valid, 'Should reject absolute path');
      assert.false(cliSecurity.validateArg('file.exe', 'filePath').valid, 'Should reject executable extension');
    });
    
    test('validateArg should validate option flags', () => {
      // Valid options
      assert.true(cliSecurity.validateArg('silent', 'option').valid, 'Should accept simple option');
      assert.true(cliSecurity.validateArg('non-interactive', 'option').valid, 'Should accept option with dash');
      
      // Invalid options
      assert.false(cliSecurity.validateArg('option;rm -rf', 'option').valid, 'Should reject option with injection');
      assert.false(cliSecurity.validateArg('.hidden', 'option').valid, 'Should reject option starting with dot');
    });
    
    test('validateArg should validate option values', () => {
      // Valid values
      assert.true(cliSecurity.validateArg('simple value', 'value').valid, 'Should accept simple value');
      assert.true(cliSecurity.validateArg('value with symbols: !@#$%^&*()', 'value').valid, 'Should accept value with symbols');
      assert.true(cliSecurity.validateArg('', 'value').valid, 'Should accept empty value');
      
      // Invalid values
      const scriptTag = '<script>alert("XSS")</script>';
      assert.false(cliSecurity.validateArg(scriptTag, 'value').valid, 'Should reject value with script tag');
    });
  });
  
  describe('Command Line Argument Sanitization', () => {
    test('sanitizeArgs should sanitize command line arguments', () => {
      // Valid arguments
      const validArgs = ['list', '--status', 'todo', '--category', 'feature'];
      const validResult = cliSecurity.sanitizeArgs(validArgs);
      assert.true(validResult.valid, 'Should validate correct arguments');
      assert.equal(validResult.sanitizedArgs.length, validArgs.length, 'Should maintain argument count');
      
      // Test sanitization of malicious arguments
      const maliciousArgs = ['list', '--option', '<script>alert("XSS")</script>', '../../../etc/passwd'];
      const maliciousResult = cliSecurity.sanitizeArgs(maliciousArgs);
      assert.false(maliciousResult.valid, 'Should invalidate malicious arguments');
      assert.true(maliciousResult.validationIssues.length > 0, 'Should have validation issues');
      assert.true(!maliciousResult.sanitizedArgs.includes('<script>'), 'Should sanitize script tags');
    });
    
    test('sanitizeArgs should handle empty arguments', () => {
      const result = cliSecurity.sanitizeArgs([]);
      assert.true(result.valid, 'Should validate empty arguments');
      assert.equal(result.sanitizedArgs.length, 0, 'Should return empty array');
    });
    
    test('sanitizeArgs should handle mixed valid and invalid arguments', () => {
      const mixedArgs = ['list', '--limit', '9999999999', '--option', '<script>alert(1)</script>'];
      const result = cliSecurity.sanitizeArgs(mixedArgs);
      
      // Should be invalid due to the script tag and too long limit
      assert.false(result.valid, 'Should invalidate mixed arguments');
      
      // Script tag should be sanitized
      const scriptIndex = mixedArgs.findIndex(arg => arg.includes('<script>'));
      assert.true(!result.sanitizedArgs[scriptIndex].includes('<script>'), 'Should sanitize script tags');
    });
    
    test('sanitizeArgs should detect argument type correctly', () => {
      const args = ['list', '123', 'file.txt', '--option', 'value'];
      const result = cliSecurity.sanitizeArgs(args);
      
      // Check if types were correctly detected and sanitized
      assert.true(result.valid, 'Should validate correctly typed arguments');
      assert.equal(result.sanitizedArgs[0], 'list', 'Should preserve command');
      assert.equal(result.sanitizedArgs[1], '123', 'Should preserve task ID');
      assert.equal(result.sanitizedArgs[2], 'file.txt', 'Should preserve file path');
    });
  });
}; 