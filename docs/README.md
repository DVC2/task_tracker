# TaskTracker Documentation

Welcome to the TaskTracker documentation. This guide contains everything you need to know about installing, configuring, and using TaskTracker to manage your development tasks.

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Command Reference](#command-reference)
5. [Reports & Statistics](#reports--statistics)
6. [Git Integration](#git-integration)
7. [AI Integration](#ai-integration)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

## Quick Start Guide

For a quick overview of all TaskTracker commands, see the [Quick Reference Guide](../QUICK-GUIDE.md).

## Installation

TaskTracker can be installed in any project:

```bash
# Clone the repository
git clone https://github.com/USERNAME/tasktracker.git

# Copy files to your project (or use them from the repo)
cp -r tasktracker/core/* your-project/

# Make the script executable
cd your-project
chmod +x tasktracker

# Initialize TaskTracker
./tasktracker init

# (Optional) Set up automation
./tasktracker automate
```

For more details, see the [Installation Guide](installation.md).

## Core Concepts

TaskTracker is built on a few key concepts:

1. **Tasks**: Units of work with metadata (status, category, related files)
2. **Changelog**: Automatically maintained history of changes
3. **Snapshots**: Statistical captures of project state
4. **Reports**: Visualizations and analyses of project progress

Read more in the [Core Concepts Guide](concepts.md).

## Command Reference

TaskTracker provides a unified command interface:

```bash
./tasktracker <command> [options]
```

All functionality is accessible through this single command:

- **Task Management**: `init`, `add`, `quick`, `update`, `list`, `view`, `changes`, `release`
- **Statistics & Reporting**: `snapshot`, `report`, `compare`, `trends`
- **Setup & Utilities**: `setup`, `automate`, `help`

For a complete reference, see [Command Reference](commands.md).

## Reports & Statistics

TaskTracker provides powerful reporting features to help you track progress and visualize trends in your project.

Learn more in the [Reports & Statistics Guide](REPORTS.md).

## Git Integration

TaskTracker integrates with Git to automate task tracking:

- Pre-commit hooks to check for changes
- Post-commit hooks to take snapshots
- Integration with Git branches and tags

See the [Git Integration Guide](git-integration.md) for details.

## AI Integration

TaskTracker is designed to work seamlessly with AI coding assistants, providing them with valuable context about your project's tasks and progress.

Learn more in the [AI Integration Guide](AI-INTEGRATION.md).

## Configuration

TaskTracker can be configured through files in the `.tasktracker` directory:

- `config.json`: Main configuration
- `ai_config.json`: AI integration settings
- Custom templates for reports

See the [Configuration Guide](configuration.md) for details.

## Troubleshooting

Having problems with TaskTracker? Check the [Troubleshooting Guide](troubleshooting.md) for common issues and solutions. 