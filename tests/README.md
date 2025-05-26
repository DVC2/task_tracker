# TaskTracker Tests

This directory contains all the tests for the TaskTracker system. Tests are organized into different categories to ensure comprehensive coverage.

## Test Structure

- **Unit Tests** (`/unit`): Test individual components in isolation
- **Integration Tests** (`/integration`): Test multiple components working together
- **End-to-End Tests** (`/e2e`): Full system tests simulating real user interactions
- **Security Tests** (`/security`): Validate security practices and safeguards
- **Performance Tests** (`/performance`): Test system performance under various conditions
- **Temporary Files** (`/temp`): Used for test fixtures and outputs (cleaned up automatically)

## Test Infrastructure

The test suite uses multiple testing frameworks:

- **Mocha/Chai**: Used in `test-core-commands.js` for testing core functionality
- **Custom Test Framework**: Used in the unit, integration, and other test directories
- **test-runner.js**: A utility that provides command execution functionality for tests
- **test-master-runner.js**: Discovers and runs tests across different directories

## Running Tests

```bash
# Run all Mocha tests (requires global Mocha installation)
mocha tests/test-core-commands.js

# Run specific Mocha test files
mocha tests/unit/tasktracker.test.js

# Run custom framework tests
node tests/test-master-runner.js        # Run all tests
node tests/test-master-runner.js --unit # Run only unit tests
node tests/test-master-runner.js tests/unit/tasktracker.test.js # Run specific test file
```

## Test Files

### Core Tests

- `test-core-commands.js` - Mocha/Chai tests for basic TaskTracker commands
- `test-runner.js` - Command execution utility for running TaskTracker commands in tests
- `test-master-runner.js` - Main test runner for custom framework tests

### Unit Tests

- `unit/tasktracker.test.js` - Unit tests for the main TaskTracker module
- `unit/task-manager.test.js` - Tests for task management functionality
- `unit/config-manager.test.js` - Tests for configuration management
- `unit/error-handling.test.js` - Tests for error handling mechanisms
- `unit/cli-security.test.js` - Tests for CLI security features
- `unit/json-parsing.test.js` - Tests for JSON parsing utilities
- `unit/security.test.js` - Tests for general security functionality

### Integration Tests

- `integration/claude-integration.test.js` - Tests for Claude AI integration
- `integration/command-execution.test.js` - Tests for command execution
- `integration/command-registry.test.js` - Tests for command registry

### Security Tests

- `security/security-checks.js` - Security validation and scanning tests

### Performance Tests

- `performance/core-performance.test.js` - Performance benchmarks for core functionality

## Test Fixtures

Test fixtures are stored in the `/temp` directory and are automatically cleaned up after tests run.

## Adding New Tests

### Adding Mocha/Chai Tests

1. Create a new test file following the pattern in `test-core-commands.js`
2. Use Mocha's `describe`, `it`, and Chai's `expect` for assertions
3. Run with the `mocha` command

### Adding Custom Framework Tests

1. Create a new test file in the appropriate directory (unit, integration, security)
2. Export a function that accepts the test helpers (`describe`, `test`, `assert`)
3. Run using the test-master-runner.js

## Example Test (Custom Framework)

```javascript
module.exports = ({ describe, test, assert, runCommand }) => {
  describe('My Feature', () => {
    test('should do something correctly', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = runCommand('tt', ['process', input]);
      
      // Assert
      assert.contains(result.stdout, 'success', 'Success message should be shown');
    });
  });
}; 