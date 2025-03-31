# TaskTracker Documentation

This directory contains all documentation for the TaskTracker project.

## Directory Structure

- **guides/** - In-depth guides on TaskTracker features and best practices
  - ARCHIVING.md - Guide to archiving tasks
  - BATCH-OPERATIONS.md - Guide to batch operations  
  - COST-OPTIMIZATION.md - Guide to optimizing costs
  - ENHANCEMENTS.md - Guide to enhancing TaskTracker
  - EXAMPLES.md - Examples of TaskTracker usage
  - UPDATING.md - Guide to updating from previous versions

- **ide-integrations/** - Documentation for IDE integrations
  - cursor-integration.md - Cursor IDE integration guide
  - ide-integration.md - General IDE integration overview
  - vscode-integration/ - VSCode integration files
  - jetbrains-integration/ - JetBrains IDE integration files

- **feedback/** - User feedback and improvement plans
  - feedback-action-plan.md - Action plan based on feedback
  - user-feedback-v1.5.0.md - Feedback from v1.5.0

- **releases/** - Release notes for specific versions
  - RELEASE-2.0.1.md - Release notes for v2.0.1

- **cli-reference.md** - Reference for command-line interface commands
- **QUICK-GUIDE.md** - Quick start guide
- **REPORTS.md** - Guide to generating reports
- **AI-INTEGRATION.md** - Guide to AI integration
  - Covers integration with AI assistants
  - Includes specific instructions for Claude agent integration
  - Provides strategies for cost-efficient AI workflows

Welcome to the TaskTracker documentation. This guide contains everything you need to know about installing, configuring, and using TaskTracker to manage your development tasks.

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Command Reference](#command-reference)
5. [Real-World Examples](#real-world-examples)
6. [Reports & Statistics](#reports--statistics)
7. [Git Integration](#git-integration)
8. [AI Integration](#ai-integration)
9. [Task Archiving](#task-archiving)
10. [Configuration](#configuration)
11. [Troubleshooting](#troubleshooting)

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

## Real-World Examples

TaskTracker includes comprehensive real-world examples that demonstrate how to use its features in actual development scenarios:

- Practical workflows for feature development and bug fixing
- Examples of setting up task dependencies for complex projects
- Custom fields usage for specialized tracking needs
- Batch operations for efficient task management
- AI integration examples for working with coding assistants
- Technical debt tracking examples

For detailed examples with code snippets, see the [Real-World Examples Guide](EXAMPLES.md).

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

## Task Archiving

TaskTracker includes functionality for archiving tasks and their related data.

Learn more in the [Task Archiving Guide](ARCHIVING.md).

## Configuration

TaskTracker can be configured through files in the `.tasktracker` directory:

- `config.json`: Main configuration
- `ai_config.json`: AI integration settings
- Custom templates for reports

See the [Configuration Guide](configuration.md) for details.

## Troubleshooting

Having problems with TaskTracker? Check the [Troubleshooting Guide](troubleshooting.md) for common issues and solutions. 