# TaskTracker Tests

This directory contains all the tests for the TaskTracker system. Tests are organized into different categories to ensure comprehensive coverage.

## Test Structure

- **Unit Tests** (`/unit`): Test individual components in isolation
- **Integration Tests** (`/integration`): Test multiple components working together
- **Security Tests** (`/security`): Validate security practices and safeguards
- **Temporary Files** (`/temp`): Used for test fixtures and outputs

## Running Tests

```bash
# Run all tests
node test-runner.js

# Run only unit tests
node test-runner.js --unit

# Run only integration tests
node test-runner.js --integration

# Run specific test file
node test-runner.js tests/unit/tasktracker.test.js
```

## Test Files

### Core Tests

- `test-core-commands.js` - Tests for basic TaskTracker commands

### Unit Tests

- `unit/tasktracker.test.js` - Unit tests for the main TaskTracker module

### Integration Tests

- `integration/claude-integration.test.js` - Tests for Claude AI integration

### Security Tests

- `security/security-checks.js` - Security validation tests

## Test Fixtures

Test fixtures are stored in the `/temp` directory and are automatically cleaned up after tests run.

## Adding New Tests

1. Create a new test file in the appropriate directory (unit, integration, security)
2. Use the test helper functions: `describe`, `test`, `assert`, etc.
3. Run your new test to verify it works properly
4. Add the test to the appropriate test runner configuration

## Example Test

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