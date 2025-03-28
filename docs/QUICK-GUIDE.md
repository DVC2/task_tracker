# TaskTracker Quick Reference Guide

This guide provides a quick overview of the most common TaskTracker commands and workflows.

## Installation

```bash
# Simple one-command installation
node install.js

# Automated installation (configures Git hooks and cron jobs)
node install.js --auto
```

## Task Management Commands

| Command | Description |
|---------|-------------|
| `node tasktracker.js init` | Initialize TaskTracker in a project |
| `node tasktracker.js add` | Create a new task |
| `node quick-task.js "Task title" [category] [files...]` | Quick task creation |
| `node tasktracker.js update` | Update an existing task |
| `node tasktracker.js list` | List all tasks |
| `node tasktracker.js list todo` | List only 'todo' tasks |
| `node tasktracker.js view 1` | View details of task #1 |
| `node tasktracker.js changes` | Check for changes in tracked files |
| `node tasktracker.js release` | Create a new release |

## Statistics Commands

| Command | Description |
|---------|-------------|
| `node stats-tracker.js snapshot` | Take a snapshot of current project state |
| `node stats-tracker.js report text` | Generate text report |
| `node stats-tracker.js report html` | Generate HTML report |
| `node stats-tracker.js report json` | Generate JSON report |
| `node stats-tracker.js compare 7` | Compare with state 7 days ago |
| `node stats-tracker.js trends` | Show completion trends and predictions |

## Common Workflows

### Starting a New Feature

```bash
# Create a task
node tasktracker.js add
# (Enter details when prompted)

# Work on your files...

# Check what files changed
node tasktracker.js changes

# Update task status
node tasktracker.js update
# (Select task and update status)
```

### Creating a Release

```bash
# Make sure tasks are up to date
node tasktracker.js list

# Create release
node tasktracker.js release

# Generate a report
node stats-tracker.js report html
```

### Automated Usage with Git Hooks

When set up via `auto-tracker.sh`, TaskTracker will:
1. Show changed files on pre-commit
2. Prompt to update task statuses
3. Take a statistics snapshot automatically

### Quick Task Creation

For faster task creation without interactive prompts:

```bash
# Simple task with default category (feature)
node quick-task.js "Fix the login button"

# Specify category
node quick-task.js "Update CSS" bugfix

# Add related files
node quick-task.js "User profile" feature src/profile.js src/api/user.js
```

## Tips for AI Integration

When working with AI assistants:
- Share task IDs you're working on
- Run `tasktracker.js changes` to identify relevant files
- Use non-interactive mode: `node stats-tracker.js -n snapshot`

## File Locations

- Configuration: `.tasktracker/config.json`
- Tasks: `.tasktracker/tasks.json`
- Reports: `.tasktracker/reports/`
- Changelog: `CHANGELOG.md` 