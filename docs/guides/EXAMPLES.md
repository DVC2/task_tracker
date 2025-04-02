# TaskTracker Real-World Examples

This guide provides real-world examples and workflows for TaskTracker to help you understand how to use its advanced features in practical scenarios.

## Basic Workflows

### Feature Development Workflow

```bash
# Step 1: Create a feature task for authentication system
tt quick "Implement user authentication system" feature

# Step 2: Mark it as in-progress
tt update 1 status in-progress

# Step 3: Link relevant files you're working on
tt update 1 add-file src/auth/authentication.js
tt update 1 add-file src/components/Login.js
tt update 1 add-file src/api/auth.js

# Step 4: Document progress with comments
tt update 1 comment "Implemented basic login form"
tt update 1 comment "Added API endpoints for authentication"

# Step 5: Mark for review when ready
tt update 1 status review

# Step 6: Complete the task when approved
tt update 1 status done
```

### Bug Fixing Workflow

When fixing bugs, you can track detailed debugging and fix information:

```bash
# Step 1: Create a bug task with high priority
tt quick "Fix data loading issue in dashboard" bugfix
tt update 1 priority p1-high

# Step 2: Mark as in-progress
tt update 1 status in-progress

# Step 3: Link relevant files
tt update 1 add-file src/components/Dashboard.js
tt update 1 add-file src/api/data.js

# Step 4: Document the root cause
tt update 1 comment "Root cause: API call timing issue when component mounts"

# Step 5: Document the solution
tt update 1 comment "Fixed by adding proper loading state and error handling"

# Step 6: Submit for review
tt update 1 status review
```

## Advanced Task Dependencies

TaskTracker allows you to create dependencies between tasks to model complex workflows:

```bash
# Create a series of related tasks
tt quick "Design database schema" feature
tt quick "Implement API endpoints" feature
tt quick "Create frontend components" feature
tt quick "Write integration tests" test

# Set up dependencies (Task 2 depends on Task 1)
tt update 2 depends-on 1
# Or equivalently: Task 1 blocks Task 2
tt update 1 blocks 2

# Create a dependency chain
tt update 3 depends-on 2
tt update 4 depends-on 3

# View the dependencies
tt view 4
```

### Real-world Example: Authentication System

```bash
# 1. Create tasks for different components of the authentication system
tt quick "Design authentication database schema" feature
tt quick "Implement JWT token generation and validation" feature
tt quick "Create login/signup API endpoints" feature
tt quick "Build login/signup UI components" feature
tt quick "Implement authentication middleware" feature
tt quick "Write authentication tests" test

# 2. Set up dependencies
tt update 2 depends-on 1
tt update 3 depends-on 2
tt update 4 depends-on 3
tt update 5 depends-on 2
tt update 6 depends-on 3
tt update 6 depends-on 4
tt update 6 depends-on 5

# 3. Start working on the first task
tt update 1 status in-progress
```

## Custom Fields

Custom fields allow you to extend task information with project-specific metadata:

```bash
# Add story points to tasks
tt update 1 custom story-points 5
tt update 2 custom story-points 8
tt update 3 custom story-points 3

# Assign tasks to team members
tt update 1 custom assigned-to "Alice"
tt update 2 custom assigned-to "Bob"
tt update 3 custom assigned-to "Charlie"

# Add technical information
tt update 1 custom affected-services "authentication, database"
tt update 1 custom required-env-vars "JWT_SECRET, DB_CONNECTION"
```

### Real-world Example: Sprint Planning

```bash
# 1. Create tasks for the sprint
tt quick "Implement user settings page" feature
tt update 1 priority p2-medium
tt update 1 effort 5-large
tt update 1 custom story-points 8
tt update 1 custom assigned-to "Sarah"
tt update 1 custom sprint "Sprint 23"

tt quick "Fix pagination in search results" bugfix
tt update 2 priority p1-high
tt update 2 effort 3-medium
tt update 2 custom story-points 5
tt update 2 custom assigned-to "Mike"
tt update 2 custom sprint "Sprint 23"

# 2. Add sprint metadata
tt quick "Sprint 23 Planning" chore
tt update 3 custom start-date "2023-11-01"
tt update 3 custom end-date "2023-11-14"
tt update 3 custom team-capacity "40 story points"
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
./bin/tt-batch batch_commands.txt
```

