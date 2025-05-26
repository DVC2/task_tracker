# TaskTracker: Developer Context Journal 📝

[![npm version](https://badge.fury.io/js/tasktracker-cli.svg)](https://badge.fury.io/js/tasktracker-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/tasktracker-cli/tasktracker/workflows/Node.js%20CI/badge.svg)](https://github.com/tasktracker-cli/tasktracker/actions)

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
npm install -g tasktracker-cli

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

## 📖 **Core Features**

### Development Journal
Track your progress, decisions, and blockers:
```bash
tt j "Completed user authentication flow"
tt j --type decision "Switching from MongoDB to PostgreSQL"
tt j --type blocker "CORS issues with frontend"
tt j --tags api,auth "Added rate limiting to login endpoint"
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
tt j "Added user profile endpoints"

# Document decisions
tt j --type decision "Using Redis for session storage - built-in expiration"

# Note blockers
tt j --type blocker "WebSocket connection drops after 30 seconds"
```

### Debugging with AI
```bash
# Document the issue
tt j --type blocker "Users can't login - 401 errors"

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

1. **Not Another Task Manager** - It's a context journal, not a todo list
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
- ✅ Proper CLI argument parsing
- ✅ Clean, maintainable codebase
- ✅ Comprehensive test coverage

### Known Limitations
- No cloud sync (by design - local only)
- No team features (focused on individual developers)
- Basic search (no fuzzy matching yet)
- Limited to CLI (no GUI planned)

## 🛠️ **Development**

```bash
# Clone and install
git clone https://github.com/tasktracker-cli/tasktracker.git
cd tasktracker
npm install

# Run tests
npm test

# Lint code
npm run lint:check
npm run lint:fix
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines.

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📊 **Project Stats**

- 🧪 **28 tests** - All passing
- 🎯 **Zero lint issues** - Clean codebase
- 📦 **Lightweight** - Minimal dependencies
- 🚀 **Fast** - Optimized for developer workflow

## 🐛 **Issues & Support**

- **Bug Reports**: [GitHub Issues](https://github.com/tasktracker-cli/tasktracker/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/tasktracker-cli/tasktracker/discussions)
- **Documentation**: [docs/](docs/) directory

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

Built by developers, for developers who use AI assistants.

Special thanks to all [contributors](https://github.com/tasktracker-cli/tasktracker/contributors) who help make TaskTracker better.

---

**Stop re-explaining your project. Start preserving context.**

[⭐ Star us on GitHub](https://github.com/tasktracker-cli/tasktracker) | [📦 Install from npm](https://www.npmjs.com/package/tasktracker-cli) | [📖 Read the docs](docs/)