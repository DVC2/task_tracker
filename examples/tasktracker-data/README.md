# TaskTracker Example Data

This directory contains example data files that demonstrate the structure and format of TaskTracker's data files. These files are meant to serve as references for developers and users to understand how TaskTracker stores and manages task information.

## Files Included

- **tasks.json**: Sample task data showing different task types with various statuses, comments, and checklists
- **config.json**: Example configuration settings for a TaskTracker project 
- **file-hashes.json**: Example file tracking data showing how TaskTracker monitors file changes
- **snapshots.json**: Example project snapshots showing task statistics at different points in time

## Usage

These files are for reference only and should not be used as actual data in your projects. When initializing TaskTracker in your project, the system will create its own data files with your specific project information.

To see how TaskTracker generates and manages these files in a real project:

```bash
# Initialize TaskTracker in your project
tasktracker init

# Create some tasks
tasktracker add "Implement new feature" feature
tasktracker add "Fix bug in login page" bugfix

# Track file changes
tasktracker changes
```

## Data File Locations

In an actual TaskTracker project, these files are stored in the `.tasktracker` directory at the root of your project:

- `.tasktracker/tasks.json`
- `.tasktracker/config.json`
- `.tasktracker/file-hashes.json`
- `.tasktracker/snapshots.json`

These files are automatically added to your `.gitignore` to prevent user-specific task data from being committed to your repository. 