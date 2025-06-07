# TaskTracker Examples

This directory contains **sanitized example data** to demonstrate TaskTracker's capabilities.

## What's Included

### `tasktracker-example-data/journal/entries.json`
Example journal entries showing different types of development activities:
- **Progress updates**: Feature implementation, bug fixes
- **Decisions**: Architecture choices, technology decisions  
- **Blockers**: Issues encountered during development
- **Learning**: TIL (Today I Learned) entries
- **Git integration**: Auto-journaled commits with metadata

### `tasktracker-example-data/config.json`
Example configuration showing:
- Project settings
- Git integration options
- Context generation preferences
- Journal defaults

## Using Examples

1. **Copy to your project**:
   ```bash
   cp -r examples/tasktracker-example-data/ your-project/.tasktracker/
   ```

2. **Generate context from examples**:
   ```bash
   cd your-project
   tt context-full
   ```

3. **View example entries**:
   ```bash
   tt journal-show
   ```

## Privacy & Security

⚠️ **Important**: These are **sanitized examples only**. 

Real TaskTracker data may contain:
- Project-specific implementation details
- Internal architecture decisions
- Personal development notes
- File paths and code references

**Never commit your actual `.tasktracker/` directory to version control.**

The main project `.gitignore` automatically excludes:
- `.tasktracker/` - Your real development journal
- `tasktracker-data/` - Alternative data directories
- `*context*.md` - Generated context files

## Real Usage

In real usage, your journal entries might look like:
```bash
tt j "Implemented OAuth integration with Google APIs"
tt j --type decision "Chose Prisma over TypeORM for better TypeScript support"  
tt j --type blocker "Database connection pooling causing memory leaks"
```

These create rich, searchable context for AI assistants while maintaining your development history locally and privately. 