# TaskTracker CLI Reference

This document provides a comprehensive reference for all TaskTracker commands and options.

## Global Options

The following options can be used with any command:

```
--json, -j               Output results in JSON format
--silent, -s             Suppress normal console output
--non-interactive, --ni  Never prompt for input (for automated environments)
--plain, -p              Plain text output (no colors or formatting)
```

## Core Commands

### Task Management

#### `tt init`

Initialize TaskTracker in the current directory.

```bash
tt init [options]
```

Options:
- `--projectName <name>` - Set the project name
- `--force` - Force reinitialization

#### `tt add`

Add a new task interactively.

```bash
tt add
```

The command will prompt for:
- Task title (required)
- Description (optional)
- Category (default: feature)
- Status (default: todo)
- Priority (default: p2-medium)
- Effort (default: 3-medium)
- Related files (optional)

#### `tt quick`

Quickly add a task non-interactively.

```bash
tt quick <title> [category] [status] [priority] [effort] [options]
```

Arguments:
- `title` - Task title (required, use quotes for multi-word titles)
- `category` - Task category (optional, e.g., feature, bug, docs)
- `status` - Task status (optional, e.g., todo, in-progress)
- `priority` - Task priority (optional, e.g., p1-critical, p2-medium)
- `effort` - Effort estimation (optional, e.g., 1-trivial, 3-medium)

Options:
- `--desc, --description <text>` - Add description to the task
- `--file, -f <path>` - Add related file to the task

#### `tt update`

Update an existing task.

```bash
tt update <id> <field> <value>
```

Arguments:
- `id` - Task ID to update (required)
- `field` - Field to update (required):
  - `status` - Task status
  - `category` - Task category
  - `title` - Task title
  - `description` - Task description
  - `priority` - Task priority
  - `effort` - Effort estimation
  - `comment` - Add a comment
  - `addfile`, `add-file` - Add related file
  - `removefile`, `remove-file` - Remove related file
- `value` - New value for the field (required)

Examples:
```bash
tt update 1 status done
tt update 2 add-file src/login.js
tt update 3 comment "Fixed the login issue by adding proper validation"
```

#### `tt list`

List all tasks.

```bash
tt list [options]
```

Options:
- `--status <status>` - Filter by status (e.g., todo, in-progress)
- `--category <category>` - Filter by category (e.g., feature, bug)
- `--priority <priority>` - Filter by priority (e.g., p1-critical)
- `--effort <effort>` - Filter by effort (e.g., 3-medium)
- `--author <author>` - Filter by task creator
- `--branch <branch>` - Filter by Git branch
- `--file <file>` - Filter tasks with specific related file
- `--view <view>` - Display format: table, compact, detailed (default: table)

#### `tt view`

View details of a specific task.

```bash
tt view <id>
```

Arguments:
- `id` - Task ID to view (required)

#### `tt archive`

Archive a task.

```bash
tt archive <id> [reason]
```

Arguments:
- `id` - Task ID to archive (required)
- `reason` - Optional reason for archiving

#### `tt restore`

Restore a task from archives.

```bash
tt restore <id>
```

Arguments:
- `id` - Archived task ID to restore (required)

#### `tt archives`

List archived tasks.

```bash
tt archives
```

### Project Management

#### `tt changes`

Track file changes and show impacted tasks.

```bash
tt changes [path]
```

Arguments:
- `path` - Optional specific path to check for changes

Options:
- `--disable-git` - Don't use Git for change detection

#### `tt verify`

Verify TaskTracker installation and configuration.

```bash
tt verify [options]
```

Options:
- `--fix` - Attempt to fix any issues found

#### `tt update-config`

Update configuration settings.

```bash
tt update-config <option> [value]
```

Options:
- `suppress-chalk-warnings` - Hide chalk library compatibility warnings
- `show-chalk-warnings` - Show chalk library compatibility warnings
- `project-name <name>` - Set project name
- `add-category <category>` - Add a task category
- `remove-category <category>` - Remove a task category
- `add-status <status>` - Add a task status
- `remove-status <status>` - Remove a task status
- `display-width <width>` - Set maximum display width (60-200)
- `default-view <view>` - Set default list view (table, compact, detailed)
- `date-format <format>` - Set date format (locale, iso, short)
- `show` - Show current configuration

#### `tt ignore`

Manage ignore patterns in .taskignore file.

```bash
tt ignore <action> [pattern]
```

Actions:
- `list` - Show current ignore patterns
- `add <pattern>` - Add a new ignore pattern
- `remove <pattern>` - Remove an ignore pattern
- `init` - Create a default .taskignore file

#### `tt stats`

Show task statistics.

```bash
tt stats
```

### Command Aliases

TaskTracker provides several command aliases for convenience:

- `tt status` → alias for `tt list`
- `tt ls` → alias for `tt list`
- `tt files` → alias for `tt changes`
- `tt config` → alias for `tt update-config`
- `tt check` → alias for `tt verify`

## Examples

```bash
# Initialize and add a task
tt init
tt add

# Or quickly add a task
tt quick "Fix login button bug" bug p1-critical

# List tasks
tt list
tt list --status todo
tt list --category feature --priority p1-critical

# Update a task
tt update 1 status in-progress
tt update 1 add-file src/components/login.js
tt update 1 comment "Fixing authentication flow"

# Track file changes
tt changes
tt changes src/components

# View statistics
tt stats

# Archive a completed task
tt archive 1 "Feature completed and tested"

# Update configuration
tt update-config add-category security
tt update-config show

# Verify installation
tt verify --fix
```