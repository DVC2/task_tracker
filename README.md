# TaskTracker

TaskTracker is a lightweight, terminal-based task management tool designed for developers who want to track tasks alongside their code without leaving the terminal.

![TaskTracker Demo](docs/images/tasktracker-demo.png)

## Key Features

- 📋 **Task Tracking**: Manage tasks with detailed information
- 📱 **Simple Interface**: Clean terminal UI that's easy to use
- 🔄 **Git Integration**: Track files and changes associated with tasks
- 📊 **Task Statistics**: Get insights about your workload and progress
- 🚀 **AI Integration**: Generate context for AI coding assistants
- 🔄 **Command Patterns**: Consistent command syntax across all operations
- 📦 **Modular Architecture**: Extensible design for easy customization
- 🔄 **Plugin Support**: Extensible through custom modules

## Installation

### Global Installation (Recommended)

```bash
npm install -g tasktracker-cli
```

After installation, initialize TaskTracker in your project:

```bash
tt init
```

### Local Installation

```bash
npm install tasktracker-cli --save-dev

# Initialize TaskTracker
npx tt init
```

## Usage

TaskTracker uses `tt` as the primary command. The legacy `tasktracker` command is maintained for backward compatibility but may be deprecated in future versions.

## Quick Start

Create a task:
```bash
tt quick "Implement user authentication" feature
```

Mark a task as in-progress:
```bash
tt update 1 status in-progress
```

View all tasks:
```bash
tt list
```

Link a source file to the task:
```bash
tt update 1 add-file src/components/Navigation.js
```

Complete the task:
```bash
tt update 1 status done
```

### Filtering Tasks

```bash
# Filter by status
tt list todo

# Filter by category 
tt list --category=feature

# Filter by priority
tt list --priority=p1-high

# Search by keyword
tt list --keyword=navigation
```

### Integration with AI Assistants

Generate context for AI tools:

```bash
# Generate AI-friendly context
tt ai-context

# Generate context for a specific task
tt ai-context 2
```

## Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `tt init` | Initialize TaskTracker | `tt init` |
| `tt quick` | Create a task quickly | `tt quick "Fix bug" bugfix` |
| `tt add` | Add a task (interactive) | `tt add` |
| `tt list` | List all tasks | `tt list` |
| `tt view` | View task details | `tt view 1` |
| `tt update` | Update a task | `tt update 1 status in-progress` |
| `tt delete` | Delete a task | `tt delete 1` |
| `tt changes` | See recent file changes | `tt changes` |
| `tt stats` | Show project statistics | `tt stats` |
| `tt ai-context` | Generate AI context | `tt ai-context 1` |

## Advanced Features

TaskTracker includes advanced commands for power users:

### Custom Fields

You can add custom fields to any task:

```bash
tt update 3 custom story-points 5
tt update 3 custom assignee "Jane"
tt update 3 custom due-date "2023-12-15"
```

### Task Dependencies

Define dependencies between tasks:

```bash
# Task 2 depends on Task 1
tt update 2 depends-on 1

# View dependency graph
tt view 2 --deps
```

## Customization

You can customize task statuses and categories in `.tasktracker/config.json`:

## Need More Help?

Run `tt help` to see all available commands and options.

For detailed documentation, see the [docs directory](docs/).

## License

MIT

## Recent Improvements

This version includes several usability enhancements:

- 📦 **Modular Architecture**: Complete refactoring from monolithic to modular design
- 📊 **Improved Statistics**: Quick task stats with `tt stats`
- 🎨 **Better Visualization**: Color-coded categories for better readability
- ⌨️ **Shell Completion**: Command auto-completion for bash/zsh (see docs/SHELL-COMPLETION.md)
- 🚀 **Loading Animations**: Visual feedback during initialization
- 📋 **Better Table Formatting**: Improved alignment of task tables
- 📝 **Streamlined Docs**: More concise, example-focused documentation