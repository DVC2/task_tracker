# TaskTracker Real-World Examples

This guide provides real-world examples and workflows for TaskTracker to help you understand how to use its advanced features in practical scenarios.

## Basic Workflows

### Feature Development Workflow

```bash
# 1. Create a task for the new feature
tasktracker quick "Implement user authentication system" feature

# 2. Update status to in-progress when you start working
tasktracker update 1 status in-progress

# 3. Link related files as you work on them
tasktracker update 1 add-file src/auth/authentication.js
tasktracker update 1 add-file src/components/Login.js
tasktracker update 1 add-file src/api/auth.js

# 4. Add comments to document your progress
tasktracker update 1 comment "Implemented basic login form"
tasktracker update 1 comment "Added API endpoints for authentication"

# 5. Update status when ready for review
tasktracker update 1 status review

# 6. Mark as done when complete
tasktracker update 1 status done
```

### Bug Fixing Workflow

```bash
# 1. Create a task for the bug
tasktracker quick "Fix data loading issue in dashboard" bugfix
tasktracker update 1 priority p1-high

# 2. Start working on the bug
tasktracker update 1 status in-progress

# 3. Link the problematic files
tasktracker update 1 add-file src/components/Dashboard.js
tasktracker update 1 add-file src/api/data.js

# 4. Add a comment documenting the issue
tasktracker update 1 comment "Root cause: API call timing issue when component mounts"

# 5. Add another comment with the fix
tasktracker update 1 comment "Fixed by adding proper loading state and error handling"

# 6. Mark as ready for review
tasktracker update 1 status review
```

## Advanced Task Dependencies

TaskTracker allows you to create dependencies between tasks to model complex workflows:

```bash
# Create a series of related tasks
tasktracker quick "Design database schema" feature
tasktracker quick "Implement API endpoints" feature
tasktracker quick "Create frontend components" feature
tasktracker quick "Write integration tests" test

# Set up dependencies (Task 2 depends on Task 1)
tasktracker update 2 depends-on 1
# Or equivalently: Task 1 blocks Task 2
tasktracker update 1 blocks 2

# Create a dependency chain
tasktracker update 3 depends-on 2
tasktracker update 4 depends-on 3

# View the dependencies
tasktracker view 4
```

### Real-world Example: Authentication System

```bash
# 1. Create tasks for different components of the authentication system
tasktracker quick "Design authentication database schema" feature
tasktracker quick "Implement JWT token generation and validation" feature
tasktracker quick "Create login/signup API endpoints" feature
tasktracker quick "Build login/signup UI components" feature
tasktracker quick "Implement authentication middleware" feature
tasktracker quick "Write authentication tests" test

# 2. Set up dependencies
tasktracker update 2 depends-on 1
tasktracker update 3 depends-on 2
tasktracker update 4 depends-on 3
tasktracker update 5 depends-on 2
tasktracker update 6 depends-on 3
tasktracker update 6 depends-on 4
tasktracker update 6 depends-on 5

# 3. Start working on the first task
tasktracker update 1 status in-progress
```

## Custom Fields

Custom fields allow you to extend task information with project-specific metadata:

```bash
# Add story points to tasks
tasktracker update 1 custom story-points 5
tasktracker update 2 custom story-points 8
tasktracker update 3 custom story-points 3

# Assign tasks to team members
tasktracker update 1 custom assigned-to "Alice"
tasktracker update 2 custom assigned-to "Bob"
tasktracker update 3 custom assigned-to "Charlie"

# Add technical information
tasktracker update 1 custom affected-services "authentication, database"
tasktracker update 1 custom required-env-vars "JWT_SECRET, DB_CONNECTION"
```

### Real-world Example: Sprint Planning

```bash
# 1. Create tasks for the sprint
tasktracker quick "Implement user settings page" feature
tasktracker update 1 priority p2-medium
tasktracker update 1 effort 5-large
tasktracker update 1 custom story-points 8
tasktracker update 1 custom assigned-to "Sarah"
tasktracker update 1 custom sprint "Sprint 23"

tasktracker quick "Fix pagination in search results" bugfix
tasktracker update 2 priority p1-high
tasktracker update 2 effort 3-medium
tasktracker update 2 custom story-points 5
tasktracker update 2 custom assigned-to "Mike"
tasktracker update 2 custom sprint "Sprint 23"

# 2. Add sprint metadata
tasktracker quick "Sprint 23 Planning" chore
tasktracker update 3 custom start-date "2023-11-01"
tasktracker update 3 custom end-date "2023-11-14"
tasktracker update 3 custom team-capacity "40 story points"
```

## Batch Operations

Batch operations save time and reduce premium tool calls by performing multiple actions at once:

### Using batch-tasks.sh

```bash
# Create a batch file (batch_commands.txt)
echo "quick \"Implement login page\" feature
quick \"Create user registration form\" feature
quick \"Add password reset functionality\" feature
update 1 priority p1-high
update 2 priority p2-medium
update 3 priority p2-medium
update 1 effort 5-large
update 2 effort 3-medium
update 3 effort 3-medium" > batch_commands.txt

# Execute all commands at once
./bin/tasktracker-batch batch_commands.txt
```

