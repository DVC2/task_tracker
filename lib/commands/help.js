/**
 * TaskTracker Help Command
 * 
 * Displays help information for commands
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output } = require('../core/formatting');
const commands = require('./index').commands;

/**
 * Show help information for commands
 * @param {string} commandName Optional specific command to show help for
 * @param {object} options Command options
 * @returns {object} Success status
 */
function showHelp(commandName, options = {}) {
  try {
    if (commandName && commandName !== 'help') {
      return showCommandHelp(commandName, options);
    }
    
    // Show general help
    output(`\n📘 TaskTracker - Simple task management for developers`, 'info', { globalOptions: options });
    output(`\nUsage:`, 'info', { globalOptions: options });
    output(`  tt <command> [arguments]`, 'info', { globalOptions: options });
    
    // Group commands by category for better organization
    const groupedCommands = {
      'Core Task Commands': [
        'add', 'quick', 'update', 'list', 'view'
      ],
      'File Management': [
        'link', 'unlink', 'files-for-task', 'changes'
      ],
      'Task Management': [
        'archive', 'restore', 'archives', 'stats'
      ],
      'AI Integration': [
        'context', 'ai'
      ],
      'Project Management': [
        'init', 'verify', 'update-config', 'ignore', 'cleanup'
      ],
      'Shortcuts': [
        'status', 'ls', 'files', 'attach', 'detach'
      ],
      'Help': [
        'help'
      ]
    };
    
    // Display commands by group
    Object.entries(groupedCommands).forEach(([group, cmdList]) => {
      output(`\n${group}:`, 'info', { globalOptions: options });
      
      cmdList.forEach(cmd => {
        const command = commands[cmd];
        if (command) {
          const description = command.description || 'No description available';
          const aliasText = command.alias ? ` (alias for ${command.alias})` : '';
          output(`  ${cmd.padEnd(15)} ${description}${aliasText}`, 'info', { globalOptions: options });
        }
      });
    });
    
    // Show examples
    output(`\nExamples:`, 'info', { globalOptions: options });
    output(`  tt add                      # Add a task interactively`, 'info', { globalOptions: options });
    output(`  tt quick "Fix login bug" bug p1-critical`, 'info', { globalOptions: options });
    output(`  tt update 5 status in-progress`, 'info', { globalOptions: options });
    output(`  tt list --status todo       # List todo tasks`, 'info', { globalOptions: options });
    output(`  tt view 3                   # View details of task #3`, 'info', { globalOptions: options });
    output(`  tt archive 7                # Archive task #7`, 'info', { globalOptions: options });
    output(`  tt link 3                   # Link current file to task #3`, 'info', { globalOptions: options });
    output(`  tt context                  # Generate AI context`, 'info', { globalOptions: options });
    output(`  tt changes                  # Show file changes`, 'info', { globalOptions: options });
    
    // Show detailed help instructions
    output(`\nFor more information about a specific command:`, 'info', { globalOptions: options });
    output(`  tt help <command>`, 'info', { globalOptions: options });
    
    return { success: true };
  } catch (error) {
    output(`❌ Error showing help: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Show help for a specific command
 * @param {string} commandName Name of the command to show help for
 * @param {object} options Command options
 * @returns {object} Success status
 */
function showCommandHelp(commandName, options = {}) {
  try {
    const command = commands[commandName];
    
    if (!command) {
      output(`❌ Unknown command: ${commandName}`, 'error', { globalOptions: options });
      output(`Run 'tt help' to see available commands.`, 'info', { globalOptions: options });
      return { success: false, error: `Unknown command: ${commandName}` };
    }
    
    // Get command description
    const description = command.description || 'No description available';
    
    // If this is an alias, show help for the target command
    if (command.alias) {
      output(`'${commandName}' is an alias for '${command.alias}'`, 'info', { globalOptions: options });
      return showCommandHelp(command.alias, options);
    }
    
    // Show command help
    output(`\n📘 Help: ${commandName}`, 'info', { globalOptions: options });
    output(`\nDescription:`, 'info', { globalOptions: options });
    output(`  ${description}`, 'info', { globalOptions: options });
    
    // Command-specific help
    switch (commandName) {
      case 'add':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt add`, 'info', { globalOptions: options });
        output(`\nInteractively prompts for:`, 'info', { globalOptions: options });
        output(`  - Task title (required)`, 'info', { globalOptions: options });
        output(`  - Description (optional)`, 'info', { globalOptions: options });
        output(`  - Category (default: feature)`, 'info', { globalOptions: options });
        output(`  - Status (default: todo)`, 'info', { globalOptions: options });
        output(`  - Priority (default: p2-medium)`, 'info', { globalOptions: options });
        output(`  - Effort (default: 3-medium)`, 'info', { globalOptions: options });
        output(`  - Related files (optional)`, 'info', { globalOptions: options });
        break;
        
      case 'quick':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt quick <title> [category] [status] [priority] [effort] [options]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  title       Task title (required, use quotes for multi-word titles)`, 'info', { globalOptions: options });
        output(`  category    Task category (optional, e.g., feature, bug, docs)`, 'info', { globalOptions: options });
        output(`  status      Task status (optional, e.g., todo, in-progress)`, 'info', { globalOptions: options });
        output(`  priority    Task priority (optional, e.g., p1-critical, p2-medium)`, 'info', { globalOptions: options });
        output(`  effort      Effort estimation (optional, e.g., 1-trivial, 3-medium)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --desc, --description <text>   Add description to the task`, 'info', { globalOptions: options });
        output(`  --file, -f <path>              Add related file to the task`, 'info', { globalOptions: options });
        output(`  --json                         Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'update':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt update <id> <field> <value>`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  id          Task ID to update (required)`, 'info', { globalOptions: options });
        output(`  field       Field to update (required):`, 'info', { globalOptions: options });
        output(`                - status: Task status`, 'info', { globalOptions: options });
        output(`                - category: Task category`, 'info', { globalOptions: options });
        output(`                - title: Task title`, 'info', { globalOptions: options });
        output(`                - description: Task description`, 'info', { globalOptions: options });
        output(`                - priority: Task priority`, 'info', { globalOptions: options });
        output(`                - effort: Effort estimation`, 'info', { globalOptions: options });
        output(`                - comment: Add a comment`, 'info', { globalOptions: options });
        output(`                - addfile, add-file: Add related file`, 'info', { globalOptions: options });
        output(`                - removefile, remove-file: Remove related file`, 'info', { globalOptions: options });
        output(`  value       New value for the field (required)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'list':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt list [options]`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --status <status>      Filter by status (e.g., todo, in-progress)`, 'info', { globalOptions: options });
        output(`  --category <category>  Filter by category (e.g., feature, bug)`, 'info', { globalOptions: options });
        output(`  --priority <priority>  Filter by priority (e.g., p1-critical)`, 'info', { globalOptions: options });
        output(`  --effort <effort>      Filter by effort (e.g., 3-medium)`, 'info', { globalOptions: options });
        output(`  --author <author>      Filter by task creator`, 'info', { globalOptions: options });
        output(`  --branch <branch>      Filter by Git branch`, 'info', { globalOptions: options });
        output(`  --file <file>          Filter tasks with specific related file`, 'info', { globalOptions: options });
        output(`  --view <view>          Display format: table, compact, detailed (default: table)`, 'info', { globalOptions: options });
        output(`  --json                 Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'view':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt view <id> [options]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  id          Task ID to view (required)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'archive':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt archive <id> [options]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  id          Task ID to archive (required)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'restore':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt restore <id> [options]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  id          Archived task ID to restore (required)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'archives':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt archives [options]`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'changes':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt changes [path] [options]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  path        Optional specific path to check for changes`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --disable-git   Don't use Git for change detection`, 'info', { globalOptions: options });
        output(`  --json          Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'stats':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt stats [options]`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'init':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt init [options]`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --projectName <name>   Set the project name`, 'info', { globalOptions: options });
        output(`  --force                Force reinitialization`, 'info', { globalOptions: options });
        break;
        
      case 'cleanup':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt cleanup`, 'info', { globalOptions: options });
        output(`\nDescription:`, 'info', { globalOptions: options });
        output(`  Cleans up task data formatting for consistent display by:`, 'info', { globalOptions: options });
        output(`  - Normalizing title and description whitespace`, 'info', { globalOptions: options });
        output(`  - Standardizing status values`, 'info', { globalOptions: options });
        output(`  - Ensuring required metadata is present`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      case 'context':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt context [file] [options]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  file        Optional specific file to get context for`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --format json    Output as JSON instead of markdown`, 'info', { globalOptions: options });
        output(`  --output <file>  Write context to file instead of console`, 'info', { globalOptions: options });
        output(`  --disable-git    Don't use Git for detecting files`, 'info', { globalOptions: options });
        break;

      case 'link':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt link <id> [file]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  id          Task ID to link file to (required)`, 'info', { globalOptions: options });
        output(`  file        File path to link (optional, auto-detects current file)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --auto=false    Disable auto-detection of current file`, 'info', { globalOptions: options });
        output(`  --force         Force linking even if file is already linked`, 'info', { globalOptions: options });
        output(`  --json          Output as JSON`, 'info', { globalOptions: options });
        break;

      case 'unlink':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt unlink <id> [file]`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  id          Task ID to unlink file from (required)`, 'info', { globalOptions: options });
        output(`  file        File path to unlink (optional, auto-detects current file)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --auto=false    Disable auto-detection of current file`, 'info', { globalOptions: options });
        output(`  --json          Output as JSON`, 'info', { globalOptions: options });
        break;

      case 'files-for-task':
        output(`\nUsage:`, 'info', { globalOptions: options });
        output(`  tt files-for-task <id>`, 'info', { globalOptions: options });
        output(`\nArguments:`, 'info', { globalOptions: options });
        output(`  id          Task ID to list files for (required)`, 'info', { globalOptions: options });
        output(`\nOptions:`, 'info', { globalOptions: options });
        output(`  --json      Output as JSON`, 'info', { globalOptions: options });
        break;
        
      default:
        output(`\nDetailed help for this command is not available yet.`, 'info', { globalOptions: options });
        break;
    }
    
    return { success: true };
  } catch (error) {
    output(`❌ Error showing command help: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  showHelp
}; 