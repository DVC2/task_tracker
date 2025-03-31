# TaskTracker

A lightweight, flexible task management system for developers. Seamlessly track tasks, changes, and project progress without leaving your codebase.

## Features

- 📋 **Task Management** - Track tasks, issues, and features with customizable categories and statuses
- 📊 **Project Statistics** - Monitor progress and visualize trends over time
- 🔄 **Git Integration** - Automatic tracking with pre-commit and post-commit hooks
- 📝 **Automated Changelog** - Keep your project history organized with structured changelog
- 📈 **Historical Snapshots** - Track progress over time with regular project snapshots
- 📊 **Trend Analysis** - View completion rates and predict project timelines
- 🖥️ **HTML Reports** - Generate beautiful reports to share with your team
- 🤖 **AI-Ready** - Works with AI assistants for better context
- 🔍 **Technical Debt Tracking** - Identify and manage technical debt with code health metrics
- ✓ **Checklists** - Create checklists within tasks to break down complex work
- 🏷️ **Prioritization** - Assign priority levels (p0-p3) and effort estimations to tasks
- 📦 **Batch Operations** - Supports bulk task operations to optimize premium tool usage
- 🔗 **Task Dependencies** - Define dependencies between tasks to manage work ordering
- 🔍 **Enhanced Search/Filter** - Filter tasks by status, priority, category, or keywords
- 🔧 **Custom Fields** - Add custom fields to tasks for specialized tracking needs
- 💰 **Cost Optimization** - Tools to minimize premium API call costs when using with AI assistants
- 📁 **Task Archiving** - Move completed or obsolete tasks to archives while preserving history

## Quick Start

### Installation

#### Global Installation (Recommended)

```bash
# Install globally via npm
npm install -g tasktracker-cli

# Initialize TaskTracker in your project
cd your-project
tasktracker init

# (Optional) Set up automation
tasktracker automate
```

#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/USERNAME/tasktracker.git

