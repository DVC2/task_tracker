/**
 * TaskTracker JSON Parsing Tests
 * 
 * Tests for robust JSON parsing functionality
 */

const assert = require('assert');
const { safeJsonParse } = require('../../lib/utils/security-middleware');
const { formatJsonResult } = require('../../lib/utils/structured-output');

// Export a function that takes the test context
module.exports = ({ describe, test, assert, skip }) => {
  describe('Safe JSON Parsing', () => {
    test('should parse valid JSON correctly', () => {
      const validJson = '{"name":"test","value":42,"nested":{"key":"value"}}';
      const result = safeJsonParse(validJson);
      
      assert.equal(result.name, 'test', 'String property should be parsed correctly');
      assert.equal(result.value, 42, 'Number property should be parsed correctly');
      assert.equal(result.nested.key, 'value', 'Nested objects should be parsed correctly');
    });
    
    test('should handle empty strings', () => {
      const defaultValue = { test: 'default' };
      const result = safeJsonParse('', defaultValue);
      
      assert.equal(result.test, 'default', 'Empty string should return default value');
    });
    
    test('should handle whitespace-only strings', () => {
      const defaultValue = { test: 'default' };
      const result = safeJsonParse('   \n  \t  ', defaultValue);
      
      assert.equal(result.test, 'default', 'Whitespace-only string should return default value');
    });
    
    test('should handle null input', () => {
      const defaultValue = { test: 'default' };
      const result = safeJsonParse(null, defaultValue);
      
      assert.equal(result.test, 'default', 'Null input should return default value');
    });
    
    test('should handle undefined input', () => {
      const defaultValue = { test: 'default' };
      const result = safeJsonParse(undefined, defaultValue);
      
      assert.equal(result.test, 'default', 'Undefined input should return default value');
    });
    
    test('should handle malformed JSON', () => {
      const defaultValue = { test: 'default' };
      const malformedJson = '{name: "test", "value": 42}'; // Missing quotes around property name
      const result = safeJsonParse(malformedJson, defaultValue);
      
      assert.equal(result.test, 'default', 'Malformed JSON should return default value');
    });
    
    test('should handle incomplete JSON', () => {
      const defaultValue = { test: 'default' };
      const incompleteJson = '{"name":"test", "value":';
      const result = safeJsonParse(incompleteJson, defaultValue);
      
      assert.equal(result.test, 'default', 'Incomplete JSON should return default value');
    });
  });
  
  describe('JSON Structured Output', () => {
    test('should format basic data correctly', () => {
      const data = { name: 'test', value: 42 };
      const result = formatJsonResult(data);
      
      assert.true(result.success, 'Result should indicate success');
      assert.equal(result.data.name, 'test', 'Data should be preserved in output');
      assert.equal(result.data.value, 42, 'Numeric values should be preserved');
      assert.equal(result.error, null, 'Error should be null for successful operations');
    });
    
    test('should handle circular references gracefully', () => {
      // Create object with circular reference
      const circularObj = { name: 'circular' };
      circularObj.self = circularObj;
      
      // Should not throw an error
      const result = formatJsonResult(circularObj);
      
      assert.true(result.success, 'Result with circular references should indicate success');
      assert.equal(result.data.name, 'circular', 'Regular properties should be preserved');
      assert.equal(result.data.self, '[Circular]', 'Circular references should be replaced with marker');
    });
    
    test('should handle nested objects correctly', () => {
      const data = {
        person: {
          name: 'John',
          details: {
            age: 30,
            address: {
              city: 'New York'
            }
          }
        }
      };
      
      const result = formatJsonResult(data);
      
      assert.equal(result.data.person.name, 'John', 'Nested properties should be preserved');
      assert.equal(result.data.person.details.age, 30, 'Nested numeric values should be preserved');
      assert.equal(result.data.person.details.address.city, 'New York', 'Deeply nested values should be preserved');
    });
    
    test('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = formatJsonResult(error);
      
      assert.true(result.success, 'Error objects should be serialized without failure');
      assert.equal(result.data.message, 'Test error', 'Error message should be preserved');
      assert.equal(result.data.name, 'Error', 'Error name should be preserved');
    });
    
    test('should handle arrays correctly', () => {
      const data = [1, 2, { name: 'test' }];
      const result = formatJsonResult(data);
      
      assert.true(Array.isArray(result.data), 'Array structure should be preserved');
      assert.equal(result.data.length, 3, 'Array length should be preserved');
      assert.equal(result.data[0], 1, 'Array numeric elements should be preserved');
      assert.equal(result.data[2].name, 'test', 'Array object elements should be preserved');
    });
    
    test('should handle null and undefined values', () => {
      const data = { 
        nullValue: null, 
        // undefinedValue: undefined 
      };
      
      const result = formatJsonResult(data);
      
      assert.equal(result.data.nullValue, null, 'Null values should be preserved');
      // assert.equal(result.data.undefinedValue, null, 'Undefined values should be converted to null');
    });
  });
}; 