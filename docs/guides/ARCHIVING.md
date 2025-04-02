# Task Archiving Guide

TaskTracker includes a comprehensive archiving system to help you manage completed or deferred tasks without cluttering your active task list.

## Table of Contents

1. [Archiving Tasks](#archiving-tasks)
2. [Viewing Archived Tasks](#viewing-archived-tasks)
3. [Restoring Tasks](#restoring-tasks)
4. [Advanced Usage](#advanced-usage)
   - [Batch Archiving](#batch-archiving)
   - [Export/Import](#exportimport)
   - [Reporting](#reporting)

## Archiving Tasks

When a task is completed, deferred, or otherwise no longer relevant to your current work, you can archive it using the `archive` command:

```bash
tt archive <task-id> [reason]
```

Example:
```bash
tt archive 42 "Feature deferred to next release"
```

This moves the task from your active task list to the archives, adding metadata about when it was archived and why.

## Viewing Archived Tasks

To view all archived tasks, use the `archives` command:

```bash
tt archives
```

This will display a formatted list of all archived tasks, including their IDs, titles, statuses, and when they were archived.

## Restoring Tasks

If you need to bring a task back from the archives to your active task list, use the `restore` command:

```bash
tt restore <task-id>
```

Example:
```bash
tt restore 42
```

This will move the task back to your active task list and remove the archiving metadata.

## Advanced Usage

### Batch Archiving

You can archive multiple tasks at once using a filter with the `list` command and then piping to `xargs`:

```bash
# Archive all tasks with status 'done'
tt list done --json | jq '.data.tasks[].id' | xargs -I {} tt archive {} "Sprint completed"
```

### Export/Import

You can export archived tasks to JSON for backup or analysis:

```bash
tt archives --json > archived_sprint_45.json
```

### Reporting

Generate a report of archived tasks for project documentation:

```bash
tt archives --json | tt-batch report generate-archive-summary
```

## Best Practices

1. **Always provide a reason** when archiving tasks to maintain context for future reference
2. **Regularly review archived tasks** to ensure nothing important is forgotten
3. **Archive tasks by sprint or milestone** to keep historic context grouped together
4. **Export archives periodically** for long-term project documentation

## Automation

You can set up automation to archive tasks automatically when they've been in a certain status for a period of time:

```bash
# Example cron job to archive tasks marked as 'done' for more than 14 days
0 0 * * * find ~/.tasktracker/ -name "*.json" | xargs grep -l '"status":"done"' | xargs -I {} tt archive {} "Auto-archived: Completed > 14 days ago"
```

## Integrating with Workflow

For teams using TaskTracker, consider these workflow integrations:

1. **Release Process**: Archive tasks as part of the release process to clean up the backlog
2. **Sprint Reviews**: Archive completed sprint tasks during the sprint review meeting
3. **Periodic Cleanup**: Schedule a periodic cleanup day to archive obsolete tasks

## Accessing Archived Tasks Programmatically

When building integrations or reports, you can access archived tasks in JSON format:

```bash
# Get JSON export of archived tasks
tt archives --json > archived_tasks.json
```

This produces a JSON array of archived tasks that you can process with other tools. 