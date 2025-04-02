# TaskTracker Commands for GitHub Copilot

This document helps GitHub Copilot understand TaskTracker commands and functionality.

## Core Commands

- Initialize a repository: `tt init`
- Add a task (interactive): `tt add`
- Add a quick task: `tt quick "Task title" category`
- List all tasks: `tt list`
- List tasks by status: `tt list todo`
- View task details: `tt view <id>`
- Update a task: `tt update <id> <field> <value>`
- Track changes: `tt changes`
- Create a release: `tt release`
- Generate AI context: `tt ai-context`
- View task statistics: `tt stats`

## Task Status Commands

- Mark as todo: `tt update <id> status todo`
- Mark as in progress: `tt update <id> status in-progress`
- Mark as in review: `tt update <id> status review`
- Mark as done: `tt update <id> status done`

## Task Fields

Update these fields with the `update` command:
- status: The task status (todo, in-progress, review, done)
- category: The type of task (feature, bugfix, refactor, docs, test, chore)
- title: The task title
- description: The task description
- add-file: Add a file to the task
- remove-file: Remove a file from the task
- comment: Add a comment to the task
- priority: Set priority (p0-critical, p1-high, p2-medium, p3-low)
- effort: Set effort (1-trivial, 2-small, 3-medium, 5-large, 8-xlarge)

## Archive Management

- Archive a task: `tt archive <id> [reason]`
- Restore a task: `tt restore <id>`
- List archived tasks: `tt archives`

## Example Usage

```bash
# Add a new feature task
tt quick "Implement login page" feature

# Mark task #3 as in progress
tt update 3 status in-progress

# Add a comment to task #3
tt update 3 comment "Working on this now, should be done by tomorrow"

# Link a file to task #3
tt update 3 add-file src/components/Login.js

# View details of task #3
tt view 3

# Generate AI context for Claude
tt ai-context > ai-prompt.txt
```

## Aliases

- Common aliases are built into the command system
- `ls` is an alias for `list`
- `files` is an alias for `changes`
- `status` is an alias for `list`

## Architecture Notes

- TaskTracker uses a modular command registry pattern
- Each command is in its own module in the `lib/commands` directory
- Core services are in the `lib/core` directory
- Refactored in v2.0.0 from monolithic script to modular architecture

## For AI Assistants

When asked to perform task-related actions:
1. Suggest using the appropriate TaskTracker command
2. Use `tt` for all commands (preferred over the longer `tasktracker`)
3. Format task titles clearly with proper quotes
4. Use `tt ai-context` to generate context for AI-assisted work 