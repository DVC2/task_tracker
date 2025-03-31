# Task Archiving Guide

TaskTracker includes a powerful archiving system that allows you to maintain a clean task list while preserving historical task information. This guide explains how to use the archive functionality effectively.

## Archiving Overview

The archive system:
- Moves completed or obsolete tasks to a separate storage file
- Preserves all task data, including comments, related files, and timestamps
- Allows tasks to be restored if needed
- Keeps your active task list focused on current work

## Basic Commands

### Archiving a Task

To archive a task, use the following command with the task ID and an optional reason:

```bash
# Basic syntax
node lib/tasktracker.js archive <task-id> [reason]

# Example
node lib/tasktracker.js archive 42 "Feature deferred to next release"
```

The reason helps document why the task was archived and is visible when viewing archived tasks.

### Listing Archived Tasks

To view all archived tasks:

```bash
node lib/tasktracker.js archives
```

This will display a formatted table showing all archived tasks with their status, category, and archive date.

### Restoring a Task

If you need to bring a task back from the archives:

```bash
node lib/tasktracker.js restore <task-id>

# Example
node lib/tasktracker.js restore 42
```

This will move the task back to the active task list, removing the archive metadata.

## When to Archive Tasks

Good candidates for archiving include:

1. **Completed tasks** that are no longer relevant to current work
2. **Obsolete tasks** that will not be implemented
3. **Duplicate tasks** that were created by mistake
4. **Deferred tasks** that won't be addressed in the current development cycle

Rather than deleting these tasks, archiving preserves the historical context and allows future reference.

## Storage and Implementation

Archived tasks are stored in `.tasktracker/archives.json` in the same format as regular tasks but with additional archive metadata:

```json
{
  "archived": {
    "date": "2023-11-15T14:32:17.123Z",
    "reason": "Feature completed and deployed to production"
  }
}
```

## Best Practices

- Include meaningful reasons when archiving tasks
- Review and archive completed tasks periodically to keep your task list manageable
- Use batch archiving to archive multiple tasks at once:

```bash
# Create a batch file (archive_tasks.txt)
echo "archive 101 Task completed in sprint 45" > archive_tasks.txt
echo "archive 102 Duplicate of task 95" >> archive_tasks.txt
echo "archive 103 Feature postponed" >> archive_tasks.txt

# Execute batch archive
./bin/tasktracker-batch archive_tasks.txt
```

- Consider archiving tasks during release cycles or at the end of sprints
- Create archive reports to document completed work:

```bash
# Get JSON export of archived tasks for reporting
node lib/tasktracker.js archives --json > archived_sprint_45.json
```

## Integrating with Workflow

For teams using TaskTracker, consider these workflow integrations:

1. **Release Process**: Archive tasks as part of the release process to clean up the backlog
2. **Sprint Reviews**: Archive completed sprint tasks during the sprint review meeting
3. **Periodic Cleanup**: Schedule a periodic cleanup day to archive obsolete tasks

## Accessing Archived Tasks Programmatically

The archive functionality includes JSON output mode for integrating with other tools:

```bash
# Get machine-readable output
node lib/tasktracker.js archives --json
```

This can be used to generate reports or integrate with other tools in your workflow. 