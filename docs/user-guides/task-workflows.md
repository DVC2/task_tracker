# TaskTracker Workflows

This guide covers common workflows when using TaskTracker in your development process, with particular focus on integration with Cursor IDE.

## Basic Task Workflow

### 1. Starting Your Day

```bash
# See what tasks are in progress
tt list --current

# Or view all tasks
tt list
```

### 2. Creating a New Task

```bash
# Quick task creation
tt quick "Implement user authentication" feature

# Interactive task creation with more details
tt add
```

### 3. Working on a Task

```bash
# Mark a task as in-progress
tt update 2 status in-progress

# Add a comment about what you're doing
tt update 2 comment "Working on JWT implementation"

# Link relevant files to the task
tt update 2 add-file src/auth/jwt.js
tt update 2 add-file src/middleware/auth.js
```

### 4. Tracking Changes

```bash
# See which files changed for which tasks
tt changes
```

### 5. Completing Work

```bash
# Mark the task as complete
tt update 2 status done
```

## Working with Cursor IDE

### Setting Up Cursor Integration

1. Initialize TaskTracker in your project:
   ```bash
   tt init
   ```

2. Make sure your `.cursorrules` file is in the project root (if not already present).

### Using TaskTracker with Claude Assistant

Claude in Cursor can access TaskTracker with natural language:

| What you can say | What it does |
|------------------|--------------|
| "Show me all tasks" | Lists all tasks |
| "Create a task to implement login" | Creates a new task |
| "Mark task #3 as in progress" | Updates task status |
| "Link this file to task #3" | Links current file to task |
| "Show me task statistics" | Displays task stats |

### Example: Creating Components Based on Tasks

1. Tell Claude about your task:
   ```
   I'm working on task #3 to implement user authentication.
   ```

2. Ask Claude to generate a component:
   ```
   Create a login form component for task #3
   ```

3. Claude can reference the task in the code:
   ```jsx
   /**
    * Task #3: Implement user authentication
    * Status: in-progress
    * Category: feature
    */
   function LoginForm() {
     // Implementation
   }
   ```

### Example: Tracking Changes with Claude

1. Ask Claude to track changes:
   ```
   Check which files have changed for my current tasks
   ```

2. Claude runs the changes command and shows you the output.

3. Link new files to tasks:
   ```
   Link the current file to task #4
   ```

## Quick Reference

| Command | Description |
|---------|-------------|
| `tt list` | List all tasks |
| `tt quick "Task name" category` | Create a task quickly |
| `tt update <id> status <status>` | Update task status |
| `tt view <id>` | View task details |
| `tt changes` | Show file changes |
| `tt stats` | Show task statistics |

## Advanced Workflows

### Using Task Stats for Progress Reports

```bash
# See task statistics summary
tt stats

# Generate a more detailed report
tt snapshot
```

### Filtering Tasks for Focus

```bash
# Show only in-progress tasks
tt list in-progress

# Filter by category
tt list --category=feature

# Search by keyword
tt list --keyword=authentication
```

### Adding Task Context for Claude

```bash
# Generate AI-friendly context
tt ai-context

# Generate context for a specific task
tt ai-context 2
```

This helps Claude understand the broader context of your work and provide more relevant assistance. 