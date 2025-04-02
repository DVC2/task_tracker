/**
 * Unit Tests for Config Manager Module
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');

// Module to test
const configManager = require('../../lib/core/config-manager');

describe('Config Manager', () => {
  // Setup temp config path for tests
  const tempDir = path.join(__dirname, '../temp');
  const configPath = path.join(tempDir, 'config.json');
  
  let fsReadStub;
  let fsWriteStub;
  
  beforeEach(() => {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Initialize the config path
    configManager.initPaths(path.join(__dirname, '../..'));
    
    // Setup stubs
    fsReadStub = sinon.stub(fs, 'readFileSync');
    fsWriteStub = sinon.stub(fs, 'writeFileSync');
  });
  
  afterEach(() => {
    // Restore stubs
    sinon.restore();
  });
  
  describe('getDefaultConfig', () => {
    it('should return default config with expected properties', () => {
      const defaultConfig = configManager.getDefaultConfig();
      
      assert.strictEqual(typeof defaultConfig, 'object', 'Default config should be an object');
      assert.ok(Array.isArray(defaultConfig.taskCategories), 'taskCategories should be an array');
      assert.ok(Array.isArray(defaultConfig.taskStatuses), 'taskStatuses should be an array');
      assert.ok(Array.isArray(defaultConfig.priorityLevels), 'priorityLevels should be an array');
      assert.ok(Array.isArray(defaultConfig.effortEstimation), 'effortEstimation should be an array');
      assert.strictEqual(typeof defaultConfig.showChalkWarnings, 'boolean', 'showChalkWarnings should be a boolean');
    });
  });
  
  describe('loadConfig', () => {
    it('should load existing config from file', () => {
      // Mock config file content
      const mockConfig = {
        taskCategories: ['test-category'],
        taskStatuses: ['test-status'],
        showChalkWarnings: false
      };
      
      // Setup stub to return mock config
      fsReadStub.returns(JSON.stringify(mockConfig));
      
      const loadedConfig = configManager.loadConfig();
      
      assert.deepStrictEqual(loadedConfig, mockConfig, 'Should load config from file');
      sinon.assert.calledOnce(fsReadStub);
    });
    
    it('should return default config if file not found', () => {
      // Setup stub to throw error (file not found)
      fsReadStub.throws(new Error('File not found'));
      
      const loadedConfig = configManager.loadConfig();
      const defaultConfig = configManager.getDefaultConfig();
      
      assert.deepStrictEqual(loadedConfig, defaultConfig, 'Should return default config');
    });
    
    it('should return default config if file contains invalid JSON', () => {
      // Setup stub to return invalid JSON
      fsReadStub.returns('invalid json');
      
      const loadedConfig = configManager.loadConfig();
      const defaultConfig = configManager.getDefaultConfig();
      
      assert.deepStrictEqual(loadedConfig, defaultConfig, 'Should return default config');
    });
  });
  
  describe('saveConfig', () => {
    it('should save config to file', () => {
      const config = { test: 'value' };
      
      configManager.saveConfig(config);
      
      sinon.assert.calledOnce(fsWriteStub);
      sinon.assert.calledWith(fsWriteStub, sinon.match.any, JSON.stringify(config, null, 2));
    });
    
    it('should handle errors when saving config', () => {
      // Setup stub to throw error
      fsWriteStub.throws(new Error('Write error'));
      
      const config = { test: 'value' };
      
      // Wrap in try/catch because we expect an error
      try {
        configManager.saveConfig(config);
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Error saving config: Write error');
      }
    });
  });
}); 