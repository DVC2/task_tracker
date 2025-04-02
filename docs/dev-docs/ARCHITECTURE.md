# TaskTracker Architecture Guide

This document explains the TaskTracker architecture and provides guidance for developers looking to extend or maintain the codebase.

## Architecture Overview

TaskTracker has been refactored to use a modular, component-based architecture with clear separation of concerns. The application is organized into:

- **Commands**: Implement specific user actions (create task, list tasks, etc.)
- **Core Services**: Provide shared functionality like task management, configuration, formatting
- **Entry Point**: Main script that parses arguments and dispatches to commands

### Directory Structure

```
task_tracker/
├── bin/                  # Executable entry points
│   ├── tt                # Main entry point (global command)
│   └── tasktracker       # Original entry point (for backward compatibility)
├── lib/                  # Core library code
│   ├── commands/         # Command implementations
│   │   ├── add.js        # Add task command
│   │   ├── list.js       # List tasks command
│   │   ├── ...           # Other commands
│   │   └── index.js      # Command registry
│   └── core/             # Core functionality
│       ├── task-manager.js    # Task CRUD operations
│       ├── config-manager.js  # Configuration management
│       ├── formatting.js      # Output formatting
│       └── ...                # Other core modules
├── docs/                 # Documentation
└── tests/                # Tests for all modules
    ├── unit/             # Unit tests
    ├── integration/      # Integration tests
    └── security/         # Security tests
```

## Command Registry Pattern

TaskTracker uses a command registry pattern to decouple command implementation from dispatch:

1. Each command is implemented in a separate module in `lib/commands/`
2. Commands are registered in the command registry (`lib/commands/index.js`)
3. The main entry point uses the registry to find and execute the requested command

This approach provides:
- **Extensibility**: New commands can be added without changing existing code
- **Modularity**: Commands are independent and focused
- **Testability**: Each command can be tested in isolation

### Command Registry Structure

The command registry (`lib/commands/index.js`) contains:

```javascript
// Command metadata
const commands = {
  'command-name': {
    description: 'Command description',
    handler: functionReference
  },
  // Command aliases
  'alias': {
    description: 'Alias for another command',
    alias: 'original-command'
  }
};

// Helper functions
function getCommand(commandName) { ... }
function initCommandPaths(rootDir) { ... }
```

## Core Services

Core services provide shared functionality to commands:

- **task-manager.js**: Task CRUD operations (create, read, update, delete)
- **config-manager.js**: Configuration management (load, save, defaults)
- **formatting.js**: Output formatting and display utilities
- **archive-manager.js**: Task archiving and restoration
- **cli-parser.js**: Command-line argument parsing

## Creating a New Command

To create a new command:

1. Create a new file in `lib/commands/` (e.g., `my-command.js`)
2. Implement the command functionality
3. Register the command in `lib/commands/index.js`

### Command Implementation Template

```javascript
/**
 * TaskTracker My Command
 * 
 * Description of what this command does
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output } = require('../core/formatting');
const configManager = require('../core/config-manager');
const taskManager = require('../core/task-manager');

// Data paths (will be initialized if needed)
let SOME_PATH = '';

/**
 * Initialize paths based on app root
 * @param {string} rootDir The application root directory
 */
function initPaths(rootDir) {
  // Initialize any paths needed by this command
  SOME_PATH = path.join(rootDir, 'some-path');
}

/**
 * Main command function
 * @param {string|object} arg1 First argument
 * @param {object} options Command options
 * @returns {object} Result with success status
 */
function myCommand(arg1, options = {}) {
  try {
    // Command implementation
    // ...
    
    // Success case
    output('✅ Command completed successfully', 'success', { globalOptions: options });
    return { success: true, result: 'Some result' };
  } catch (error) {
    // Error handling
    output(`❌ Error: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initPaths,  // Only needed if this command uses paths
  myCommand   // Main command function
};
```

### Command Registration

Add your command to `lib/commands/index.js`:

```javascript
// Add import
const myCommand = require('./my-command');

// Add to commands object
const commands = {
  // Existing commands...
  
  'my-command': {
    description: 'Description of my command',
    handler: myCommand.myCommand
  }
};

// Add path initialization if needed
function initCommandPaths(rootDir) {
  // Existing initialization...
  
  if (myCommand.initPaths) {
    myCommand.initPaths(rootDir);
  }
}
```

## Testing Commands

### Unit Tests

Create unit tests in `tests/unit/` that test your command's functions in isolation:

```javascript
// tests/unit/my-command.test.js
const assert = require('assert');
const sinon = require('sinon');
const myCommand = require('../../lib/commands/my-command');

describe('My Command', () => {
  // Setup and teardown code...
  
  describe('myCommand', () => {
    it('should do something', () => {
      // Setup test...
      const result = myCommand.myCommand('arg1', { option: 'value' });
      
      // Assert expected outcome
      assert.strictEqual(result.success, true);
      // More assertions...
    });
    
    it('should handle errors', () => {
      // Test error cases...
    });
  });
});
```

### Integration Tests

Create integration tests in `tests/integration/` that test your command with other components:

```javascript
// tests/integration/my-command-integration.test.js
// Test the command with other system components...
```

## Guidelines

1. **Command Structure**:
   - Each command should have a clear responsibility
   - Use standard input/output parameters
   - Return a consistent result object `{ success: boolean, ... }`

2. **Error Handling**:
   - Use try/catch in command functions
   - Return meaningful error messages
   - Don't throw errors (return error objects instead)

3. **Path Management**:
   - Use `initPaths` for path initialization
   - Don't hardcode paths
   - Use environment variables when appropriate

4. **Configuration**:
   - Use the config-manager module for all config needs
   - Document any new config options
   - Provide sensible defaults

5. **Output Formatting**:
   - Use the formatting.output function for console output
   - Support global options (--json, --silent, etc.)
   - Respect user preferences

## Performance Considerations

1. **Lazy Loading**:
   - Only load modules when needed
   - Use dependency injection where practical

2. **Efficient File I/O**:
   - Minimize disk operations
   - Cache results when appropriate
   - Use streaming for large files

3. **Command Startup Time**:
   - Keep initialization code minimal
   - Measure performance impact of changes
   - Be mindful of dependencies

## Security Best Practices

1. **Input Validation**:
   - Sanitize user input
   - Don't use eval or Function constructors
   - Validate paths to prevent path traversal

2. **File Operations**:
   - Use safe file handling
   - Validate file paths before operations
   - Be careful with permissions

3. **Command Execution**:
   - Never execute shell commands with unsanitized input
   - Use safer alternatives (like Node.js APIs)

## Development Process

1. **Adding a Feature**:
   - Create a new branch
   - Implement the feature (command, test, documentation)
   - Create a pull request
   - Ensure tests pass

2. **Making Changes**:
   - Follow the existing patterns
   - Maintain backward compatibility
   - Update documentation
   - Add tests for new code

3. **Publishing**:
   - Increment version according to semver
   - Update CHANGELOG.md
   - Create release notes

By following these guidelines, you'll help maintain the quality and extensibility of the TaskTracker codebase. 