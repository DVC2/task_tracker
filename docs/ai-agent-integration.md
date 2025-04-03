# AI Agent Integration with TaskTracker

TaskTracker has been enhanced with features specifically designed to make it easier for AI agents to interact with the application. This guide outlines these features and provides examples of how to use them.

## Key Integration Features

### 1. Structured JSON Output

All commands can now output in a structured JSON format by adding the `--json` flag. This makes it easy for AI agents to parse and understand the command results.

```bash
tt list --json
```

The output follows a consistent structure:

```json
{
  "success": true,
  "data": [...],
  "error": null,
  "metadata": {
    "timestamp": "2025-04-03T12:00:00.000Z",
    "command": "list",
    "count": 10,
    "filters": {...}
  }
}
```

### 2. Batch Operations

To reduce the number of API calls needed, TaskTracker now supports batch operations through the `batch` command. This allows multiple operations to be performed in a single call.

```bash
tt batch operations.json
```

Where `operations.json` contains:

```json
{
  "operations": [
    {
      "type": "create",
      "data": {
        "title": "Implement feature X",
        "category": "feature",
        "priority": "p1-high"
      }
    },
    {
      "type": "update",
      "taskId": 5,
      "updates": {
        "status": "in-progress"
      }
    }
  ]
}
```

### 3. Non-Interactive Mode

All commands now support a `--non-interactive` flag that skips prompts and uses default values, making it suitable for automation.

```bash
tt add --non-interactive --title="Fix bug" --category="bugfix" --priority="p1-high"
```

### 4. Standardized Error Handling

Error responses are now standardized to make error handling consistent:

```json
{
  "success": false,
  "data": null,
  "error": "Task not found",
  "metadata": {
    "timestamp": "2025-04-03T12:00:00.000Z",
    "errorCode": "NOT_FOUND"
  }
}
```

## Examples for AI Agent Integration

### Example 1: Creating a Task

```bash
tt quick "Implement login feature" feature --priority=p1-high --json
```

### Example 2: Getting All Tasks for a Category

```bash
tt list --category=bugfix --json
```

### Example 3: Updating a Task Status

```bash
tt update 5 status in-progress --json
```

### Example 4: Batch Processing Multiple Updates

```bash
tt batch '{
  "operations": [
    {
      "type": "update",
      "taskId": 1,
      "updates": { "status": "in-progress" }
    },
    {
      "type": "update",
      "taskId": 2,
      "updates": { "status": "review" }
    }
  ]
}'
```

## Supported Operation Types for Batch Processing

The batch command supports the following operation types:

- `create`: Create a new task
- `update`: Update an existing task
- `delete`: Delete a task
- `add-file`: Add a file to a task
- `remove-file`: Remove a file from a task
- `add-comment`: Add a comment to a task
- `change-status`: Change the status of a task
- `change-category`: Change the category of a task
- `change-priority`: Change the priority of a task
- `change-effort`: Change the effort estimation of a task

## Filtering Options

All filterable data can be accessed with query parameters:

```bash
tt list --status=todo --category=feature --priority=p1-high --json
```

## Pagination Support

For large task lists, you can paginate results:

```bash
tt list --limit=10 --json
```

## Data Structures

### Task Object

```json
{
  "id": 1,
  "title": "Task Title",
  "description": "Task description",
  "category": "feature",
  "status": "todo",
  "priority": "p1-high",
  "effort": "3-medium",
  "createdBy": "User",
  "created": "2025-04-03T10:24:40.688Z",
  "lastUpdated": "2025-04-03T10:24:40.690Z",
  "relatedFiles": ["src/file.js"],
  "comments": [
    {
      "author": "User",
      "date": "2025-04-03T10:24:40.688Z",
      "text": "Comment text"
    }
  ]
}
```

## Error Codes

Common error codes that may be returned:

- `NOT_FOUND`: The requested resource was not found
- `INVALID_INPUT`: The input data was invalid
- `NOT_INITIALIZED`: TaskTracker has not been initialized
- `PERMISSION_DENIED`: Permission denied for the operation
- `LOAD_ERROR`: Error loading data
- `COMMAND_ERROR`: General command execution error 