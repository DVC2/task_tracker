# TaskTracker Developer Documentation

This directory contains resources and examples for developers who want to extend, customize, or integrate with TaskTracker.

## Contents

### Sample Data and Formats

- **tasktracker-data/** - Example data files showing TaskTracker's internal storage formats
  - `tasks.json` - Task data structure
  - `config.json` - Configuration settings
  - `file-hashes.json` - File tracking data
  - `snapshots.json` - Historical snapshots

### AI Integration

- **claude-templates/** - Templates for AI assistant integration
  - `task-create.txt` - Template for creating tasks with Claude
  - `daily-update.txt` - Template for daily stand-up reports
  - `pr-prepare.txt` - Template for preparing pull requests

### Batch Operations

- **batch-examples/** - Examples of batch processing and automation scripts
  - Various batch files for different automation scenarios

### Sample Files

- **sample_tasks.json** - A more comprehensive example of task data structure
- **sample_tasks.csv** - Example of CSV import/export format

## Using These Examples

These examples are primarily intended for:

1. **Developers extending TaskTracker** - Understanding internal data formats
2. **Integration developers** - Creating tools that work with TaskTracker
3. **Power users** - Setting up automation and advanced workflows

## Contributing Examples

If you've developed useful extensions, templates, or batch processes, please consider contributing them back to the project by submitting a pull request.

## License

All examples are provided under the same license as TaskTracker itself. 