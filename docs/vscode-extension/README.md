# TaskTracker VSCode Extension

A VSCode extension for seamless integration with TaskTracker, a lightweight task management system with technical debt tracking capabilities.

## Features

- Status bar indicator showing active tasks and technical debt
- Command palette integration for all TaskTracker commands
- Explorer view to browse and manage tasks
- Automatic tracking of technical debt in your codebase
- Quick commands to add, update, and manage tasks

## Requirements

- TaskTracker installed either globally (`npm install -g tasktracker-cli`) or locally in your project
- VSCode 1.60.0 or higher

## Installation

1. Install from VSCode Marketplace, or
2. Download the VSIX file and install manually:
   - `code --install-extension tasktracker-vscode-1.0.0.vsix`

## Usage

### Commands

The following commands are available from the command palette (Ctrl+Shift+P):

- `TaskTracker: Initialize` - Initialize TaskTracker in your project
- `TaskTracker: Add Task` - Create a new task
- `TaskTracker: List Tasks` - View all tasks
- `TaskTracker: View Task` - View details of a specific task
- `TaskTracker: Update Task` - Update a task's status, priority, etc.
- `TaskTracker: Analyze Code Health` - Run code health analysis to identify technical debt

### Status Bar

The status bar shows the number of active tasks and technical debt items. Click on it to view all tasks.

## Extension Settings

This extension contributes the following settings:

* `tasktracker.showInStatusBar`: Enable/disable status bar integration
* `tasktracker.highlightTechnicalDebt`: Enable/disable highlighting of technical debt in code files

## Known Issues

- The extension requires TaskTracker to be installed
- Technical debt highlighting is limited to certain file types

## Release Notes

### 1.0.0

- Initial release of the TaskTracker VSCode extension 