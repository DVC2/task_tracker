# TaskTracker Quick Reference Guide

This guide provides a quick overview of common TaskTracker commands and workflows.

## Installation

```bash
# Global installation (recommended)
npm install -g tasktracker-cli

# Initialize in your project
cd your-project
tt init
```

## Most Common Commands

| Command | Description | Example |
|---------|-------------|---------|
| `tt init` | Initialize TaskTracker | `tt init` |
| `tt quick` | Create a task quickly | `tt quick "Fix login button" bugfix` |
| `tt add` | Create a task interactively | `tt add` |
| `tt list` | List all tasks | `tt list` |
| `tt view` | View task details | `tt view 2` |
| `tt update` | Update a task | `tt update 3 status in-progress` |
| `tt changes` | Show file changes | `tt changes` |
| `tt stats` | Show task statistics | `tt stats` |
| `tt help` | Show help information | `tt help` |

## Task Management

### Creating Tasks

```bash
# Quick task creation
tt quick "Fix login button" bugfix

# With related files
tt quick "Update navigation" feature src/components/Nav.js
```

### Updating Tasks

```bash
# Change status
tt update 2 status in-progress
tt update 2 status done

# Add comments
tt update 2 comment "Fixed the alignment issue"

# Link files to tasks
tt update 2 add-file src/components/Login.js

# Remove files from tasks
tt update 2 remove-file src/components/Login.js
```

### Viewing Tasks

```bash
# List all tasks
tt list

# Filter by status
tt list todo
tt list in-progress
tt list done

# Filter by other criteria
tt list --category=feature
tt list --priority=p1-high
tt list --keyword=authentication

# View task details
tt view 2
```

### Tracking Changes

```bash
# Show all changed files
tt changes

# Show changes in specific directory
tt changes src/components
```

## Task Statistics

```bash
# Show task statistics summary
tt stats

# Take a more detailed snapshot
tt snapshot
```

## Using with Claude in Cursor

Cursor's Claude AI assistant can interact directly with TaskTracker using natural language:

```
"Show me all tasks"
"Create a new task to implement login"
"Mark task #3 as in progress"
"Link this file to task #3"
"Show me task statistics"
```

See the [Cursor Integration](cursor-integration.md) guide for more details.

## Tips for Success

1. Create tasks for all significant work
2. Update task statuses when you start and finish work
3. Link relevant files to tasks as you work on them
4. Regularly check task statistics to monitor progress
5. Use task IDs in commit messages and PR descriptions 