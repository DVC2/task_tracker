# TaskTracker Cursor IDE Integration

This guide explains how to use TaskTracker with Cursor IDE and Claude AI assistant to enhance your productivity.

## Benefits of Using TaskTracker with Cursor

- **AI-Aware Task Management**: Claude can understand your tasks and context
- **Natural Language Commands**: Ask Claude to run TaskTracker commands for you
- **Context-Rich Code Generation**: Claude creates code with task references
- **Efficient Workflows**: Track tasks without leaving your editor

## Setting Up Integration

1. **Install TaskTracker:**
   ```bash
   npm install -g tasktracker-cli
   ```

2. **Initialize in your project:**
   ```bash
   cd your-project
   tt init
   ```

3. **Create a `.cursorrules` file** in your project root with TaskTracker commands. Use this example or add it to your existing rules:

   ```json
   {
     "commands": [
       {
         "name": "task.get_tasks",
         "command": "tt list --minimal",
         "description": "Get all tasks"
       },
       {
         "name": "task.view_task",
         "command": "tt view $1",
         "description": "View a specific task by ID",
         "args": ["task_id"]
       },
       {
         "name": "task.add_quick",
         "command": "tt quick \"$1\" $2",
         "description": "Add a quick task with title and category",
         "args": ["title", "category"]
       },
       {
         "name": "task.status_todo",
         "command": "tt update $1 status todo",
         "description": "Set task status to todo",
         "args": ["task_id"]
       },
       {
         "name": "task.status_in_progress",
         "command": "tt update $1 status in-progress",
         "description": "Set task status to in-progress",
         "args": ["task_id"]
       },
       {
         "name": "task.status_review",
         "command": "tt update $1 status review",
         "description": "Set task status to review",
         "args": ["task_id"]
       },
       {
         "name": "task.status_done",
         "command": "tt update $1 status done",
         "description": "Set task status to done",
         "args": ["task_id"]
       },
       {
         "name": "task.comment",
         "command": "tt update $1 comment \"$2\"",
         "description": "Add a comment to a task",
         "args": ["task_id", "comment"]
       },
       {
         "name": "task.add_file",
         "command": "tt update $1 add-file $CURSOR_FILE",
         "description": "Link current file to a task",
         "args": ["task_id"]
       },
       {
         "name": "task.track_changes",
         "command": "tt changes",
         "description": "Track file changes"
       },
       {
         "name": "task.stats",
         "command": "tt stats",
         "description": "Show task statistics"
       },
       {
         "name": "task.ai_context",
         "command": "tt ai-context $1",
         "description": "Generate AI-friendly context",
         "args": ["task_id?"]
       }
     ]
   }
   ```

## Using with Claude Assistant

Here are some examples of how to interact with TaskTracker through Claude:

### View Tasks

**You to Claude**: "Show me all the tasks"

Claude will run: `task.get_tasks`

### Create a Task

**You to Claude**: "Create a new task to implement user authentication"

Claude will ask for details and run: `task.add_quick "Implement user authentication" feature`

### Update a Task

**You to Claude**: "Mark task #3 as in progress"

Claude will run: `task.status_in_progress 3`

### Link Files to Tasks

**You to Claude**: "Link this file to task #3"

Claude will run: `task.add_file 3`

### Get Task Context

**You to Claude**: "Get context for task #2"

Claude will run: `task.ai_context 2`

## Task-Focused Development

Claude becomes a powerful assistant when it understands your task context:

1. **Start by mentioning the task**: "I'm working on task #3 to implement user authentication"

2. **Ask Claude for task-aware assistance**: "Help me create a JWT validation function for this task"

3. **Claude can include task references in code comments**:
   ```javascript
   /**
    * JWT Validation function for Task #3: Implement user authentication
    * Status: in-progress
    */
   function validateJWT(token) {
     // Implementation
   }
   ```

## Common Workflows

### Starting Your Day

1. Ask Claude to show your tasks: "What tasks are in progress?"
2. Select a task to work on: "I'll work on task #3 today"
3. Update the status: "Mark task #3 as in progress"

### Working on Features

1. Tell Claude about your task: "I'm implementing the login form from task #2"
2. Ask for guidance: "Help me create a responsive login form for this task"
3. When you switch files: "Link this file to task #2 as well"

### Completing Work

1. Review changes: "Show me what files have changed for task #2"
2. Mark as complete: "I've finished task #2, mark it as done"
3. Get statistics: "Show me the current task statistics"

## Tips for Efficient Usage

1. **Always reference task IDs** when discussing work with Claude
2. **Link files explicitly** as you work on them (`task.add_file`)
3. **Update task statuses** when you start and finish work
4. **Use stats and reports** to track progress
5. **Generate AI context** when you need Claude to understand your task better

## Customizing for Your Project

You can customize the `.cursorrules` file to add additional TaskTracker commands or change the existing ones to better suit your workflow. Refer to the CLI documentation for all available commands. 