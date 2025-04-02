# TaskTracker Example Data

This directory contains example data files that mimic the actual data structure used by TaskTracker. These examples help developers and users to understand how TaskTracker stores and manages task information.

## Contents

- **config.json**: Example configuration settings for a TaskTracker project
- **file-hashes.json**: Example file tracking data showing how TaskTracker monitors file changes
- **tasks.json**: Sample task data showing task structure and relationships
- **snapshots.json**: Example snapshot data showing historical tracking

These files are for reference only and should not be used as actual data in your projects. When initializing TaskTracker in your project, the system will create its own data files with your specific project information.

To see how TaskTracker generates and manages these files in a real project:

```bash
# Initialize TaskTracker in your project
tt init

# Create some sample tasks
tt add "Implement new feature" feature
tt add "Fix bug in login page" bugfix

# Track file changes
tt changes
```

In an actual TaskTracker project, these files are stored in the `.tasktracker` directory at the root of your project:

- `.tasktracker/tasks.json`
- `.tasktracker/config.json`
- `.tasktracker/file-hashes.json`
- `.tasktracker/snapshots.json`

These files are automatically added to your `.gitignore` to prevent user-specific task data from being committed to your repository. 