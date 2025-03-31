#!/bin/bash
# batch-tasks.sh - Batch task management to reduce premium tool calls

# Display help
show_help() {
  echo "TaskTracker Batch Operations"
  echo "============================="
  echo "This script provides batch operations to reduce premium tool calls."
  echo ""
  echo "Usage:"
  echo "  ./batch-tasks.sh <command> [options]"
  echo ""
  echo "Commands:"
  echo "  add <file>           Add multiple tasks from a file (CSV or JSON)"
  echo "  update <status> [ids] Update status of multiple tasks at once"
  echo "  list [status]        List tasks with optional status filter"
  echo "  snapshot             Take a project snapshot"
  echo "  help                 Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./batch-tasks.sh add tasks.csv"
  echo "  ./batch-tasks.sh update in-progress 1 2 3"
  echo "  ./batch-tasks.sh list todo"
  echo ""
  echo "File Formats:"
  echo "  CSV: title,description,category,status"
  echo "  Example CSV: \"Fix login\",\"Fix the login button\",\"bugfix\",\"todo\""
  echo ""
  echo "  JSON: Array of task objects"
  echo "  Example JSON: [{\"title\":\"Fix login\",\"description\":\"Fix the login button\",\"category\":\"bugfix\",\"status\":\"todo\"}]"
  echo ""
}

# Function to add multiple tasks from a file
add_tasks_from_file() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    exit 1
  fi
  
  # Check file extension
  if [[ "$file" == *.csv ]]; then
    echo "📂 Adding tasks from CSV file: $file"
    
    # Skip header line if present
    local first_line=$(head -n 1 "$file")
    if [[ "$first_line" == *"title"* && "$first_line" == *"description"* ]]; then
      tail -n +2 "$file" > "$file.tmp"
      file="$file.tmp"
    fi
    
    # Process CSV file - handle both quoted and unquoted formats
    while IFS=, read -r title description category status; do
      # Remove quotes if present
      title=$(echo "$title" | sed 's/^"//;s/"$//')
      description=$(echo "$description" | sed 's/^"//;s/"$//')
      category=$(echo "$category" | sed 's/^"//;s/"$//')
      status=$(echo "$status" | sed 's/^"//;s/"$//')
      
      # Add the task
      echo "Adding task: $title"
      tasktracker quick "$title" "$category" --silent
      
      # If task has a description, update it
      if [ -n "$description" ]; then
        task_id=$(tasktracker list --json | grep -o '"id":[0-9]*' | tail -n 1 | cut -d ':' -f 2)
        tasktracker update "$task_id" desc "$description" --silent
      fi
      
      # If status is not todo (default), update it
      if [ "$status" != "todo" ] && [ -n "$status" ]; then
        task_id=$(tasktracker list --json | grep -o '"id":[0-9]*' | tail -n 1 | cut -d ':' -f 2)
        tasktracker update "$task_id" status "$status" --silent
      fi
    done < "$file"
    
    # Clean up temporary file if created
    if [ -f "$file.tmp" ]; then
      rm "$file.tmp"
    fi
    
  elif [[ "$file" == *.json ]]; then
    echo "📂 Adding tasks from JSON file: $file"
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
      echo "❌ jq is required for JSON processing but not found."
      echo "Please install jq: https://stedolan.github.io/jq/download/"
      exit 1
    fi
    
    # Get the number of tasks in the JSON array
    local task_count=$(jq '. | length' "$file")
    echo "Found $task_count tasks in JSON file"
    
    # Iterate through tasks
    for i in $(seq 0 $(($task_count - 1))); do
      local title=$(jq -r ".[$i].title" "$file")
      local category=$(jq -r ".[$i].category // \"feature\"" "$file")
      local description=$(jq -r ".[$i].description // \"\"" "$file")
      local status=$(jq -r ".[$i].status // \"todo\"" "$file")
      
      # Add the task
      echo "Adding task: $title"
      tasktracker quick "$title" "$category" --silent
      
      # If task has a description, update it
      if [ -n "$description" ] && [ "$description" != "null" ]; then
        task_id=$(tasktracker list --json | grep -o '"id":[0-9]*' | tail -n 1 | cut -d ':' -f 2)
        tasktracker update "$task_id" desc "$description" --silent
      fi
      
      # If status is not todo (default), update it
      if [ "$status" != "todo" ] && [ -n "$status" ] && [ "$status" != "null" ]; then
        task_id=$(tasktracker list --json | grep -o '"id":[0-9]*' | tail -n 1 | cut -d ':' -f 2)
        tasktracker update "$task_id" status "$status" --silent
      fi
    done
  else
    echo "❌ Unsupported file format. Please use .csv or .json files."
    exit 1
  fi
  
  # Show all tasks after adding
  echo "✅ All tasks added successfully"
  tasktracker list
}

# Function to update multiple tasks at once
update_multiple_tasks() {
  local status="$1"
  shift
  local task_ids=("$@")
  
  if [ -z "$status" ]; then
    echo "❌ Missing status. Usage: ./batch-tasks.sh update <status> [ids]"
    exit 1
  fi
  
  if [ ${#task_ids[@]} -eq 0 ]; then
    echo "❌ No task IDs provided. Usage: ./batch-tasks.sh update <status> [ids]"
    exit 1
  fi
  
  echo "🔄 Updating status to '$status' for tasks: ${task_ids[*]}"
  
  for task_id in "${task_ids[@]}"; do
    echo "Updating task #$task_id"
    tasktracker update "$task_id" status "$status" --silent
  done
  
  echo "✅ All tasks updated successfully"
  tasktracker list
}

# Function to list tasks with optional status filter
list_tasks() {
  local status="$1"
  
  if [ -n "$status" ]; then
    echo "📋 Listing tasks with status: $status"
    tasktracker list "$status"
  else
    echo "📋 Listing all tasks"
    tasktracker list
  fi
}

# Function to take a project snapshot
take_snapshot() {
  echo "📸 Taking project snapshot"
  tasktracker snapshot
}

# Main function
main() {
  local command="$1"
  shift
  
  if [ -z "$command" ]; then
    show_help
    exit 0
  fi
  
  case "$command" in
    "add")
      add_tasks_from_file "$1"
      ;;
    "update")
      update_multiple_tasks "$@"
      ;;
    "list")
      list_tasks "$1"
      ;;
    "snapshot")
      take_snapshot
      ;;
    "help")
      show_help
      ;;
    *)
      echo "❌ Unknown command: $command"
      show_help
      exit 1
      ;;
  esac
}

# Call main function with all arguments
main "$@" 