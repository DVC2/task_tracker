# TaskTracker Cursor IDE Integration

This guide explains how to use TaskTracker with Cursor IDE and AI coding assistants.

## Setting Up Cursor Integration

TaskTracker has first-class support for Cursor IDE through the `.cursorrules` file.

1. **Ensure TaskTracker is installed**:
   ```
   npm install -g tasktracker
   ```

2. **Copy the `.cursorrules` file**:
   Copy the `.cursorrules` file to your project root directory:
   ```
   cp /path/to/tasktracker/.cursorrules /path/to/your/project/
   ```

## Custom Commands

The `.cursorrules` file defines several TaskTracker commands that can be used directly with Cursor's AI assistant:

| Command | Description | Example Usage |
|---------|-------------|--------------|
| `task.get_tasks` | List all tasks | "Show me all the tasks" |
| `task.view_task` | View a specific task | "Show me task #3" |
| `task.add_quick` | Add a quick task | "Create a new task to implement login" |
| `task.status_todo` | Set task status to todo | "Set task #3 to todo" |
| `task.status_in_progress` | Set task status to in-progress | "Mark task #3 as in progress" |
| `task.status_review` | Set task status to review | "Move task #3 to review" |
| `task.status_done` | Set task status to done | "Mark task #3 as done" |
| `task.comment` | Add a comment to a task | "Add a comment to task #3: Fixed the login issue" |
| `task.add_file` | Link current file to a task | "Link current file to task #3" |
| `task.track_changes` | Find tasks related to modified files | "Track file changes" |
| `task.stats` | Show project statistics | "Show task statistics" |

## Keyboard Shortcuts

The `.cursorrules` file defines these keyboard shortcuts:

| Shortcut | Command | Description |
|----------|---------|-------------|
| Ctrl+Alt+T | task.get_tasks | List all tasks |
| Ctrl+Alt+N | task.add_quick | Add a quick task |
| Ctrl+Alt+C | task.track_changes | Track file changes |

## Task Comment Templates

When creating tasks with Cursor, you can use the task comment template:

```
/**
 * Task #${task.id}: ${task.title}
 * Status: ${task.status}
 * Category: ${task.category}
 * 
 * Description:
 * ${task.description}
 */
```

## Status Bar Integration

TaskTracker integrates with the Cursor status bar, displaying the current task information:

```
TaskTracker: ${task.current_task || 'No task'}
```

## Example Conversations with the AI Assistant

Here are some example conversations to help you use TaskTracker with Cursor's AI assistant:

### Viewing Tasks

**User**: "Show me all the tasks"

**AI Assistant**: *Uses task.get_tasks to display all tasks*

### Creating a Task

**User**: "Create a new task to implement user authentication"

**AI Assistant**: *Uses task.add_quick to create a new task*

"I've created a new task:"
- Task #4: Implement user authentication
- Category: feature
- Status: todo

### Updating a Task

**User**: "Mark task #3 as in progress"

**AI Assistant**: *Uses task.status_in_progress to update the task*

"I've updated task #3 to status 'in-progress'."

### Linking Files to Tasks

**User**: "I'm working on task #3. Link this file to it."

**AI Assistant**: *Uses task.add_file to link the current file*

"I've linked the current file to task #3."

## Creating Task-Related Code

You can ask the AI assistant to create code with task references:

**User**: "Create a login component for task #3"

**AI Assistant**: *Creates component with task reference comment*

```jsx
/**
 * Task #3: Implement login page
 * Status: in-progress
 * Category: feature
 * 
 * Description:
 * Create a login page with email and password inputs
 */
function LoginComponent() {
  // Implementation
}
```

## Customizing Cursor Integration

You can customize the `.cursorrules` file to add additional TaskTracker commands or change the existing ones to better suit your workflow. 