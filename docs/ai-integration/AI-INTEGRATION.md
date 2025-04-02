# AI Integration Guide for TaskTracker

TaskTracker is designed to work seamlessly with AI coding assistants like Claude, providing valuable context about your project's tasks and progress.

## Benefits for AI Assistance

1. **Task Context**: Claude can understand what you're working on and why
2. **File Relationships**: Claude knows which files are related to specific tasks
3. **Project Overview**: Claude gets insight into project progress and priorities
4. **Development Awareness**: Claude understands what has changed and why

## Working with Claude in Cursor

### Providing Task Context

When asking Claude for help, reference task IDs for context:

```
I'm working on task #12 to implement user authentication. Could you help me with the JWT token validation?
```

This helps Claude understand where your request fits into the broader project.

### Showing File Changes

Show Claude which files are associated with a task:

```bash
tt changes
```

Then share the output with Claude:

```
I'm working on these files for task #12:
- src/auth/jwt.js
- src/middleware/auth.js
- src/routes/user.js
```

### Giving Project Overview

Generate a report to share project status with Claude:

```bash
tt stats
```

This gives Claude a holistic view of the project, which improves contextual understanding.

## Task Creation with Claude

You can let Claude create tasks directly:

```
Create a new task to implement the password reset feature
```

Claude will use the task.add_quick command from your .cursorrules file.

## Claude-Specific Commands

With the .cursorrules configuration, Claude can directly use these commands:

| Command | Description | Example |
|---------|-------------|---------|
| task.get_tasks | List all tasks | "Show me all tasks" |
| task.view_task | View a specific task | "Show me task #3" |
| task.add_quick | Add a task quickly | "Create a task to fix the login page" |
| task.status_todo | Set to todo | "Mark task #2 as todo" |
| task.status_in_progress | Set to in-progress | "Set task #3 to in progress" |
| task.status_review | Set to review | "Move task #4 to review" |
| task.status_done | Set to done | "Mark task #5 as complete" |
| task.comment | Add a comment | "Add comment to task #3: Fixed alignment" |
| task.add_file | Link current file | "Link this file to task #2" |
| task.track_changes | Show changed files | "Check which files have changed" |
| task.stats | Show statistics | "Show me task statistics" |
| task.ai_context | Generate context | "Get context for task #3" |

## Best Practices for Working with Claude

1. **Always reference task IDs** when discussing work with Claude
2. **Share relevant parts of reports** to provide context
3. **Let Claude create tasks** for features it suggests
4. **Use the `changes` command** to identify relevant files
5. **Use task IDs in commit messages** and PR descriptions

## Example Workflow with Claude

1. Claude suggests a feature
2. You ask Claude to create a task: "Create a task for implementing cache optimization"
3. Share task ID with Claude: "Let's implement task #15 for cache optimization"
4. Work on implementation with Claude's assistance
5. Check file changes: `tt changes`
6. Ask Claude to update task status: "Mark task #15 as in-progress"
7. Generate statistics: `tt stats`

## Creating Task-Aware Code

Claude can generate code with task references:

```javascript
/**
 * Task #15: Implement cache optimization
 * Status: in-progress
 * Category: feature
 * 
 * This function implements LRU caching for API responses
 * to reduce redundant network requests.
 */
function createLRUCache(maxSize = 100) {
  // Implementation
}
```

By using this pattern, your codebase becomes more traceable, with every feature or fix linked back to its originating task.

## Tips for Efficient Claude Integration

1. **Start conversations with task context**: "I'm working on task #3..."
2. **Use task references in commit messages**: "fix(auth): Implement JWT validation (Task #12)"
3. **Link new files to tasks proactively**: "Link this file to task #3" 
4. **Generate context when switching tasks**: "Get me context for task #5"
5. **Update task status as you work**: "Mark task #3 as in-progress" 