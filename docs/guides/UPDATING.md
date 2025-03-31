# TaskTracker Update Guide

This guide provides instructions for upgrading from older versions of TaskTracker to the latest version.

## Updating from Version 2.1.0 to 2.1.1

### Backup Your Data First

Before updating, always create a backup of your task data:

```bash
# Create a backup of your task data
cp -r .tasktracker/ .tasktracker-backup/
```

### Update Steps

1. **Pull the latest code**
   ```bash
   git pull origin main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the verification script**
   ```bash
   # Check for missing files and fix issues automatically
   ./bin/tasktracker verify --fix
   ```

4. **Test basic functionality**
   ```bash
   # Make sure tasks can be listed
   ./bin/tasktracker list
   ```

### Fixed Issues in 2.1.1

This patch release fixes several issues from v2.1.0:

1. **Batch Command Flags** - The `--silent` flag now works correctly in any position
2. **Dependency Tracking** - The `depends-on` feature is fixed in the new directory structure
3. **File Linking** - Corrected parameter parsing to prevent flags from being added as related files
4. **Installation Validation** - Added verification script to detect and fix missing files
5. **Terminal Compatibility** - Improved terminal detection with option to suppress warnings

## Required Files

After updating to v2.1.1, make sure the following critical files are present:

- `lib/core/tasktracker.js`
- `lib/core/file-cache.js`
- `lib/core/perf-monitor.js`
- `lib/core/dependency-tracker.js`
- `lib/core/task-commit.js`
- `lib/core/task-context.js`
- `lib/core/quick-task.js`
- `bin/tasktracker-verify`

The verification script will check for these files and attempt to restore them if missing:

```bash
# Check installation integrity
./bin/tasktracker verify

# Automatically fix common installation issues
./bin/tasktracker verify --fix
```

## Updating from Version 1.x to 2.x

### Backup Your Data First

Before updating, always create a backup of your task data:

```bash
# Create a backup of your task data
cp -r .tasktracker/ .tasktracker-backup/
```

### Update Steps

1. **Pull the latest code**
   ```bash
   # If using Git
   git pull origin main
   
   # If not using Git, download the latest release and extract,
   # being careful to preserve your .tasktracker directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify the installation**
   ```bash
   ./bin/tasktracker verify
   ```

4. **Update security patterns**
   ```bash
   # Update .taskignore with the latest security patterns
   ./bin/tasktracker ignore init
   ```

5. **Test basic functionality**
   ```bash
   # Make sure tasks can be listed
   ./bin/tasktracker list
   ```

## New Directory Structure

Version 2.x has reorganized files into a more structured layout:

- `lib/core/` - Core functionality modules
- `lib/reporting/` - Reporting and statistics modules
- `lib/integration/` - Integration with other tools and AI

This change is handled automatically by the `bin/tasktracker` script, which looks for files in both old and new locations for backward compatibility.

## New Features

### Cost-Optimized Claude Integration

The latest version includes ready-to-use templates for Claude agent integration with cost optimization:

```bash
# Use batch templates to reduce premium tool call costs
./bin/tasktracker batch examples/claude-templates/daily-update.txt
```

Available templates:
- `daily-update.txt` - Update multiple task statuses efficiently
- `task-create.txt` - Create multiple related tasks
- `pr-prepare.txt` - Prepare a task for a pull request

### Enhanced Security

Security has been improved with:
- Better credential protection in `.taskignore`
- Checks for sensitive information

## Troubleshooting

If you encounter issues after updating:

1. **Command not found**
   ```bash
   # Make sure tasktracker is executable
   chmod +x bin/tasktracker
   ```

2. **Module not found errors**
   ```bash
   # Try reinstalling dependencies
   npm install
   ```

3. **Permission issues with task data**
   ```bash
   # Fix permissions
   chmod -R u+rw .tasktracker/
   ```

4. **Revert to backup if needed**
   ```bash
   # Restore from your backup
   rm -rf .tasktracker/
   cp -r .tasktracker-backup/ .tasktracker/
   ```

## Major Changes From Previous Versions

1. **Reorganized file structure** for better maintainability
2. **Claude agent integration** with cost optimization
3. **Enhanced security features** 
4. **Improved documentation** with comprehensive guides
5. **Batch operations** for more efficient workflows

If you encounter any issues not covered here, please report them in the GitHub issues. 