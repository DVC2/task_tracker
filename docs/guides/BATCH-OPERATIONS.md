# Batch Operations Guide

The TaskTracker batch operations feature provides a way to perform multiple operations efficiently, reducing the number of premium tool calls when working with AI assistants like Claude.

## Overview

When using TaskTracker with AI coding assistants, each command issued can count as a "premium tool call" that may incur costs. The batch operations script allows you to:

- Add multiple tasks at once from a file
- Update the status of multiple tasks in a single operation
- Filter tasks by various criteria in a single operation
- Perform other bulk operations efficiently

## Getting Started

The batch operations script is located at `bin/batch-tasks.sh`. Make sure it's executable:

```bash
chmod +x bin/batch-tasks.sh
```

To see available commands:

```bash
./bin/batch-tasks.sh help
```

## Adding Multiple Tasks

You can add multiple tasks from a CSV or JSON file:

### CSV Format

Create a CSV file with task data:

```csv
title,description,category,status
"Fix login button","Button on login page doesn't respond to clicks","bugfix","todo"
"Add profile page","Create new user profile page","feature","in-progress"
"Update documentation","Enhance installation instructions","docs","todo"
```

Then add all tasks at once:

```bash
./bin/batch-tasks.sh add tasks.csv
```

### JSON Format

Alternatively, create a JSON file with an array of tasks:

```json
[
  {
    "title": "Fix login button",
    "description": "Button on login page doesn't respond to clicks",
    "category": "bugfix",
    "status": "todo"
  },
  {
    "title": "Add profile page",
    "description": "Create new user profile page",
    "category": "feature",
    "status": "in-progress"
  },
  {
    "title": "Update documentation",
    "description": "Enhance installation instructions",
    "category": "docs",
    "status": "todo"
  }
]
```

Add all tasks with:

```bash
./bin/batch-tasks.sh add tasks.json
```

> **Note**: Using JSON format requires the `jq` command-line tool to be installed.

## Updating Multiple Tasks

Update the status of multiple tasks at once:

```bash
# Change tasks #1, #2, and #3 to "in-progress" status
./bin/batch-tasks.sh update in-progress 1 2 3

# Mark tasks #4 and #5 as "done"
./bin/batch-tasks.sh update done 4 5
```

## Advanced Filtering

List tasks with advanced filtering criteria:

```bash
# List all tasks
./bin/batch-tasks.sh list

# List only "todo" tasks
./bin/batch-tasks.sh list todo

# List high priority tasks
./bin/batch-tasks.sh list --priority=p1-high

# List bugfix tasks
./bin/batch-tasks.sh list --category=bugfix

# Search for tasks containing a keyword
./bin/batch-tasks.sh list --keyword=authentication

# Combine multiple filters
./bin/batch-tasks.sh list todo --priority=p1-high --category=bugfix
```

## Taking Snapshots

Take a project snapshot:

```bash
./bin/batch-tasks.sh snapshot
```

## Cost Savings Estimation

By using batch operations, you can significantly reduce the number of premium tool calls:

| Operation | Individual Calls | Batch Calls | Savings |
|-----------|-----------------|------------|---------|
| Add 10 tasks | 10 | 1 | 90% |
| Update 5 tasks | 5 | 1 | 80% |
| List filtered tasks | 2-3 | 1 | 50-66% |
| Multiple filters | 4-5 | 1 | 75-80% |

## Adding Dependencies in Batch

You can add task dependencies in batch by creating a script:

```bash
#!/bin/bash
# Example: Set up a dependency chain between tasks

# Task 3 depends on Task 2
tt update 3 depends-on 2 --silent

# Task 2 depends on Task 1
tt update 2 depends-on 1 --silent

# Show the tasks with their dependencies
tt view 3
```

## Adding Custom Fields in Batch

You can add custom fields to multiple tasks at once:

```bash
#!/bin/bash
# Example: Add story points to multiple tasks

# Add story points
tt update 1 custom story-points 3 --silent
tt update 2 custom story-points 5 --silent
tt update 3 custom story-points 8 --silent

# Add assigned team members
tt update 1 custom assigned-to "Alice" --silent
tt update 2 custom assigned-to "Bob" --silent
tt update 3 custom assigned-to "Charlie" --silent

# Show the tasks with their custom fields
tt list --full
```

## Advanced Usage

### Creating Automated Workflows

You can combine batch operations with scheduled tasks or CI/CD pipelines:

```bash
# Example: Daily task summary
0 9 * * * cd /path/to/project && ./bin/batch-tasks.sh list > daily-summary.txt

# Example: Weekly snapshot
0 0 * * 0 cd /path/to/project && ./bin/batch-tasks.sh snapshot
```

### Integration with Other Scripts

The batch operations script can be called from other scripts:

```bash
#!/bin/bash
# Example: Process tasks from multiple files

PROJECT_DIR="/path/to/project"
cd $PROJECT_DIR

# Process each task file in the tasks directory
for file in tasks/*.csv; do
  ./bin/batch-tasks.sh add "$file"
done

# Generate a summary
./bin/batch-tasks.sh list
```

## Troubleshooting

### CSV Parsing Issues

If you encounter issues with CSV files, ensure:
- Fields with commas are enclosed in double quotes
- Line endings are consistent (UNIX format preferred)
- No hidden characters in the file

### JSON Parsing Issues

For JSON files:
- Ensure valid JSON format
- Install jq with `apt-get install jq` (Debian/Ubuntu) or `brew install jq` (macOS)
- Check file permissions

### Other Issues

- Make sure the script is executable (`chmod +x bin/batch-tasks.sh`)
- Verify TaskTracker is properly initialized (`tt init`)
- Check for file path issues (run from project root)

## Examples

### Example 1: Daily Task Updates

```bash
# tasks-updates.csv
"Update homepage","Add new features to homepage","feature","in-progress"
"Fix cart bug","Shopping cart calculations incorrect","bugfix","todo"

# Update script
./bin/batch-tasks.sh add tasks-updates.csv
```

### Example 2: Sprint Status Changes

```bash
# Script to mark sprint tasks as complete
SPRINT_TASKS="34 36 39 42 45"
./bin/batch-tasks.sh update done $SPRINT_TASKS
```

### Example 3: Generating Reports

```bash
# Generate a snapshot and list current tasks
./bin/batch-tasks.sh snapshot
./bin/batch-tasks.sh list > sprint-report.txt
``` 