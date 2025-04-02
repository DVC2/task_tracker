# TaskTracker + Cursor IDE Quick Start

This guide helps you get started with TaskTracker in Cursor IDE with Claude AI assistance.

## Setup in 2 Minutes

1. **Install TaskTracker**:
   ```bash
   npm install -g tasktracker-cli
   ```

2. **Initialize in your project**:
   ```bash
   cd your-project
   tt init
   ```

3. **Create a `.cursorrules` file** in your project root:
   ```bash
   # Copy the example file from the docs directory
   cp node_modules/tasktracker-cli/docs/.cursorrules-example .cursorrules
   
   # Or if you installed TaskTracker globally
   # Visit the docs repository for the example file:
   # https://github.com/TaskTracker/docs/.cursorrules-example
   ```

4. **Create your first task**:
   ```bash
   tt quick "My first task" feature
   ```

## Working with Claude

Claude can directly interact with TaskTracker through natural language:

| Say to Claude | What happens |
|---------------|--------------|
| "Show me all tasks" | Lists all tasks |
| "Create a task to fix the login page" | Creates a new task |
| "Mark task #1 as in progress" | Updates task status |
| "Link this file to task #1" | Links current file to task |
| "Show me task statistics" | Displays statistics |

## Basic Claude Workflow

1. **Tell Claude what you're working on**:
   ```
   I'm working on task #2 to implement user authentication
   ```

2. **Let Claude help you implement**:
   ```
   Can you create a login component for this task?
   ```

3. **Track changes**:
   ```
   Check which files have changed for this task
   ```

4. **Update task status**:
   ```
   Mark task #2 as in-progress
   ```

## Task Workflows

### Creating Tasks

You can create tasks directly or ask Claude to do it:

```bash
# Direct command
tt quick "Implement user profile" feature

# Or ask Claude
# "Create a new task to implement the user profile page"
```

### Working on Tasks

```bash
# See what tasks you have
tt list

# Start working on a task
tt update 2 status in-progress

# Link files to your task
tt update 2 add-file src/components/Profile.js

# Add comments as you work
tt update 2 comment "Implemented basic layout"
```

### Completing Tasks

```bash
# Check which files you modified
tt changes

# Mark task as done
tt update 2 status done

# See your progress
tt stats
```

## Tips for Success

1. **Always tell Claude which task you're working on**
2. **Use task IDs in commit messages**: `feat: Implement user profile (Task #2)`
3. **Update task status as you progress**
4. **Link relevant files to tasks**
5. **Check task statistics regularly**

## Further Resources

- [Cursor Integration](cursor-integration.md) - Detailed guide for Cursor integration
- [Task Workflows](task-workflows.md) - Common task management patterns
- [AI Integration](AI-INTEGRATION.md) - Working with Claude and other AI assistants
- [QUICK-GUIDE.md](QUICK-GUIDE.md) - Complete command reference 