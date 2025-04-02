# TaskTracker

A lightweight, modular task management system for developers.

## Overview

TaskTracker provides a command-line interface for tracking tasks, monitoring changes, and managing project workflows. It's designed to be simple, fast, and integrated with your development process.

## Features

- **Task Management**: Create, update, list, and track tasks
- **File Change Tracking**: Track which files are associated with specific tasks
- **Archiving**: Archive completed tasks while keeping their history
- **Git Integration**: Works with Git to track branch information and changes
- **Customizable**: Configure categories, statuses, and more
- **Fast & Lightweight**: No external dependencies, boots quickly

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tasktracker.git

# Install globally
cd tasktracker
npm install -g .

# Verify installation
tt verify
```

## Quick Start

```bash
# Initialize in your project
cd your-project
tt init

# Add a task
tt add

# Or quickly add a task
tt quick "Fix login button bug" bug

# List tasks
tt list

# Update a task
tt update 1 status in-progress

# View task details
tt view 1

# Track changes
tt changes
```

## Architecture

TaskTracker has been refactored to use a modular architecture:

```
task_tracker/
├── bin/                  # Executable entry points
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
│       └── ...            # Other core modules
├── docs/                 # Documentation
└── tests/                # Tests for all modules
```

### Command Registry Pattern

TaskTracker uses a command registry pattern where:

1. Each command is implemented in its own module in `lib/commands/`
2. Commands are registered in `lib/commands/index.js`
3. The main script dispatches commands through the registry

This makes it easy to:
- Add new commands without modifying existing code
- Test commands individually
- Keep command implementations focused and concise

## Command Reference

See [cli-reference.md](cli-reference.md) for a full list of commands and options.

## Extensions

TaskTracker supports several extensions and integrations:

- **Shell Completion**: See [SHELL-COMPLETION.md](SHELL-COMPLETION.md)
- **AI Integration**: See [AI-INTEGRATION.md](AI-INTEGRATION.md)
- **Custom Reports**: See [REPORTS.md](REPORTS.md)
- **Cursor Integration**: See [cursor-integration.md](cursor-integration.md)

## Development

See the [dev-docs/](dev-docs/) directory for information on:

- How to add new commands
- Code structure and organization
- Testing guidelines
- Release process

## Testing

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
```

## License

MIT 