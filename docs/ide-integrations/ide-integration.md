# TaskTracker IDE Integration Guide

This guide explains how to integrate TaskTracker with various Integrated Development Environments (IDEs) and AI coding assistants.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [VSCode Integration](#vscode-integration)
- [JetBrains IDEs Integration](#jetbrains-ides-integration)
- [Cursor IDE Integration](#cursor-ide-integration)
- [GitHub Copilot Integration](#github-copilot-integration)
- [AI Assistant Integration](#ai-assistant-integration)
- [Creating Your Own IDE Integration](#creating-your-own-ide-integration)
- [Command Reference](#command-reference)

## Overview

TaskTracker is designed to work seamlessly with different IDEs and AI assistants. Integration can happen in several ways:

1. **Command Execution**: Running TaskTracker commands directly from the IDE terminal
2. **Key Bindings**: Creating custom keyboard shortcuts for common TaskTracker operations
3. **Status Bar Integration**: Displaying current task information in the IDE status bar
4. **Extension/Plugin Integration**: Using dedicated extensions for deeper integration
5. **AI Assistant Commands**: Defining special commands that AI assistants can understand

## Quick Start

To get started with TaskTracker IDE integration:

1. Install TaskTracker globally:
   ```
   npm install -g tasktracker
   ```

2. This enables the `tasktracker` command and `tt` shorthand alias from any directory

3. Initialize in your project:
   ```
   cd your-project
   tasktracker init
   ```

4. Use the `--current` flag with the list command to show the current task:
   ```
   tasktracker list --current
   ```
   This outputs a single line suitable for status bar integration.

## VSCode Integration

### Basic Setup

1. Install TaskTracker globally:
   ```
   npm install -g tasktracker
   ```

2. Add these custom key bindings to your `keybindings.json`:
   ```json
   [
     {
       "key": "ctrl+alt+t",
       "command": "workbench.action.terminal.sendSequence",
       "args": { "text": "tasktracker list\n" }
     },
     {
       "key": "ctrl+alt+n",
       "command": "workbench.action.terminal.sendSequence",
       "args": { "text": "tasktracker quick \"New task from VSCode\" feature\n" }
     }
   ]
   ```

3. For status bar integration, use the [Custom Status Bar extension](https://marketplace.visualstudio.com/items?itemName=sirtobi.custom-status-bar-items)

See the [VSCode Integration Guide](vscode-integration/README.md) for details on:
- Setting up custom tasks in VS Code
- Configuring key bindings
- Using extensions for status bar integration

## JetBrains IDEs Integration

### Basic Setup

1. Install TaskTracker globally:
   ```
   npm install -g tasktracker
   ```

2. Add External Tools:
   - Go to Settings → Tools → External Tools
   - Add TaskTracker commands with appropriate parameters
   - Assign keyboard shortcuts in Settings → Keymap

See the [JetBrains Integration Guide](jetbrains-integration/README.md) for details on:
- Configuring external tools
- Creating custom keyboard shortcuts
- Setting up file templates

## Cursor IDE Integration

TaskTracker has first-class support for Cursor IDE through the `.cursorrules` file:

1. Copy the `.cursorrules` file to your project root:
   ```
   cp /path/to/tasktracker/.cursorrules /path/to/your/project/
   ```

2. This provides:
   - Custom commands that can be used with the AI assistant
   - Status bar integration
   - Key bindings
   - Task comment templates

See the [Cursor IDE Specific Features](#cursor-ide-specific-features) section for more details.

### Cursor IDE Specific Features

The `.cursorrules` file provides:

- `task.get_tasks` - List all tasks
- `task.view_task` - View a specific task
- `task.add_quick` - Add a quick task
- `task.status_todo`, `task.status_in_progress`, etc. - Update task status
- `task.comment` - Add a comment to a task
- `task.add_file` - Link current file to a task
- `task.track_changes` - Find tasks related to modified files
- `task.stats` - Show project statistics

These commands can be used directly in the AI assistant prompt.

See the [Cursor Integration Guide](cursor-integration.md) for details on:
- Using the `.cursorrules` file
- Integrating with the AI assistant
- Configuring status bar and keyboard shortcuts

## GitHub Copilot Integration

GitHub Copilot can be taught to work with TaskTracker:

1. Create a `.github/copilot/tasktracker-commands.md` file:
   ```markdown
   # TaskTracker Commands for GitHub Copilot

   Here are the common TaskTracker commands:

   - List tasks: `tasktracker list`
   - View task: `tasktracker view <id>`
   - Add task: `tasktracker add`
   - Quick task: `tasktracker quick "Task title" category`
   - Update task: `tasktracker update <id> status done`
   ```

2. Refer to this in conversations with Copilot to help it understand TaskTracker commands.

## AI Assistant Integration

TaskTracker works with AI coding assistants to provide task management through natural language:

### Cursor AI

Cursor AI can directly use the TaskTracker commands defined in the `.cursorrules` file:

```
# Show all tasks
task.get_tasks

# View a specific task
task.view_task 3

# Update task status
task.status_in_progress 3
```

### GitHub Copilot

GitHub Copilot can be taught TaskTracker commands via the documentation file:

```
# File: .github/copilot/tasktracker-commands.md
```

### Other AI Assistants

For other AI assistants, you can:
1. Point them to the CLI documentation
2. Create command aliases
3. Define common patterns for task-related operations

## Creating Your Own IDE Integration

TaskTracker can be integrated with any IDE or tool that supports:

1. **Shell command execution**: For running TaskTracker commands
2. **Custom key bindings**: For frequently used TaskTracker operations
3. **Status bar or UI extensions**: For displaying task information

### Integration Template

Create a file like `.ideaconfig` or `.vscode/tasktracker.json` with:

```json
{
  "commands": {
    "listTasks": "tasktracker list",
    "viewTask": "tasktracker view $1",
    "addTask": "tasktracker quick \"$1\" \"$2\"",
    "updateTaskStatus": "tasktracker update $1 status $2"
  },
  "keyBindings": {
    "listTasks": "Ctrl+Alt+T",
    "addQuickTask": "Ctrl+Alt+N",
    "trackChanges": "Ctrl+Alt+C"
  },
  "statusBar": {
    "command": "tasktracker list --current",
    "refreshInterval": 60
  }
}
```

Adapt this template for your specific IDE or tool.

## Command Reference

These commands are particularly useful for IDE integration:

```
# Get current task (for status bar)
tasktracker list --current

# Quickly add a task (for key binding)
tasktracker quick "Task name" category

# Change task status (for key binding)
tasktracker update <id> status <status>

# Track file changes (for file watchers)
tasktracker changes
```

For a complete command reference, see the [CLI Reference](cli-reference.md). 