# TaskTracker Library Components

This directory contains the core library components of TaskTracker.

## Structure

- **commands/** - Command implementations (one file per command)
  - **index.js** - Command registry system
  - **add.js**, **list.js**, etc. - Individual command modules
  
- **core/** - Core service modules
  - **task-manager.js** - Task management functionality
  - **config-manager.js** - Configuration management
  - **formatting.js** - Terminal output formatting
  - **archive-manager.js** - Task archiving and restoration
  - **cli-parser.js** - Command-line argument parsing
  
- **reporting/** - Reporting and analytics
  - **stats-tracker.js** - Statistics and snapshots
  - **status-report.js** - Task status reporting
  
- **integration/** - Integration with external systems
  - **git-integration.js** - Git integration
  - **prompt-templates.js** - AI prompt templates

## Component Relationships

1. Commands use core services for functionality
2. Core services provide common utilities used across commands
3. Reporting modules use core services to access data
4. Integration modules connect the system to external tools

## Adding New Commands

To add a new command:

1. Create a new file in the `commands/` directory
2. Implement the command's functionality
3. Register the command in `commands/index.js`

See [ARCHITECTURE.md](../docs/dev-docs/ARCHITECTURE.md) for more details. 