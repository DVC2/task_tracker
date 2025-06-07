/**
 * TaskTracker Git Integration Commands
 * 
 * Seamless integration with git repositories for automatic context capture
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { output } = require('../core/formatting');
const { saveJournalEntry } = require('../utils/journal-utils');

let DATA_DIR = null;

/**
 * Initialize paths for git commands
 */
function initPaths(rootDir) {
  DATA_DIR = path.join(rootDir, '.tasktracker');
}

/**
 * Install git hook for automatic journaling
 */
function installHook(args, options = {}) {
  try {
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch (error) {
      output('❌ Not in a git repository', 'error', { globalOptions: options });
      return { success: false, error: 'Not in a git repository' };
    }

    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
    const hooksDir = path.join(gitDir, 'hooks');
    const hookPath = path.join(hooksDir, 'post-commit');

    // Ensure hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    // Get the current working directory to use relative path to tt
    const currentDir = process.cwd();
    const ttPath = path.join(currentDir, 'bin/tt');

    // Create the post-commit hook
    const hookScript = `#!/bin/sh
# TaskTracker Git Integration Hook
# Auto-journal git commits with optional context

# Use the local tt command from the project
TT_CMD="${ttPath}"

# Only run if tasktracker is available
if [ -f "$TT_CMD" ]; then
  # Get commit info
  COMMIT_HASH=$(git rev-parse HEAD)
  COMMIT_MSG=$(git log -1 --pretty=%B)
  BRANCH=$(git branch --show-current)
  AUTHOR=$(git log -1 --pretty=%an)
  
  # Extract commit type (feat/fix/chore) from conventional commits
  COMMIT_TYPE=$(echo "$COMMIT_MSG" | grep -o "^[a-z]*" | head -1)
  if [ -z "$COMMIT_TYPE" ]; then
    COMMIT_TYPE="commit"
  fi
  
  # Auto-journal the commit
  "$TT_CMD" j "Git $COMMIT_TYPE: $COMMIT_MSG" --type progress --tags "git,$COMMIT_TYPE,$BRANCH" --files "$(git diff --name-only HEAD~1 HEAD | tr '\\n' ',')"
  
  # Check if auto-prompting is enabled
  if [ -f ".tasktracker/git-auto" ]; then
    echo ""
    echo "📝 TaskTracker: Add additional context for this commit? (y/n/s=skip always)"
    read -r RESPONSE
    
    case $RESPONSE in
      [Yy]* )
        echo "Enter additional context (press Ctrl+D when done):"
        CONTEXT=$(cat)
        if [ ! -z "$CONTEXT" ]; then
          "$TT_CMD" j "$CONTEXT" --type context --tags "git,$COMMIT_TYPE,$BRANCH"
        fi
        ;;
      [Ss]* )
        # Disable auto-prompting
        rm -f ".tasktracker/git-auto"
        echo "Auto-prompting disabled. Use 'tt git auto on' to re-enable."
        ;;
      * )
        echo "Skipping additional context."
        ;;
    esac
  fi
else
  # Try global tt command as fallback
  if command -v tt >/dev/null 2>&1; then
    tt j "Git commit: $COMMIT_MSG" --type progress --tags "git,commit,$BRANCH"
  fi
fi
`;

    // Write the hook script
    fs.writeFileSync(hookPath, hookScript);
    
    // Make it executable
    fs.chmodSync(hookPath, '755');
    
    // Enable auto-prompting by default
    const autoFile = path.join(DATA_DIR, 'git-auto');
    fs.writeFileSync(autoFile, 'enabled');

    output('✅ Git hook installed successfully!', 'success', { globalOptions: options });
    output('📝 Your commits will now be automatically journaled', 'info', { globalOptions: options });
    output('💡 Use `tt git auto off` to disable auto-prompting', 'info', { globalOptions: options });
    
    return { success: true, hookPath };

  } catch (error) {
    output(`❌ Error installing git hook: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Sync recent commits as journal entries
 */
function syncCommits(args, options = {}) {
  try {
    const numCommits = parseInt(args[0]) || 10;

    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch (error) {
      output('❌ Not in a git repository', 'error', { globalOptions: options });
      return { success: false, error: 'Not in a git repository' };
    }

    // Get recent commits
    const logFormat = '--pretty=format:%H|%s|%an|%ad|%D';
    const gitLog = execSync(`git log -${numCommits} "${logFormat}" --date=iso`, { encoding: 'utf8' });
    
    const commits = gitLog.trim().split('\n').map(line => {
      const [hash, subject, author, date, refs] = line.split('|');
      
      // Extract branch from refs
      let branch = 'main';
      if (refs) {
        const branchMatch = refs.match(/origin\/([^,)]+)/);
        if (branchMatch) branch = branchMatch[1];
      }
      
      // Extract commit type
      const typeMatch = subject.match(/^([a-z]+)(\([^)]+\))?:/);
      const commitType = typeMatch ? typeMatch[1] : 'commit';
      
      return { hash, subject, author, date: new Date(date), branch, commitType };
    });

    output(`📥 Syncing ${commits.length} recent commits...`, 'info', { globalOptions: options });

    let synced = 0;
    for (const commit of commits) {
      // Get files changed in this commit
      let files = [];
      try {
        const filesChanged = execSync(`git diff --name-only ${commit.hash}~1 ${commit.hash}`, { encoding: 'utf8' }).trim();
        files = filesChanged ? filesChanged.split('\n') : [];
      } catch (e) {
        // First commit might not have parent
      }

      // Create journal entry
      const entry = {
        content: `Git ${commit.commitType}: ${commit.subject}`,
        type: 'progress',
        tags: ['git', commit.commitType, commit.branch],
        files: files.slice(0, 5), // Limit to first 5 files
        timestamp: commit.date.getTime(),
        metadata: {
          gitHash: commit.hash.substring(0, 8),
          author: commit.author
        }
      };

      saveJournalEntry(entry);
      synced++;
    }

    output(`✅ Synced ${synced} commits as journal entries`, 'success', { globalOptions: options });
    output('💡 Use `tt journal-show --tag git` to see git entries', 'info', { globalOptions: options });
    
    return { success: true, synced };

  } catch (error) {
    output(`❌ Error syncing commits: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Toggle auto-prompting for commit context
 */
function toggleAuto(args, options = {}) {
  try {
    const action = args[0]?.toLowerCase();
    const autoFile = path.join(DATA_DIR, 'git-auto');
    
    if (action === 'on') {
      fs.writeFileSync(autoFile, 'enabled');
      output('✅ Git auto-prompting enabled', 'success', { globalOptions: options });
      output('📝 You\'ll be prompted for context after each commit', 'info', { globalOptions: options });
    } else if (action === 'off') {
      if (fs.existsSync(autoFile)) {
        fs.unlinkSync(autoFile);
      }
      output('✅ Git auto-prompting disabled', 'success', { globalOptions: options });
      output('📝 Commits will still be auto-journaled', 'info', { globalOptions: options });
    } else {
      // Show current status
      const isEnabled = fs.existsSync(autoFile);
      output(`📊 Git auto-prompting: ${isEnabled ? 'enabled' : 'disabled'}`, 'info', { globalOptions: options });
      
      if (isEnabled) {
        output('💡 Use `tt git auto off` to disable', 'info', { globalOptions: options });
      } else {
        output('💡 Use `tt git auto on` to enable', 'info', { globalOptions: options });
      }
    }
    
    return { success: true, enabled: fs.existsSync(autoFile) };

  } catch (error) {
    output(`❌ Error toggling auto-prompting: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Show git integration status
 */
function showStatus(args, options = {}) {
  try {
    output('📊 TaskTracker Git Integration Status', 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });

    // Check if in git repo
    let inGitRepo = false;
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      inGitRepo = true;
    } catch (e) {
      // Not in git repo
    }

    output(`📁 Git Repository: ${inGitRepo ? '✅ Found' : '❌ Not found'}`, 'info', { globalOptions: options });

    if (inGitRepo) {
      // Check for hook
      const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
      const hookPath = path.join(gitDir, 'hooks', 'post-commit');
      const hookExists = fs.existsSync(hookPath);
      
      output(`🪝 Git Hook: ${hookExists ? '✅ Installed' : '❌ Not installed'}`, 'info', { globalOptions: options });
      
      // Check auto-prompting
      const autoFile = path.join(DATA_DIR, 'git-auto');
      const autoEnabled = fs.existsSync(autoFile);
      
      output(`🤖 Auto-prompting: ${autoEnabled ? '✅ Enabled' : '❌ Disabled'}`, 'info', { globalOptions: options });
      
      // Show recent git entries count
      try {
        const journalPath = path.join(DATA_DIR, 'journal.json');
        if (fs.existsSync(journalPath)) {
          const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
          const gitEntries = journal.filter(entry => entry.tags && entry.tags.includes('git'));
          output(`📝 Git Entries: ${gitEntries.length} total`, 'info', { globalOptions: options });
        }
      } catch (e) {
        // Ignore errors reading journal
      }

      output('', 'info', { globalOptions: options });
      
      if (!hookExists) {
        output('💡 Get started: `tt git install-hook`', 'info', { globalOptions: options });
      } else {
        output('💡 Sync recent commits: `tt git sync 20`', 'info', { globalOptions: options });
      }
    } else {
      output('', 'info', { globalOptions: options });
      output('💡 Initialize git: `git init`', 'info', { globalOptions: options });
    }
    
    return { success: true, inGitRepo, hookExists: false, autoEnabled: false };

  } catch (error) {
    output(`❌ Error checking git status: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initPaths,
  installHook,
  syncCommits,
  toggleAuto,
  showStatus
};