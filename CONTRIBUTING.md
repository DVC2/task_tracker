# Contributing to TaskTracker

Thank you for your interest in contributing to TaskTracker! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tasktracker.git
   cd tasktracker
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 12.0.0
- npm or yarn

### Local Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run specific test suites
npm run test:journal
npm run test:prd
npm run test:context

# Lint code
npm run lint:check
npm run lint:fix

# Test CLI locally
node bin/tt --help
```

## 📝 Making Changes

### Branch Naming
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `test/description` - for test improvements

### Commit Messages
Follow conventional commit format:
- `feat: add new journal command`
- `fix: resolve CLI parsing issue`
- `docs: update README with examples`
- `test: add context generation tests`

### Code Style
- Follow existing code style
- Use ESLint configuration provided
- Add JSDoc comments for new functions
- Keep functions focused and small

## 🧪 Testing

### Running Tests
```bash
# All tests
npm test

# Specific test files
npm run test:journal
npm run test:prd
npm run test:context

# With coverage
npm run test:coverage
```

### Writing Tests
- Add tests for new features
- Use descriptive test names
- Mock external dependencies
- Test both success and error cases

Example test structure:
```javascript
describe('New Feature', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle valid input correctly', () => {
    // Test implementation
  });

  it('should handle errors gracefully', () => {
    // Error test
  });
});
```

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for all public functions
- Include parameter types and descriptions
- Document return values and exceptions

### User Documentation
- Update README.md for user-facing changes
- Add examples for new features
- Update CLI help text

## 🔄 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with tests
3. **Ensure all tests pass**: `npm test`
4. **Lint your code**: `npm run lint:check`
5. **Update documentation** if needed
6. **Submit a pull request** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## 🐛 Reporting Issues

### Bug Reports
Include:
- TaskTracker version
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

### Feature Requests
Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Additional context

## 🏗️ Architecture

### Project Structure
```
tasktracker/
├── bin/           # CLI entry points
├── lib/           # Core library code
│   ├── commands/  # Command implementations
│   ├── core/      # Core utilities
│   └── utils/     # Helper utilities
├── tests/         # Test files
├── docs/          # Documentation
└── README.md      # Main documentation
```

### Key Components
- **CLI Parser**: Handles command-line argument parsing
- **Command Registry**: Manages available commands
- **Journal System**: Manages development journal entries
- **Context Generation**: Creates AI-friendly context
- **PRD Management**: Handles project requirements

## 🤝 Community

### Getting Help
- Check existing issues and documentation
- Ask questions in GitHub Discussions
- Join our community chat (if available)

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow GitHub's community guidelines

## 📄 License

By contributing to TaskTracker, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- CHANGELOG.md for their contributions
- GitHub contributors list
- Special mentions for significant contributions

Thank you for helping make TaskTracker better! 🎉 