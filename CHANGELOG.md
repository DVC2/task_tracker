# Changelog

All notable changes to TaskTracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-01-26

### 🎉 Major Release - Open Source Launch

This release represents a complete transformation of TaskTracker from a task management tool to a focused developer context journal designed for AI-assisted development.

### ✨ Added
- **Developer Journal System**: Track progress, decisions, blockers, and ideas
- **AI Context Generation**: Generate rich context for AI assistants
- **PRD Management**: Parse and maintain project requirements from text or markdown
- **Comprehensive CLI**: Intuitive commands with proper argument parsing
- **Search & Export**: Find and export development history
- **Test Coverage**: 28 comprehensive tests covering all major functionality
- **Open Source**: MIT license with contribution guidelines

### 🔄 Changed
- **Complete Architecture Rewrite**: Modern, maintainable codebase
- **CLI Interface**: Simplified commands focused on developer workflow
- **Data Storage**: Local JSON files for privacy and simplicity
- **Command Structure**: Intuitive aliases and consistent patterns

### 🗑️ Removed
- **Task Management**: Removed traditional task/todo functionality
- **Legacy Code**: Cleaned up all outdated components
- **Complex Dependencies**: Streamlined to essential packages only

### 🛠️ Technical Improvements
- **Zero Lint Issues**: Clean, consistent code style
- **Comprehensive Testing**: Full test coverage with CI/CD
- **Modern JavaScript**: ES6+ features and best practices
- **Proper Error Handling**: Graceful error handling throughout
- **Documentation**: Complete documentation and contribution guides

### 🔧 Developer Experience
- **Easy Installation**: Global npm package installation
- **Quick Setup**: Simple `tt init` to get started
- **Intuitive Commands**: Natural language-like CLI interface
- **Rich Output**: Formatted, colorized terminal output
- **File Integration**: Track files associated with journal entries

## [2.x.x] - Legacy Versions

Previous versions focused on task management functionality. See git history for details.

---

## Migration Guide

### From 2.x to 3.0

TaskTracker 3.0 is a complete rewrite with a different focus. There is no automatic migration path from 2.x task data.

**Recommended approach:**
1. Export any important data from 2.x manually
2. Install TaskTracker 3.0 fresh
3. Use `tt init` to set up the new journal system
4. Begin documenting your development work with the new journal commands

### New Workflow

```bash
# Old (2.x): Task management
tt add "Implement user auth"
tt list

# New (3.0): Development journal
tt j "Implemented user auth endpoint"
tt j --type decision "Using JWT for session management"
tt c  # Generate AI context
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to TaskTracker.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/tasktracker-cli/tasktracker/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/tasktracker-cli/tasktracker/discussions)
- 📖 **Documentation**: [docs/](docs/) directory 