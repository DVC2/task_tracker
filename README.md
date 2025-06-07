# TaskTracker: Developer Context Journal 📝

[![npm version](https://badge.fury.io/js/@dvc2%2Ftasktracker-cli.svg)](https://www.npmjs.com/package/@dvc2/tasktracker-cli)
[![npm downloads](https://img.shields.io/npm/dm/@dvc2/tasktracker-cli.svg)](https://www.npmjs.com/package/@dvc2/tasktracker-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/DVC2/task_tracker/actions/workflows/test.yml/badge.svg)](https://github.com/DVC2/task_tracker/actions/workflows/test.yml)

**Your development memory across AI sessions.**

TaskTracker is a lightweight CLI tool that maintains context about your development work. It's designed for developers who use AI assistants and need to preserve project context across different sessions, tools, and time.

## 🎯 **Why TaskTracker?**

Every developer using AI assistants knows this pain:
- Start new chat → Explain entire project context again
- Switch AI tools → Lose all conversation history  
- Take a break → Forget where you left off
- Debug an issue → Can't remember what you already tried

**TaskTracker solves this by being your persistent development memory.**

## 🚀 **Quick Start**

```bash
# Install globally
npm install -g @dvc2/tasktracker-cli

# Initialize in your project
cd your-project
tt init

# Set your project vision
tt prd "Building a REST API for user management with JWT auth"

# Start documenting your work
tt j "Implemented user registration endpoint"
tt j --type decision "Using bcrypt for password hashing"
tt j --type blocker "JWT refresh token logic is complex"

# Generate context for your AI
tt c  # Quick context
tt cf # Full context with history
```

## 🚀 **Git Integration (NEW!)**

Seamlessly capture your development history:
```bash
# Install git hooks for auto-journaling
tt git-install-hook

# Now every commit automatically creates a journal entry!
git commit -m "feat: Add user authentication"
# → Automatically journaled with tags: git, feat, main

# Import recent commits
tt git-sync 10

# Toggle auto-prompting
tt git-auto off  # Disable context prompting
```

## 📖 **Core Features**

### Development Journal
Track your progress, decisions, and blockers:
```bash
# Quick aliases for common entries
tt done "Completed user authentication flow"
tt decided "Switching from MongoDB to PostgreSQL"
tt blocked "CORS issues with frontend"
tt til "Redis connection pooling improves performance"

# Or use the full command
tt j "Added rate limiting to login endpoint" --tags api,auth
```

### PRD Management
Parse and maintain your project requirements:
```bash
tt prd "Build a task management API with real-time updates"
tt prd requirements.md  # Or from a file
tt prd-show            # View parsed requirements
```

### AI Context Generation
Generate rich context for any AI assistant:
```bash
tt c                    # Quick context (last day)
tt cf                   # Full context (last 7 days)
tt cf 14                # Custom timeframe
tt cf --output ctx.md   # Save to file
```

### Search & Export
Find and export your development history:
```bash
tt journal-search "authentication"     # Search entries
tt journal-show --type decision       # Filter by type
tt journal-export markdown            # Export journal
```

## 💡 **Real-World Usage**

### Starting Your Day
```bash
# Get back up to speed
tt c
# Copy output to your AI assistant
```

### During Development
```bash
# Track progress
tt done "Added user profile endpoints"

# Document decisions
tt decided "Using Redis for session storage - built-in expiration"

# Note blockers
tt blocked "WebSocket connection drops after 30 seconds"
```

### Debugging with AI
```bash
# Document the issue
tt blocked "Users can't login - 401 errors"

# Add context
tt j "Checked: JWT secret is correct, token format is valid"
tt j "Suspecting: Token expiration or timezone issue"

# Get focused context for AI
tt cf 1  # Just today's context
```

## 📚 **All Commands**

### Journal Commands
- `tt journal "text"` (alias: `tt j`) - Add entry
- `tt journal-show` (alias: `tt js`) - Show entries  
- `tt journal-search "query"` - Search entries
- `tt journal-export [format]` - Export journal

### Productivity Aliases
- `tt done "text"` - Quick progress entry
- `tt decided "text"` - Quick decision entry
- `tt blocked "text"` - Quick blocker entry
- `tt til "text"` - Quick learning entry

### Git Integration
- `tt git-install-hook` - Install auto-journaling hook
- `tt git-sync [count]` - Import recent commits
- `tt git-auto [on|off]` - Toggle auto-prompting
- `tt git-status` - Show integration status

### Context Commands  
- `tt context-quick` (alias: `tt c`) - Quick context
- `tt context-full [days]` (alias: `tt cf`) - Full context

### PRD Commands
- `tt prd "description"` - Set project requirements
- `tt prd-show` - View current PRD
- `tt prd-context` - Generate PRD context

### Other Commands
- `tt init` - Initialize TaskTracker
- `tt stats` - Show project statistics
- `tt help [command]` - Get help

## 🔧 **Command Options**

### Journal Options
```bash
tt j "text" --type [progress|decision|blocker|idea|context]
tt j "text" --tags tag1,tag2,tag3
tt j "text" --files file1.js,file2.py
```

### Filter Options
```bash
tt journal-show --type decision
tt journal-show --tag architecture  
tt journal-show --date 2024-01-15
```

### Output Options
```bash
tt cf --output context.md
tt journal-export json --output backup.json
```

## 🎨 **What Makes TaskTracker Different**

1. **Git Integration** - Automatically captures your development history
2. **AI-First Design** - Built specifically for AI-assisted development
3. **Zero Friction** - Simple commands that fit your workflow
4. **Local & Private** - Your data stays in your project

## 🤝 **Integration Guide**

See [AI Integration Guide](docs/AI_INTEGRATION_GUIDE.md) for detailed patterns and workflows with:
- Cursor
- ChatGPT / Claude
- GitHub Copilot
- Custom integrations

## 📈 **Best Practices**

1. **Be Specific**: "Fixed null check in auth middleware" > "fixed bug"
2. **Document Why**: Include reasoning in decisions
3. **Tag Consistently**: Use tags to group related work
4. **Regular Context**: Regenerate context at session start

## 🚧 **Current Status**

**Version 3.0** - Recently refactored from a task manager to a focused developer context journal.

### What's Working
- ✅ All journal functionality (add, show, search, export)
- ✅ PRD parsing and management
- ✅ AI context generation (quick & full)
- ✅ Git integration with auto-journaling
- ✅ Productivity aliases for quick entries
- ✅ Clean, maintainable codebase
- ✅ Comprehensive test coverage

### Known Limitations
- No cloud sync (by design - local only)
- No team features (focused on individual developers)
- Basic search (no fuzzy matching yet)
- Limited to CLI (no GUI planned)

## 🔒 **Security & Privacy**

TaskTracker stores all data locally in the `.tasktracker/` directory. This directory contains your development journal and should **never** be committed to version control.

⚠️ **Important Security Notes:**
- Your journal entries are stored locally and privately
- The `.gitignore` automatically excludes `.tasktracker/` directories  
- Never commit real journal data to public repositories
- Use the sanitized examples in `examples/` for demos or documentation

## 📚 **Examples & Documentation**

Check out the [examples directory](examples/) for:
- Sample journal entries
- Example configurations
- Usage patterns
- Best practices

## 🤝 **Contributing**

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Code style guide
- Pull request process
- Testing requirements

## 📄 **License**

TaskTracker is [MIT licensed](LICENSE).

## 🙏 **Acknowledgments**

Built by developers, for developers who use AI assistants.

Special thanks to all [contributors](https://github.com/tasktracker-cli/tasktracker/contributors) who help make TaskTracker better.

---

**Stop re-explaining your project. Start preserving context.**

[⭐ Star us on GitHub](https://github.com/tasktracker-cli/tasktracker) | [📦 Install from npm](https://www.npmjs.com/package/tasktracker-cli) | [📖 Read the docs](docs/)