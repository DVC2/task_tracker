# TaskTracker Reports & Statistics

TaskTracker provides simple yet powerful reporting capabilities to help you track your project's progress.

## Quick Statistics

The quickest way to see your project's status:

```bash
# Show task statistics summary
tt stats
```

This provides an overview of:
- Total tasks and completion rate
- Task breakdown by status (todo, in-progress, review, done)
- Task breakdown by category (feature, bugfix, etc.)

## Basic Reports

For more detailed information:

```bash
# Take a snapshot of current state
tt snapshot
```

Snapshots capture task counts, statuses, categories, and more detailed metrics about your project.

## Using Reports with Claude

Claude can help you interpret reports and make decisions based on them:

1. **Generate statistics:**
   ```bash
   tt stats
   ```

2. **Share with Claude:**
   ```
   Here are my project statistics. What should I focus on next?
   ```

3. **Ask for insights:**
   ```
   Based on these stats, which tasks should I prioritize?
   ```

## Common Reporting Workflows

### Starting Your Day

```bash
# Get an overview of current tasks
tt stats

# Then focus on in-progress tasks
tt list in-progress
```

### Planning Your Week

```bash
# Take a snapshot to record current state
tt snapshot

# Review completed tasks
tt list done

# Create new tasks for upcoming work
tt add
```

### Project Review

```bash
# Generate statistics
tt stats

# Look at task breakdown by category
tt list --category=feature

# Check recently completed tasks
tt list done
```

## Tips for Effective Reporting

1. **Take regular snapshots** to track progress over time
2. **Use task categories consistently** for better reporting
3. **Keep task statuses up-to-date** for accurate statistics
4. **Review statistics weekly** to maintain project momentum
5. **Share reports with Claude** for help with prioritization 