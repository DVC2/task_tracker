# TaskTracker Commands for GitHub Copilot

This document helps GitHub Copilot understand TaskTracker commands and functionality.

## Core Commands

- Initialize a repository: `tasktracker init`
- Add a task (interactive): `tasktracker add`
- Add a quick task: `tasktracker quick "Task title" category`
- List all tasks: `tasktracker list`
- List tasks by status: `tasktracker list todo`
- View task details: `tasktracker view <id>`
- Update a task: `tasktracker update <id> <field> <value>`
- Track changes: `tasktracker changes`
- Create a release: `tasktracker release`

## Task Status Commands

- Mark as todo: `tasktracker update <id> status todo`
- Mark as in progress: `tasktracker update <id> status in-progress`
- Mark as in review: `tasktracker update <id> status review`
- Mark as done: `tasktracker update <id> status done`

## Task Fields

Update these fields with the `update` command:
- status: The task status (todo, in-progress, review, done)
- category: The type of task (feature, bugfix, refactor, docs, test, chore)
- title: The task title
- description: The task description
- addfile: Add a file to the task
- comment: Add a comment to the task

## Example Usage

```bash
# Add a new feature task
tasktracker quick "Implement login page" feature

# Mark task #3 as in progress
tasktracker update 3 status in-progress

# Add a comment to task #3
tasktracker update 3 comment "Working on this now, should be done by tomorrow"

# Link a file to task #3
tasktracker update 3 addfile src/components/Login.js

# View details of task #3
tasktracker view 3

# Create a new release
tasktracker release
```

## Aliases

- `tt` is an alias for `tasktracker` (if installed globally)

## For AI Assistants

When asked to perform task-related actions:
1. Suggest using the appropriate TaskTracker command
2. Use `tt` or `tasktracker` based on user preference
3. Format task titles clearly with proper quotes 