# Copy the files to your project
cp -r tasktracker/bin/* your-project/bin/
cp -r tasktracker/lib/* your-project/lib/

# Make the script executable
cd your-project
chmod +x bin/tasktracker

# Initialize TaskTracker
tasktracker init

# (Optional) Set up automation
tasktracker automate
```

### Upgrading from Previous Versions

If you've previously installed TaskTracker, you can upgrade to the latest version:

#### Upgrading Global Installation

```bash
# Update via npm
npm update -g tasktracker-cli
```

#### Upgrading Git-Based Installation

```bash
# Pull the latest changes
cd tasktracker
git pull origin main

# Copy the updated files to your project
cp -r bin/* your-project/bin/
cp -r lib/* your-project/lib/
```

Your existing tasks and data will be preserved during the upgrade. Version 2.0.0 adds several new features:
- Enhanced filtering capabilities (filter by priority, category, and keywords)
- Task dependencies to manage work ordering
- Custom fields for specialized tracking
- Improved batch operations for efficiency
- Better terminal compatibility in various environments
- Cost optimization tools for AI assistant integration

## Recent Improvements (v2.0.0)

### 🔍 Enhanced Search and Filtering
- Filter tasks by status, priority, category, or keywords
- Example: `tasktracker list --priority=p1-high --category=bugfix`
- Keyword search through titles, descriptions and comments
- Example: `tasktracker list --keyword=authentication`
- Combine multiple filters for precise results

### 🔗 Task Dependencies
- Define dependencies between tasks
- Add dependencies: `tasktracker update 3 depends-on 2`
- Mark tasks as blocking: `tasktracker update 2 blocks 3`
- Visualize task relationships in task details view

### 🔧 Custom Fields
- Add custom fields to tasks for specialized tracking
- Example: `tasktracker update 5 custom story-points 8`
- Example: `tasktracker update 5 custom assigned-to "Jane Doe"`
- All custom fields visible in task details view

### 💰 Cost Optimization for AI Integration
- New batch processor to run multiple commands with one tool call
- Example: `./bin/tasktracker-batch commands.txt`
- Minimal output mode to reduce token usage with `--minimal` flag
- Context caching to avoid repeated queries
- See [Cost Optimization Guide](docs/COST-OPTIMIZATION.md) for detailed strategies
- Can reduce premium tool call costs by 80-95%

### 🎨 Enhanced Terminal Compatibility
- Fixed chalk library compatibility issues with better fallback formatting
- Added support for NO_COLOR environment variable standard
- Improved visibility of long task titles with better truncation
- Configurable warning messages for terminal compatibility issues

### 🔄 Improved Git Integration
- More robust error handling for Git commands
- Suppressed "not a git repository" warnings when Git isn't available
- Option to disable Git integration completely via configuration
- Works seamlessly in both Git and non-Git environments

### 📁 Enhanced File Tracking
- Improved file change detection with better error handling
- Better formatting of tracked files and related tasks
- Path normalization for more consistent file matching
- Periodic cleanup of stale file hash entries

## Usage

### Basic Commands

TaskTracker provides a single unified command that gives you access to all functionality:

```bash
# Create a new task (interactive)
tasktracker add

# Quickly create tasks (non-interactive)
tasktracker quick "Fix login bug" bugfix

# List all tasks
tasktracker list

# Filter tasks (NEW)
tasktracker list --priority=p1-high
tasktracker list --category=feature
tasktracker list --keyword=authentication

# Update a task status
tasktracker update 3 status done

# Add task dependencies (NEW)
tasktracker update 3 depends-on 2
tasktracker update 2 blocks 3

# Add custom fields (NEW)
tasktracker update 5 custom story-points 8

# Track file changes
tasktracker changes

# Take a snapshot of current project state
tasktracker snapshot

# Get help information
tasktracker help
```

### Cost-Optimized Usage

For AI assistant integration with minimal premium tool calls:

```bash
# Run multiple commands in one tool call
./bin/tasktracker-batch commands.txt

# Use stdin for dynamic commands
cat << EOF | ./bin/tasktracker-batch --stdin
quick "Fix login button" bugfix --silent
update 1 status in-progress --silent
list --minimal
EOF

# Use minimal output mode to reduce tokens
tasktracker list --minimal

# Use silent mode for operations that don't need output
tasktracker update 3 status in-progress --silent

# Generate and save task context for reuse
tasktracker view 3 --json > task3_context.json
```

See [Cost Optimization Guide](docs/COST-OPTIMIZATION.md) for more detailed strategies.

## Project Structure

TaskTracker is designed to be minimal but powerful:

- `bin/tasktracker` - Main executable command
- `bin/batch-tasks.sh` - Batch operations script
- `lib/tasktracker.js` - Core task management
- `lib/stats-tracker.js` - Statistics and reporting
- `lib/quick-task.js` - Quick task creation
- `lib/auto-tracker.sh` - Git hooks and automation

## Configuration

TaskTracker creates a `.tasktracker` directory with configuration files:

- `config.json`: Customize project name, versioning type, categories, and statuses
- `tasks.json`: Stores all task data
- `file_hashes.json`: Tracks file changes
- `snapshots.json`: Stores project snapshots for trend analysis
- `stats/`: Directory for detailed statistics snapshots
- `reports/`: Directory for generated reports

You can edit `config.json` to customize TaskTracker for your project:

```json
{
  "projectName": "YourProject",
  "versioningType": "semver",
  "currentVersion": "0.1.0",
  "taskCategories": ["feature", "bugfix", "refactor", "docs", "test", "chore"],
  "taskStatuses": ["todo", "in-progress", "review", "done"],
  "changelogSections": ["Added", "Changed", "Fixed", "Deprecated", "Removed", "Security"],
  "gitIntegration": true,
  "showChalkWarnings": false
}
```

## Documentation

For more detailed information, see:

- [Complete Documentation](docs/README.md)
- [Quick Reference Guide](docs/QUICK-GUIDE.md)
- [Real-World Examples](docs/EXAMPLES.md)
- [Statistical Reports](docs/REPORTS.md)
- [AI Integration](docs/AI-INTEGRATION.md)
- [Batch Operations](docs/BATCH-OPERATIONS.md)
- [Cost Optimization](docs/COST-OPTIMIZATION.md)
- [Task Archiving](docs/ARCHIVING.md)

## Why Use TaskTracker?

- **Lightweight**: No external dependencies or servers
- **Local**: Everything stays in your repository
- **Flexible**: Works with any project or language
- **Automated**: Integrates with your Git workflow
- **Informative**: Provides insights into your development process
- **AI-Ready**: Provides context to AI coding assistants
- **Offline**: Works completely offline without external services
- **Historical**: Tracks progress over time with snapshots and trends
- **Efficient**: Batch operations reduce premium tool call costs

## Requirements

- Node.js (v12 or higher)
- Git (optional, for enhanced integration)
- jq (optional, for JSON processing in batch operations)

## IDE Integration

TaskTracker integrates with various IDEs and AI coding assistants:

### Cursor IDE

TaskTracker has first-class support for Cursor IDE through the `.cursorrules` file. This provides:
- Custom commands for AI assistant interaction
- Status bar integration
- Keyboard shortcuts
- Task comment templates

See [Cursor Integration Guide](docs/cursor-integration.md) for details.

### VSCode

TaskTracker can be used with VSCode through:
- Custom tasks
- Key bindings
- Status bar extensions

See [VSCode Integration Guide](docs/vscode-integration/README.md) for setup instructions.

### JetBrains IDEs

TaskTracker works with IntelliJ IDEA, WebStorm, PyCharm, and other JetBrains IDEs through:
- External tools configuration
- Custom keyboard shortcuts
- File templates

See [JetBrains Integration Guide](docs/jetbrains-integration/README.md) for setup instructions.

### GitHub Copilot

TaskTracker can be used with GitHub Copilot through command suggestions.

See [IDE Integration Guide](docs/ide-integration.md) for more information.

## AI Integration

TaskTracker is designed to work seamlessly with AI coding assistants. It provides dedicated features for Claude agents in Cursor:

- **Task Context Generation**: AI assistants can get full context about tasks
- **Batch Processing**: Optimized commands to reduce premium tool call costs
- **Ready-to-use Templates**: Pre-configured templates for common workflows

Learn more in the [AI Integration Guide](docs/AI-INTEGRATION.md).

### Claude Agent Cost Optimization

When using TaskTracker with Claude agents, you can significantly reduce premium tool call costs:

```bash
# Instead of multiple separate commands (expensive)
tasktracker list
tasktracker update 1 status in-progress
tasktracker update 2 status done

# Use a single batch command (cost-effective)
task.batch examples/claude-templates/daily-update.txt
```

See the [Cost Optimization Guide](docs/guides/COST-OPTIMIZATION.md) for more strategies.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tasktracker.git

# Install dependencies
cd tasktracker
npm install

# Run the setup
./bin/tasktracker setup
```

## Updating

If you're updating from a previous version, see the [Update Guide](docs/guides/UPDATING.md) for complete instructions.

```bash
# Quick update
git pull
npm install
./bin/tasktracker verify
```

## License

MIT 