# AI Integration Guide for TaskTracker

TaskTracker is designed to work seamlessly with AI coding assistants, providing them with valuable context about your project's tasks and progress. This guide explains how to get the most out of TaskTracker when working with AI assistants.

## Benefits for AI Assistance

1. **Task Context**: AI assistants can understand what you're working on and why
2. **File Relationships**: Know which files are related to specific tasks
3. **Project Overview**: Get insight into project progress and priorities
4. **Changelog Awareness**: Understand what has changed and why

## Working with AI Assistants

### Providing Task Context

When asking an AI assistant for help, reference task IDs for context:

```
I'm working on task #12 to implement user authentication. Could you help me with the JWT token validation?
```

This helps the AI understand where your request fits into the broader project.

### Showing File Changes

Use the `changes` command to show which files are associated with a task:

```bash
./tasktracker changes
```

Then share the output with the AI:

```
I'm working on these files for task #12:
- src/auth/jwt.js
- src/middleware/auth.js
- src/routes/user.js
```

### Giving Project Overview

Generate a report to share project status with AI:

```bash
./tasktracker report text
```

This gives the AI a holistic view of the project, which improves contextual understanding.

## Non-Interactive Mode

TaskTracker supports a non-interactive mode designed specifically for AI use:

```bash
# Take a snapshot without prompts
./tasktracker snapshot --non-interactive

# Generate a report
./tasktracker report text --non-interactive
```

This allows AI assistants to create tasks, take snapshots, and generate reports without requiring user input.

## Task Creation by AI

You can allow AI assistants to create tasks directly using the quick task command:

```bash
./tasktracker quick "Implement password reset feature" feature src/auth/reset.js
```

The AI can suggest this command format, making it easier to track its suggestions.

## Documentation Access

AI assistants can access TaskTracker's documentation through:

1. The `help` command:
   ```bash
   ./tasktracker help
   ```

2. The `QUICK-GUIDE.md` file:
   ```bash
   cat QUICK-GUIDE.md
   ```

## Best Practices

1. **Always reference task IDs** when discussing work with AI
2. **Share relevant parts of reports** to provide context
3. **Let AI create tasks** for features it suggests
4. **Use the `changes` command** to identify relevant files
5. **Include AI in your Git pre-commit workflow** to update task statuses

## Example Workflow

1. AI suggests a feature
2. You create a task: `./tasktracker quick "AI suggestion: Cache optimization" feature`
3. Share task ID with AI: "Let's implement task #15 for cache optimization"
4. Work on implementation with AI assistance
5. Check file changes: `./tasktracker changes`
6. Update task status: `./tasktracker update`
7. Generate a report: `./tasktracker report text`

## Configuring for AI Use

In the `.tasktracker/ai_config.json` file (created when running `./tasktracker automate`), you can configure AI-specific settings:

```json
{
  "nonInteractiveMode": true,
  "aiTaskAssistance": true,
  "defaultTaskCategory": "feature",
  "defaultTaskStatus": "todo",
  "autoUpdateChangelog": true
}
```

These settings help streamline AI interactions with TaskTracker. 