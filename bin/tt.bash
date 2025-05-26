#!/usr/bin/env bash
# TaskTracker command completion script

_tasktracker_completions()
{
  local cur prev opts
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  
  # Main commands (Updated)
  local commands="init add quick list view update delete help context link unlink files-for-task ai ls status attach detach"
  
  # Task statuses for filtering
  local statuses="todo in_progress done blocked"
  
  # Task categories (Example - might need update based on actual usage)
  local categories="feature bug docs test refactor chore"
  
  # Options for specific commands
  case "${prev}" in
    list)
      # tt list [status] [--options]
      local opts="${statuses} --priority= --category= --keyword="
      COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
      return 0
      ;;
    update|view|delete|context|link|unlink|files-for-task)
      # These commands often expect a task ID next
      # Basic completion - just return, no suggestions here
      return 0
      ;;
    *)
      # Default: complete with available commands
      COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
      return 0
      ;;
  esac
}

# Register the completion function
complete -F _tasktracker_completions tt 