### Using Standard Input

```bash
# Pipe commands directly to the batch processor
cat << EOF | ./bin/tt-batch --stdin
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

./bin/tt-batch sprint_setup.txt
```

## AI Integration Examples

TaskTracker can provide valuable context to AI assistants like Claude to help with coding tasks:

```bash
# Generate AI context for a specific task
tt ai-context 3

# Generate context for the current task
tt ai-context --current

# Generate focused context with only related files
tt ai-context 3 --files-only

# Generate context with custom snippet length
tt ai-context 3 --snippet-length=50
```

### Real-world Example: Working with Claude

When asking Claude to help with a task:

```
I'm working on TaskTracker task #3: "Implement profile data API endpoints"

Here's the context for this task:

[Paste output from: tt ai-context 3]

Can you help me implement the API endpoint for updating user profile information?
```

## File Tracking and Change Management

Track file changes and associate them with tasks:

```bash
# See what files have changed
tt changes

# Associate changed files with a task
tt changes
# (Shows file1.js and file2.js changed)
tt update 3 add-file file1.js
tt update 3 add-file file2.js

# Get a list of files related to a task
tt view 3
```

### Real-world Example: Code Review Preparation

```bash
# Before creating a pull request, check what files changed
tt changes

# Make sure all changes are associated with tasks
tt update 5 add-file src/components/ProfileEditor.js
tt update 5 add-file src/styles/profile.css

# Generate a list of tasks and related files for PR description
tt ai-context 5 --pr-format
```

## Release Management

Create releases and track what features and fixes are included:

```bash
# Check what tasks are ready for release
tt list done

# Create a release
tt release 1.2.0

# Generate a snapshot before release
tt snapshot

# Generate a report for stakeholders
tt report html > release-1.2.0-report.html
```

### Real-world Example: Version Release

```bash
# Ensure all tasks for the release are marked as done
tt list --category=feature
tt list --category=bugfix

# Update remaining tasks
tt update 8 status done
tt update 9 status done

# Create the release
tt release 2.0.0

# Generate comprehensive release documentation
tt snapshot
tt report html > release-2.0.0.html
```

## Technical Debt Tracking

Monitor and manage technical debt in your codebase:

```bash
# Identify technical debt
tt quick "Refactor authentication service into smaller modules" technical-debt
tt update 1 priority p2-medium
tt update 1 effort 8-xlarge
tt update 1 add-file src/services/authentication.js

# Track code health metrics
tt code-health src/services

# Plan debt reduction
tt update 1 comment "Plan to address in Q3 sprint 2"
```

### Real-world Example: Debt Reduction Sprint

```bash
# Create a technical debt epic
tt quick "Code Quality Initiative Q3" technical-debt
tt update 1 priority p1-high
tt update 1 custom quarter "Q3-2023"

# Add specific debt items
tt quick "Reduce cyclomatic complexity in payment processing" technical-debt
tt update 2 depends-on 1
tt update 2 add-file src/services/payments.js
tt update 2 custom tech-debt-metric "Complexity: 32 -> target: 15"

tt quick "Improve test coverage for user module" technical-debt
tt update 3 depends-on 1
tt update 3 add-file src/models/user.js
tt update 3 custom tech-debt-metric "Coverage: 45% -> target: 80%"

# Track progress
tt update 2 status in-progress
tt code-health src/services/payments.js
```

This comprehensive guide should help you understand how to use TaskTracker's advanced features in real-world scenarios. For more information about specific commands, refer to the [CLI Reference](./cli-reference.md). 