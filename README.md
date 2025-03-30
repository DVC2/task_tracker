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

Your existing tasks and data will be preserved during the upgrade. Version 1.5.0 adds improved compatibility:
- Works reliably in environments with or without Git
- Fixed formatting issues with chalk 
- More consistent command syntax (e.g., 'add-file' instead of 'addfile')
- Enhanced documentation and help text

## Recent Improvements (v1.5.0)

### 🎨 Enhanced Terminal Compatibility
- Fixed chalk library compatibility issues with fallback formatting
- Added ANSI color support when chalk is unavailable
- Ensures consistent display across different terminal environments

### 🔄 Improved Git Integration
- More robust error handling for Git commands
- Graceful fallback when Git is not available or repository is not initialized
- Works seamlessly in both Git and non-Git environments

### 📁 Enhanced File Tracking
- Improved file change detection without Git dependency
- More efficient file scanning with filtering and limits
- Periodic cleanup of stale file hash entries
- Performance optimizations for large projects

### 🔧 Command Syntax Consistency
- Added helpful command aliases (e.g., `files` for `changes`, `status` for `list`) 
- Standardized command names and parameters
- Enhanced help documentation with better examples

## Recent Fixes (v1.5.1)

### 🛠️ Critical Bug Fixes
- Fixed initialization error (`ReferenceError: initializeTaskTracker is not defined`) when running `tasktracker init`
- Implemented missing initialization function in the core tasktracker.js file
- Improved error handling and documentation for setup process

### Usage

TaskTracker provides a single unified command that gives you access to all functionality:

```bash
# Create a new task (interactive)
tasktracker add

# Quickly create tasks (non-interactive)
tasktracker quick "Fix login bug" bugfix

# List all tasks
tasktracker list
# or use the alias
tasktracker status

# Update a task status
tasktracker update 3 status done

# Track file changes
tasktracker changes
# or use the alias
tasktracker files src

# Generate a report
tasktracker report html

# Take a snapshot of current project state
tasktracker snapshot
# or use the alias
tasktracker stats

# Compare with previous snapshot
tasktracker compare 7

# Get help information
tasktracker help
# or use shorthand
tasktracker -h
```

## Project Structure

TaskTracker is designed to be minimal but powerful:

- `bin/tasktracker` - Main executable command
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
  "gitIntegration": true
}
```

## Documentation

For more detailed information, see:

- [Complete Documentation](docs/README.md)
- [Quick Reference Guide](docs/QUICK-GUIDE.md)
- [Statistical Reports](docs/REPORTS.md)
- [AI Integration](docs/AI-INTEGRATION.md)

## Why Use TaskTracker?

- **Lightweight**: No external dependencies or servers
- **Local**: Everything stays in your repository
- **Flexible**: Works with any project or language
- **Automated**: Integrates with your Git workflow
- **Informative**: Provides insights into your development process
- **AI-Ready**: Provides context to AI coding assistants
- **Offline**: Works completely offline without external services
- **Historical**: Tracks progress over time with snapshots and trends

## Requirements

- Node.js (v12 or higher)
- Git (optional, for enhanced integration)

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

## License

MIT 