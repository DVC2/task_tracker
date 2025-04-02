# Shell Completion for TaskTracker

TaskTracker provides command auto-completion for Bash and Zsh shells, making it easier to use.

## Bash Completion Setup

To enable completion for TaskTracker in Bash:

1. Make sure the completions directory is in your PATH:

   ```bash
   # Add this to your ~/.bashrc or ~/.bash_profile
   export PATH="$PATH:/path/to/tasktracker/completions"
   ```

2. Source the completion script:

   ```bash
   # Add this to your ~/.bashrc or ~/.bash_profile
   source /path/to/tasktracker/completions/tt.bash
   ```

3. Reload your shell configuration:

   ```bash
   source ~/.bashrc  # or source ~/.bash_profile
   ```

## Zsh Completion Setup

For Zsh users:

1. Make sure the completions directory is in your PATH:

   ```zsh
   # Add this to your ~/.zshrc
   export PATH="$PATH:/path/to/tasktracker/completions"
   ```

2. Add the completion directory to your fpath:

   ```zsh
   # Add this to your ~/.zshrc
   fpath=(/path/to/tasktracker/completions $fpath)
   ```

3. Enable compinit if not already enabled:

   ```zsh
   # Add this to your ~/.zshrc if not already present
   autoload -Uz compinit && compinit
   ```

4. Source the Bash completion script (Zsh can use Bash completions):

   ```zsh
   # Add this to your ~/.zshrc
   source /path/to/tasktracker/completions/tt.bash
   ```

5. Reload your shell configuration:

   ```zsh
   source ~/.zshrc
   ```

## Testing the Completion

Once set up, you can test by typing `tt` or `tasktracker` followed by a space and pressing Tab. You should see available commands. 

For example:
- Type `tt l` and press Tab to autocomplete to `tt list`
- Type `tt list` and press Tab to see status filters and options

## Available Completions

The completion script provides suggestions for:

- All TaskTracker commands
- Task statuses when filtering lists
- Command-specific options (like `--current` for `list`)
- Arguments for commands like `ignore`

## Troubleshooting

If completion doesn't work:

1. Make sure the completion script is executable:
   ```bash
   chmod +x /path/to/tasktracker/completions/tt.bash
   ```

2. Verify the path in your shell configuration file is correct
3. Check if you have any error messages when opening a new terminal
4. Try restarting your terminal completely 