### Using Standard Input

```bash
# Pipe commands directly to the batch processor
cat << EOF | ./bin/tasktracker-batch --stdin
quick "Refactor authentication module" refactor --silent
update 1 priority p2-medium --silent
update 1 add-file src/auth/index.js --silent
list --minimal
EOF
```

### Real-world Example: Sprint Setup

```bash
cat << EOF > sprint_setup.txt
# Create epic task
quick "User Profile Enhancement Epic" feature
update 1 priority p1-high
update 1 effort 8-xlarge
update 1 custom epic-id "EP-123"

# Create subtasks
quick "Design user profile page mockups" feature
update 2 depends-on 1
update 2 priority p2-medium
update 2 effort 3-medium
update 2 custom assigned-to "Design Team"

quick "Implement profile data API endpoints" feature
update 3 depends-on 1
update 3 priority p2-medium
update 3 effort 5-large
update 3 custom assigned-to "Backend Team"

quick "Build frontend components for profile page" feature
update 4 depends-on 2
update 4 depends-on 3
update 4 priority p2-medium
update 4 effort 5-large
update 4 custom assigned-to "Frontend Team"

quick "Write integration tests for profile features" test
update 5 depends-on 4
update 5 priority p3-low
update 5 effort 3-medium
update 5 custom assigned-to "QA Team"

# Show the task tree
list --category=feature
EOF

./bin/tasktracker-batch sprint_setup.txt
```

## AI Integration Examples

TaskTracker can provide valuable context to AI assistants like Claude to help with coding tasks:

```bash
# Generate AI context for a specific task
tasktracker ai-context 3

# Generate context for the current task
tasktracker ai-context --current

# Generate focused context with only related files
tasktracker ai-context 3 --files-only

# Generate context with custom snippet length
tasktracker ai-context 3 --snippet-length=50
```

### Real-world Example: Working with Claude

When asking Claude to help with a task:

```
I'm working on TaskTracker task #3: "Implement profile data API endpoints"

Here's the context for this task:

[Paste output from: tasktracker ai-context 3]

Can you help me implement the API endpoint for updating user profile information?
```

## File Tracking and Change Management

Track file changes and associate them with tasks:

```bash
# See what files have changed
tasktracker changes

# Associate changed files with a task
tasktracker changes
# (Shows file1.js and file2.js changed)
tasktracker update 3 add-file file1.js
tasktracker update 3 add-file file2.js

# Get a list of files related to a task
tasktracker view 3
```

### Real-world Example: Code Review Preparation

```bash
# Before creating a pull request, check what files changed
tasktracker changes

# Make sure all changes are associated with tasks
tasktracker update 5 add-file src/components/ProfileEditor.js
tasktracker update 5 add-file src/styles/profile.css

# Generate a list of tasks and related files for PR description
tasktracker ai-context 5 --pr-format
```

## Release Management

Create releases and track what features and fixes are included:

```bash
# Check what tasks are ready for release
tasktracker list done

# Create a release
tasktracker release 1.2.0

# Generate a snapshot before release
tasktracker snapshot

# Generate a report for stakeholders
tasktracker report html > release-1.2.0-report.html
```

### Real-world Example: Version Release

```bash
# Ensure all tasks for the release are marked as done
tasktracker list --category=feature
tasktracker list --category=bugfix

# Update remaining tasks
tasktracker update 8 status done
tasktracker update 9 status done

# Create the release
tasktracker release 2.0.0

# Generate comprehensive release documentation
tasktracker snapshot
tasktracker report html > release-2.0.0.html
```

## Technical Debt Tracking

Monitor and manage technical debt in your codebase:

```bash
# Identify technical debt
tasktracker quick "Refactor authentication service into smaller modules" technical-debt
tasktracker update 1 priority p2-medium
tasktracker update 1 effort 8-xlarge
tasktracker update 1 add-file src/services/authentication.js

# Track code health metrics
tasktracker code-health src/services

# Plan debt reduction
tasktracker update 1 comment "Plan to address in Q3 sprint 2"
```

### Real-world Example: Debt Reduction Sprint

```bash
# Create a technical debt epic
tasktracker quick "Code Quality Initiative Q3" technical-debt
tasktracker update 1 priority p1-high
tasktracker update 1 custom quarter "Q3-2023"

# Add specific debt items
tasktracker quick "Reduce cyclomatic complexity in payment processing" technical-debt
tasktracker update 2 depends-on 1
tasktracker update 2 add-file src/services/payments.js
tasktracker update 2 custom tech-debt-metric "Complexity: 32 -> target: 15"

tasktracker quick "Improve test coverage for user module" technical-debt
tasktracker update 3 depends-on 1
tasktracker update 3 add-file src/models/user.js
tasktracker update 3 custom tech-debt-metric "Coverage: 45% -> target: 80%"

# Track progress
tasktracker update 2 status in-progress
tasktracker code-health src/services/payments.js
```

This comprehensive guide should help you understand how to use TaskTracker's advanced features in real-world scenarios. For more information about specific commands, refer to the [CLI Reference](./cli-reference.md). 