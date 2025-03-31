# TaskTracker v2.1.0 Release Summary

## Key Features

- **Claude Agent Integration**: Specialized templates and batch commands for cost-efficient AI interactions
- **Directory Reorganization**: Improved code organization with core, reporting, and integration modules
- **Security Enhancements**: Better protection of sensitive data and expanded security testing
- **Cost Optimization**: Advanced batch operations to reduce premium tool call costs by up to 83%
- **Improved Documentation**: Comprehensive guides and update instructions

## Installation

### New Installation

```bash
# Clone the repository
git clone https://github.com/DVC2/task_tracker.git

# Install dependencies
cd task_tracker
npm install

# Run the setup
./bin/tasktracker setup
```

### Updating from Previous Versions

```bash
# Back up your data
cp -r .tasktracker/ .tasktracker-backup/

# Pull the latest code
git pull

# Install updated dependencies
npm install

# Verify the installation
./bin/tasktracker verify
```

For detailed update instructions, see the [Update Guide](docs/guides/UPDATING.md).

## Claude Agent Integration

This version introduces optimized integration with Claude agents in Cursor IDE:

```bash
# Use batch templates to reduce premium tool call costs
task.batch examples/claude-templates/daily-update.txt
```

Available templates:
- `daily-update.txt` - Update multiple task statuses efficiently
- `task-create.txt` - Create multiple related tasks
- `pr-prepare.txt` - Prepare a task for a pull request

## Documentation

- [Update Guide](docs/guides/UPDATING.md) - Instructions for updating from previous versions
- [AI Integration Guide](docs/AI-INTEGRATION.md) - Claude agent integration details
- [Cost Optimization Guide](docs/guides/COST-OPTIMIZATION.md) - Tips for reducing premium tool call costs
- [IDE Integration Guide](docs/ide-integrations/ide-integration.md) - IDE integration features 