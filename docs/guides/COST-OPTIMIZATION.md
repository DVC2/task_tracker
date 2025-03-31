# TaskTracker Cost Optimization Guide

This guide provides strategies to minimize premium tool call costs when using TaskTracker with AI assistants like Claude. Each premium tool call costs approximately $0.05, so optimizing usage can lead to significant savings.

## Quick Reference

| Strategy | Description | Cost Reduction |
|----------|-------------|----------------|
| Batch Commands | Use tasktracker-batch to run multiple commands at once | 80-95% |
| Minimal Output | Use --minimal flag to reduce token usage | 30-50% |
| Silent Mode | Use --silent flag to suppress non-essential output | 40-60% |
| JSON Mode | Use --json flag for structured data processing | 20-40% |
| Task Templates | Use predefined templates for common operations | 30-70% |
| Aliases | Use shell aliases to shorten commands | 10-20% |

## Using tasktracker-batch

The most effective way to reduce premium tool calls is to use the batch processor:

```bash
# Create a batch file (commands.txt)
quick "Fix login button" bugfix
quick "Add user profile" feature
update 1 status in-progress
list

# Run the batch file
./bin/tasktracker-batch commands.txt

# Or use stdin
cat commands.txt | ./bin/tasktracker-batch --stdin
```

This runs all commands in a single tool call instead of making a separate call for each command.

## Minimal Output Mode

Use the `--minimal` flag to reduce output verbosity and token usage:

```bash
tasktracker list --minimal
```

This mode:
- Removes decorative characters and emojis
- Simplifies table formatting
- Condenses output spacing
- Reduces overall token count

## Silent Mode

Use the `--silent` flag to suppress all non-essential output:

```bash
tasktracker update 1 status in-progress --silent
```

Only errors and explicitly requested data will be shown.

## JSON Output

Use the `--json` flag for structured data that can be processed efficiently:

```bash
tasktracker list --json > tasks.json
```

This outputs clean JSON data without formatting overhead.

## Combining Optimization Strategies

For maximum savings, combine multiple strategies:

```bash
# JSON + Silent mode
tasktracker list --json --silent > tasks.json

# Minimal + Batch processing
echo "list --minimal" | ./bin/tasktracker-batch --stdin

# Create a "silent batch" file
update 1 status in-progress --silent
update 2 status in-progress --silent
update 3 status in-progress --silent
```

## Task Context Caching

Cache task context locally rather than repeatedly querying for it:

```bash
# Generate AI context once
tasktracker view 1 --json > task1_context.json

# Reference the cached context in AI conversations
```

## Shell Aliases and Functions

Add these to your `.bashrc` or `.zshrc` to reduce command length:

```bash
# Basic aliases
alias tt="tasktracker"
alias ttq="tasktracker quick"
alias ttl="tasktracker list"
alias ttv="tasktracker view"
alias ttu="tasktracker update"

# Function for common update patterns
tt_done() {
  tasktracker update "$1" status done --minimal
}

tt_progress() {
  tasktracker update "$1" status in-progress --minimal
}

# Batch creation function
tt_batch() {
  ./bin/tasktracker-batch "$1"
}
```

## Reusable Task Templates

Create reusable templates for common task patterns:

```bash
# sprint-start.sh - Start all tasks for a sprint
#!/bin/bash
cat << EOF | ./bin/tasktracker-batch --stdin
update $1 status in-progress --silent
update $2 status in-progress --silent
update $3 status in-progress --silent
list --minimal
EOF
```

## Real-world Optimization Examples

### Example 1: Daily Standup Update

**Unoptimized approach (4 tool calls):**
```
tasktracker list
tasktracker update 1 status in-progress
tasktracker update 2 status done
tasktracker list
```

**Optimized approach (1 tool call):**
```bash
cat << EOF | ./bin/tasktracker-batch --stdin
list --minimal
update 1 status in-progress --silent
update 2 status done --silent
list --minimal
EOF
```

**Savings: 75% (3 fewer tool calls = $0.15)**

### Example 2: Creating Multiple Related Tasks

**Unoptimized approach (5 tool calls):**
```
tasktracker quick "Set up authentication API" feature
tasktracker quick "Create login form" feature
tasktracker quick "Add form validation" feature
tasktracker update 2 depends-on 1
tasktracker update 3 depends-on 2
```

**Optimized approach (1 tool call):**
```bash
cat << EOF | ./bin/tasktracker-batch --stdin
quick "Set up authentication API" feature --silent
quick "Create login form" feature --silent
quick "Add form validation" feature --silent
update 2 depends-on 1 --silent
update 3 depends-on 2 --silent
list --minimal
EOF
```

**Savings: 80% (4 fewer tool calls = $0.20)**

### Example 3: Task Report Generation

**Unoptimized approach (3+ tool calls):**
```
tasktracker list --category=feature
tasktracker list --category=bugfix
tasktracker list --status=done
```

**Optimized approach (1 tool call):**
```bash
cat << EOF | ./bin/tasktracker-batch --stdin
list --category=feature --json > features.json
list --category=bugfix --json > bugfixes.json
list --status=done --json > completed.json
EOF
```

**Savings: 67% (2 fewer tool calls = $0.10)**

## Summary of Best Practices

1. **Always batch related commands** - Use tasktracker-batch whenever you need to run multiple commands
2. **Use minimal/silent flags** - Reduce token usage with --minimal or --silent flags
3. **Create task templates** - Create reusable scripts for common workflows
4. **Cache context locally** - Generate context files once and reuse them
5. **Use structured output** - Use --json flag for machine processing
6. **Use shell aliases** - Create shortcuts for common commands

By following these optimization strategies, you can significantly reduce the cost of using TaskTracker with AI assistants while maintaining all functionality.

## Claude Agent Cost Optimization

When using TaskTracker with Claude agents in Cursor, follow these specific guidelines to minimize premium tool call costs:

### Use Cursor Rules Shortcuts

Claude agents should always use the shortcuts defined in `.cursorrules` instead of raw commands:

```
# PREFERRED (single tool call)
task.get_tasks

# AVOID (same thing, but doesn't use predefined shortcut)
tasktracker list --minimal
```

### Consolidate Commands in Batch Files

For complex workflows, create a batch file and run it through a single tool call:

```
# Create claude-batch.txt
quick "Fix bug reported by user" bugfix --silent
update 25 status in-progress --silent
list --minimal

# Run as one operation
task.batch claude-batch.txt
```

### Avoid Redundant Context Fetching

Claude should cache task context between interactions rather than repeatedly fetching it:

```
# GOOD PRACTICE
# First interaction: Fetch context once
task.context 12

# Later interactions: Reference same task without refetching
"For task #12, I'm modifying the authentication flow..."
```

### Cost-Per-Operation Analysis

| Operation | Raw Commands | Cost | With Optimization | Cost | Savings |
|-----------|--------------|------|-----------------|------|---------|
| Create task + update status | 2 tool calls | $0.10 | 1 batch call | $0.05 | 50% |
| Daily standup update (5 tasks) | 6 tool calls | $0.30 | 1 batch call | $0.05 | 83% |
| Generate PR from task | 2 tool calls | $0.10 | 1 task.pr_desc call | $0.05 | 50% |

### Claude-Specific Batch Templates

Add these to your project to help Claude reduce tool calls:

```bash
# claude-daily.txt template
list --minimal
update 1 status done --silent
update 2 status in-progress --silent
update 3 status in-progress --silent
list --minimal
``` 