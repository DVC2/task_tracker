#!/bin/bash

# TaskTracker Auto-Tracking Setup
# This script sets up automatic tracking for TaskTracker

echo "🛠️  TaskTracker Auto-Tracking Setup"
echo "=================================================="
echo ""

# Check if TaskTracker exists
if [ ! -f "tasktracker.js" ]; then
  echo "❌ TaskTracker not found in current directory!"
  echo "Please run this script from your project root where tasktracker.js is located."
  exit 1
fi

# Check if stats-tracker.js exists
if [ ! -f "stats-tracker.js" ]; then
  echo "❌ stats-tracker.js not found!"
  echo "Please ensure you have the TaskTracker Statistics Tracker installed."
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found!"
  echo "Please install Node.js to use TaskTracker."
  exit 1
fi

# Function to setup git hooks
setup_git_hooks() {
  echo "Setting up Git hooks..."
  
  # Check if .git directory exists
  if [ ! -d ".git" ]; then
    echo "❌ This directory is not a Git repository!"
    return 1
  fi
  
  # Create hooks directory if it doesn't exist
  mkdir -p .git/hooks
  
  # Create pre-commit hook
  echo "Creating pre-commit hook..."
  cat > .git/hooks/pre-commit << 'EOL'
#!/bin/bash

# Run TaskTracker to check for changed files
echo "🔍 Checking for changes in tracked files..."
node tasktracker.js changes

# Ask if user wants to update related tasks
read -p "Do you want to update any task statuses? (y/n): " answer
if [ "$answer" == "y" ]; then
  node tasktracker.js update
fi

# Take a snapshot of current statistics
echo "📊 Taking a statistics snapshot..."
node stats-tracker.js snapshot
EOL

  # Make the hook executable
  chmod +x .git/hooks/pre-commit
  
  # Create post-commit hook
  echo "Creating post-commit hook..."
  cat > .git/hooks/post-commit << 'EOL'
#!/bin/bash

# Update the statistics snapshot after commit
echo "📊 Updating statistics snapshot..."
node stats-tracker.js snapshot
EOL

  # Make the hook executable
  chmod +x .git/hooks/post-commit
  
  echo "✅ Git hooks setup complete!"
}

# Function to setup cron job
setup_cron() {
  echo "Setting up cron job for daily snapshots..."
  
  # Get current directory
  current_dir=$(pwd)
  
  # Check if crontab is available
  if ! command -v crontab &> /dev/null; then
    echo "❌ Crontab not found! Cannot setup automatic snapshots."
    return 1
  fi
  
  # Create temporary file
  temp_file=$(mktemp)
  
  # Export current crontab
  crontab -l > "$temp_file" 2>/dev/null
  
  # Check if entry already exists
  if grep -q "stats-tracker.js snapshot" "$temp_file"; then
    echo "⚠️ A TaskTracker cron job already exists!"
    read -p "Do you want to replace it? (y/n): " answer
    if [ "$answer" != "y" ]; then
      rm "$temp_file"
      return 0
    fi
    # Remove existing entry
    grep -v "stats-tracker.js snapshot" "$temp_file" > "${temp_file}.new"
    mv "${temp_file}.new" "$temp_file"
  fi
  
  # Add new cron job (runs daily at midnight)
  echo "# TaskTracker daily statistics snapshot" >> "$temp_file"
  echo "0 0 * * * cd $current_dir && /usr/bin/node $current_dir/stats-tracker.js snapshot >> $current_dir/.tasktracker/cron.log 2>&1" >> "$temp_file"
  
  # Install new crontab
  crontab "$temp_file"
  rm "$temp_file"
  
  echo "✅ Cron job setup complete! Daily snapshots will be taken at midnight."
}

# Function to setup weekly report generation
setup_weekly_report() {
  echo "Setting up weekly report generation..."
  
  # Get current directory
  current_dir=$(pwd)
  
  # Check if crontab is available
  if ! command -v crontab &> /dev/null; then
    echo "❌ Crontab not found! Cannot setup weekly reports."
    return 1
  fi
  
  # Create temporary file
  temp_file=$(mktemp)
  
  # Export current crontab
  crontab -l > "$temp_file" 2>/dev/null
  
  # Check if entry already exists
  if grep -q "stats-tracker.js report html" "$temp_file"; then
    echo "⚠️ A TaskTracker weekly report cron job already exists!"
    read -p "Do you want to replace it? (y/n): " answer
    if [ "$answer" != "y" ]; then
      rm "$temp_file"
      return 0
    fi
    # Remove existing entry
    grep -v "stats-tracker.js report html" "$temp_file" > "${temp_file}.new"
    mv "${temp_file}.new" "$temp_file"
  fi
  
  # Add new cron job (runs weekly on Sunday at 11:00 PM)
  echo "# TaskTracker weekly HTML report generation" >> "$temp_file"
  echo "0 23 * * 0 cd $current_dir && /usr/bin/node $current_dir/stats-tracker.js report html >> $current_dir/.tasktracker/cron.log 2>&1" >> "$temp_file"
  
  # Install new crontab
  crontab "$temp_file"
  rm "$temp_file"
  
  echo "✅ Weekly report generation setup complete! Reports will be generated every Sunday at 11:00 PM."
}

# Function to setup non-interactive mode
setup_non_interactive() {
  echo "Setting up non-interactive mode for AI agents..."
  
  # Create .tasktracker directory if it doesn't exist
  mkdir -p .tasktracker
  
  # Create or update the non-interactive configuration file
  cat > .tasktracker/ai_config.json << EOL
{
  "nonInteractiveMode": true,
  "aiTaskAssistance": true,
  "defaultTaskCategory": "feature",
  "defaultTaskStatus": "todo",
  "autoUpdateChangelog": true
}
EOL
  
  echo "✅ Non-interactive mode configured for AI agents!"
}

# Main menu
echo "Please select what you'd like to set up:"
echo "1) Git hooks (pre-commit and post-commit)"
echo "2) Daily statistics snapshots (cron job)"
echo "3) Weekly HTML report generation (cron job)"
echo "4) Non-interactive mode for AI agents"
echo "5) All of the above"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
  1)
    setup_git_hooks
    ;;
  2)
    setup_cron
    ;;
  3)
    setup_weekly_report
    ;;
  4)
    setup_non_interactive
    ;;
  5)
    setup_git_hooks
    setup_cron
    setup_weekly_report
    setup_non_interactive
    ;;
  6)
    echo "Exiting without changes."
    exit 0
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "=================================================="
echo "🎉 TaskTracker Auto-Tracking setup complete!"
echo ""
echo "📋 Task Management Commands:"
echo "  node tasktracker.js help        Show task management commands"
echo "  node tasktracker.js add         Create a new task"
echo "  node tasktracker.js update      Update an existing task"
echo "  node tasktracker.js changes     Check for changes in files"
echo ""
echo "📊 Statistics and Reporting Commands:"
echo "  node stats-tracker.js snapshot  Take a snapshot of the current state"
echo "  node stats-tracker.js report html  Generate an HTML report"
echo "  node stats-tracker.js compare 7    Compare with 7 days ago"
echo "  node stats-tracker.js trends       Show completion trends"
echo ""
echo "All reports will be saved in the .tasktracker/reports directory"
echo "=================================================="