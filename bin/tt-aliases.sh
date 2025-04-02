#!/usr/bin/env bash

# TaskTracker Shell Aliases (tt-aliases.sh)
# ----------------------------------------
# Ultra-short commands and productivity functions for TaskTracker
#
# Usage: source tt-aliases.sh
# Add to .bashrc/.zshrc: source /path/to/tt-aliases.sh

# Root directory
TASKTRACKER_ROOT="$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")"
TT_BIN="$TASKTRACKER_ROOT/bin/tt"
TT_BATCH="$TASKTRACKER_ROOT/bin/tt-batch"

# Basic aliases for shorter commands
alias ttq="$TT_BIN quick"
alias ttl="$TT_BIN list"
alias ttv="$TT_BIN view"
alias ttu="$TT_BIN update"
alias ttc="$TT_BIN changes"
alias tts="$TT_BIN snapshot"
alias ttb="$TT_BATCH"

# Optimized aliases with minimal output
alias ttlm="$TT_BIN list --minimal"
alias ttvs="$TT_BIN view --silent"
alias ttqs="$TT_BIN quick --silent"
alias ttus="$TT_BIN update --silent"

# Status shortcuts with minimal output
tt_todo() {
  $TT_BIN update "$1" status todo --minimal
  echo "Task #$1 set to TODO"
}

tt_start() {
  $TT_BIN update "$1" status in-progress --minimal
  echo "Task #$1 set to IN-PROGRESS"
}

tt_review() {
  $TT_BIN update "$1" status review --minimal
  echo "Task #$1 set to REVIEW"
}

tt_done() {
  $TT_BIN update "$1" status done --minimal
  echo "Task #$1 set to DONE"
}

# Function to run multiple commands in a single batch
tt_run() {
  if [ $# -eq 0 ]; then
    echo "Usage: tt_run \"command1\" \"command2\" ..."
    return 1
  fi

  # Create a temporary file for the commands
  temp_file=$(mktemp)
  trap "rm -f $temp_file" EXIT

  # Write commands to the temporary file
  for cmd in "$@"; do
    echo "$cmd" >> "$temp_file"
  done

  # Run the batch
  $TT_BATCH "$temp_file"
}

# Function to create a new task and immediately start it
tt_new_and_start() {
  if [ $# -lt 2 ]; then
    echo "Usage: tt_new_and_start \"Task title\" category"
    return 1
  fi

  # Create a temporary file for the commands
  temp_file=$(mktemp)
  trap "rm -f $temp_file" EXIT

  echo "quick \"$1\" $2 --silent" >> "$temp_file"
  echo "list --minimal" >> "$temp_file"
  echo "update \$(($TT_BIN list --json | jq '.tasks[-1].id')) status in-progress --silent" >> "$temp_file"
  echo "list --minimal" >> "$temp_file"

  # Run the batch
  $TT_BATCH "$temp_file"
}

# Function to cache task context for reuse
tt_cache_context() {
  if [ $# -eq 0 ]; then
    echo "Usage: tt_cache_context task_id [output_file]"
    return 1
  fi

  local task_id=$1
  local output_file=${2:-"task_${task_id}_context.json"}

  $TT_BIN view "$task_id" --json > "$output_file"
  echo "Task #$task_id context cached to $output_file"
}

# Function to view tasks with dependencies
tt_deps() {
  if [ $# -eq 0 ]; then
    # Show all tasks with dependencies
    $TT_BIN list --json | jq '[.tasks[] | select(.dependencies != null or .blockedBy != null)]'
  else
    # Show dependencies for a specific task
    $TT_BIN view "$1" --json | jq '{id: .id, title: .title, dependencies: .dependencies, blockedBy: .blockedBy}'
  fi
}

# Function to bulk update task status
tt_bulk_update() {
  if [ $# -lt 2 ]; then
    echo "Usage: tt_bulk_update status task_id1 [task_id2 ...]"
    return 1
  fi

  local status=$1
  shift

  # Create a temporary file for the commands
  temp_file=$(mktemp)
  trap "rm -f $temp_file" EXIT

  for task_id in "$@"; do
    echo "update $task_id status $status --silent" >> "$temp_file"
  done
  echo "list --minimal" >> "$temp_file"

  # Run the batch
  $TT_BATCH "$temp_file"
}

# Print available aliases and functions
tt_help() {
  echo "TaskTracker Productivity Aliases and Functions"
  echo "=============================================="
  echo ""
  echo "Basic Aliases:"
  echo "  tt           : Main TaskTracker command"
  echo "  ttq          : Create quick task"
  echo "  ttl          : List tasks"
  echo "  ttlm         : List tasks with minimal output"
  echo "  ttv          : View task details"
  echo "  ttu          : Update task"
  echo "  ttc          : Track file changes"
  echo "  tts          : Take snapshot"
  echo "  ttb          : Batch processor"
  echo ""
  echo "Status Functions:"
  echo "  tt_todo ID   : Set task to TODO status"
  echo "  tt_start ID  : Set task to IN-PROGRESS status"
  echo "  tt_review ID : Set task to REVIEW status"
  echo "  tt_done ID   : Set task to DONE status"
  echo ""
  echo "Batch Functions:"
  echo "  tt_run \"cmd1\" \"cmd2\"         : Run multiple commands in a single batch"
  echo "  tt_new_and_start \"Title\" cat  : Create and start a new task"
  echo "  tt_bulk_update status ID1 ID2  : Update status of multiple tasks"
  echo ""
  echo "Context Functions:"
  echo "  tt_cache_context ID [file]  : Cache task context to a file"
  echo "  tt_deps [ID]                : View task dependencies"
}

echo "TaskTracker aliases loaded. Type 'tt_help' for available commands." 