#!/usr/bin/env bash
# TaskTracker command completion script

_tasktracker_completions()
{
  local cur prev opts
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  
  # Main commands
  local commands="init add quick list view update changes files status release ai-context context \
                 code-health health verify update-config ignore archive restore archives commit \
                 context-export journal performance snapshot report compare trends stats setup \
                 automate onboard help stats"
  
  # Task statuses for filtering
  local statuses="todo in-progress review done"
  
  # Task categories
  local categories="feature bug docs test refactor chore"
  
  # Options for specific commands
  case "${prev}" in
    list)
      # tt list [status] [--options]
      local opts="${statuses} --current --full --priority= --category= --keyword="
      COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
      return 0
      ;;
    update)
      # If update is the previous word, expect a task ID
      return 0
      ;;
    view)
      # If view is the previous word, expect a task ID
      return 0
      ;;
    ignore)
      local ignore_opts="add remove list init"
      COMPREPLY=( $(compgen -W "${ignore_opts}" -- ${cur}) )
      return 0
      ;;
    archive|restore)
      # If archive/restore is the previous word, expect a task ID
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
complete -F _tasktracker_completions tasktracker 