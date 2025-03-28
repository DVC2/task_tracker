# TaskTracker VSCode Integration

This guide explains how to integrate TaskTracker with Visual Studio Code.

## Setup

1. **Install TaskTracker globally**:
   ```
   npm install -g tasktracker
   ```

2. **Add TaskTracker files to your VSCode workspace**:
   - Copy the `.vscode` directory from this folder to your project
   - Contains tasks.json, keybindings.json, and tasktracker.json

## Features

### Custom Tasks

The `tasks.json` file defines the following TaskTracker tasks:
- List Tasks
- Add Task (interactive)
- Quick Task
- View Task
- Update Task Status
- Track Changes

To use these tasks:
1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Tasks: Run Task"
3. Select a TaskTracker task

### Key Bindings

The `keybindings.json` file provides these shortcuts:
- Ctrl+Alt+T: List all tasks
- Ctrl+Alt+N: Add a quick task
- Ctrl+Alt+C: Track file changes
- Ctrl+Alt+V: View a task (with prompt)

To apply these key bindings:
1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Preferences: Open Keyboard Shortcuts (JSON)"
3. Copy the contents from keybindings.json into your personal keybindings.json file

### Status Bar Integration

For status bar integration, install the [Custom Status Bar extension](https://marketplace.visualstudio.com/items?itemName=sirtobi.custom-status-bar-items) and configure it to run:

```
tasktracker list --current
```

The `tasktracker.json` file includes configuration for this integration.

## Customization

You can customize the integration:
- Edit `tasks.json` to add or modify tasks
- Update `keybindings.json` to change keyboard shortcuts
- Modify `tasktracker.json` to adjust configuration parameters

## Example Setup Script

Here's a script to set up the VSCode integration:

```bash
#!/bin/bash
# Setup TaskTracker integration with VSCode

# Make sure the .vscode directory exists
mkdir -p .vscode

# Copy the integration files
cp /path/to/tasktracker/docs/vscode-integration/.vscode/* .vscode/

echo "TaskTracker VSCode integration files installed."
echo "Please install the Custom Status Bar extension for full integration."
```

Save this as `setup-vscode.sh` and run it in your project directory. 