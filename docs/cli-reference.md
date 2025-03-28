# TaskTracker CLI Reference

This document provides a comprehensive reference of all TaskTracker command-line interface (CLI) commands, options, and arguments.

## Command Structure

TaskTracker commands follow this general structure:

```
tasktracker <command> [options] [arguments]
```

You can also use the shorthand alias `tt` if TaskTracker is installed globally:

```
tt <command> [options] [arguments]
```

## Core Commands

### Initialize

Initialize TaskTracker in the current directory.

```
tasktracker init
```

### Add Task (Interactive)

Add a new task with an interactive prompt.

```
tasktracker add
```

### Quick Task

Add a new task quickly without an interactive prompt.

```
tasktracker quick <title> [category]
```

Arguments:
- `title`: Task title (required, use quotes for multi-word titles)
- `category`: Task category (optional, defaults to "feature")

Example:
```
tasktracker quick "Implement login page" feature
```

### List Tasks

List all tasks or filter by status.

```
tasktracker list [status] [--current]
```

Arguments:
- `status`: Filter tasks by status (optional)
- `--current`: Show only the current task (optional, for status bar integration)

Examples:
```
tasktracker list
tasktracker list todo
tasktracker list --current
```

### View Task

View detailed information about a specific task.

```
tasktracker view <id>
```

Arguments:
- `id`: Task ID (required)

Example:
```
tasktracker view 3
```

### Update Task

Update an existing task.

```
tasktracker update <id> <field> <value>
```

Arguments:
- `id`: Task ID (required)
- `field`: Field to update (required)
- `value`: New value (required)

Available fields:
- `status`: Task status (todo, in-progress, review, done)
- `category`: Task category (feature, bugfix, refactor, docs, test, chore)
- `title`: Task title
- `desc`: Task description
- `addfile`: Add a file to the task
- `comment`: Add a comment to the task

Examples:
```
tasktracker update 3 status in-progress
tasktracker update 3 title "New task title"
tasktracker update 3 addfile src/components/Login.js
tasktracker update 3 comment "Working on this now"
```

### Track Changes

Track file changes and link them to tasks.

```
tasktracker changes [path]
```

Arguments:
- `path`: Path filter (optional)

Example:
```
tasktracker changes
tasktracker changes src/
```

### Release

Create a new release based on completed tasks.

```
tasktracker release [version]
```

Arguments:
- `version`: Version override (optional)

Example:
```
tasktracker release
tasktracker release 1.2.0
```

## Statistics and Reporting

### Snapshot

Take a snapshot of the current project state.

```
tasktracker snapshot [format]
```

Arguments:
- `format`: Output format (optional, defaults to text)

Example:
```
tasktracker snapshot
tasktracker snapshot json
```

### Report

Generate a report.

```
tasktracker report [type]
```

Arguments:
- `type`: Report type (text, html, json)

Example:
```
tasktracker report html
```

### Compare

Compare with a previous snapshot.

```
tasktracker compare [days]
```

Arguments:
- `days`: Days ago to compare (optional, defaults to 7)

Example:
```
tasktracker compare
tasktracker compare 30
```

### Trends

Show task completion trends.

```
tasktracker trends
```

## Setup and Utilities

### Setup

Set up TaskTracker in a project.

```
tasktracker setup
```

### Automate

Configure Git hooks and automation.

```
tasktracker automate
```

### Help

Show help information.

```
tasktracker help
```

## IDE Integration

TaskTracker works seamlessly with IDE agents by supporting special flags:

- `--current` with the `list` command for status bar integration
- Standard output formats for easy parsing by scripts and IDE plugins
- Clear error messages with exit codes for automated processing

See the IDE integration guides for more information:
- [VSCode Integration](vscode-integration/README.md)
- [JetBrains Integration](jetbrains-integration/README.md)
- [Cursor IDE Integration](cursor-integration.md)

## Global Installation

To use TaskTracker from any directory, install it globally:

```
npm install -g tasktracker
```

This enables:
- The `tasktracker` command from any directory
- The `tt` shorthand alias
- Improved IDE integration 