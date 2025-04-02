# TaskTracker CLI Executables

This directory contains the TaskTracker command-line executables and utility scripts.

## Core Commands

- **tt** - The main TaskTracker command (short alias, recommended)
- **tasktracker** - The original TaskTracker command (full implementation)

## Utility Scripts

- **tt-batch** - Batch processor for running multiple commands efficiently
- **tt-verify** - Installation verification tool
- **tt-aliases.sh** - Shell aliases for common TaskTracker operations

## Usage

### Main Command

```bash
# Using the short command (recommended)
tt <command> [options]
```

### Batch Processing

Process multiple commands in a single operation to reduce API costs:

```bash
# From a file
tt-batch commands.txt

# From stdin
echo "quick 'New task' feature" | tt-batch --stdin
```

### Verification

Verify your TaskTracker installation:

```bash
tt verify [--fix]
```

### Shell Aliases

Add to your shell configuration file:

```bash
# Load shell aliases
source /path/to/tt-aliases.sh

# Use short aliases
ttl         # List tasks
ttq "Task"  # Create quick task
tt_start 3  # Set task #3 to in-progress
```

## Alias Reference

After sourcing `tt-aliases.sh`, you get access to these shortcuts:

| Alias | Command | Description |
|-------|---------|-------------|
| ttq   | tt quick | Create a quick task |
| ttl   | tt list | List all tasks |
| ttv   | tt view | View task details |
| ttu   | tt update | Update a task |
| ttc   | tt changes | Track file changes |
| tts   | tt snapshot | Take a snapshot |
| ttb   | tt-batch | Run batch processor | 