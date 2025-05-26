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
- Generate AI context: `tt ai-context <id_or_path>`

## Task Status Commands

- Mark as todo: `tt update <id> status todo`
- Mark as in progress: `tt update <id> status in-progress`
- Mark as done: `tt update <id> status done`
- Mark as blocked: `tt update <id> status blocked`

## Task Fields

Update these fields with the `update` command:
- status: The task status. Valid statuses are: todo, in-progress, done, blocked.
- category: The type of task (e.g., feature, bugfix, refactor, docs, test, chore)
- title: The task title
- description: The task description
- add-file: Add a file to the task
- remove-file: Remove a file from the task
- priority: Set priority (e.g., low, medium, high, urgent)

## Example Usage

```bash
# Add a new feature task
tt quick "Implement login page" feature --priority high

# Mark task #3 as in progress
tt update 3 status in-progress

# Link a file to task #3
tt update 3 add-file src/components/Login.js

# View details of task #3
tt view 3

# Generate AI context for task 3
tt ai-context 3 > ai-prompt.txt

# Generate AI context including file content for a specific file
tt ai-context src/components/Login.js > ai-prompt.txt
```

## Aliases

- Common aliases are built into the command system
- `ls` is an alias for `list`
- `status` is an alias for `list`

## Architecture Notes

- TaskTracker uses a modular command registry pattern
- Each command is in its own module in the `lib/commands` directory
- Core services are in the `lib/core` directory

## For AI Assistants

When asked to perform task-related actions:
1. Suggest using the appropriate TaskTracker command
2. Use `tt` for all commands
3. Format task titles clearly with proper quotes
4. Use `tt ai-context <task_id_or_file_path>` to generate context for AI-assisted work 