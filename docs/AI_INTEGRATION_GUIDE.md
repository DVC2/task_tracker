# TaskTracker AI Integration Guide

## Overview

TaskTracker is designed to be the memory layer between you and your AI assistants. This guide shows how to effectively use TaskTracker with various AI tools.

## Quick Start for AI Sessions

### 1. Starting a New Session
```bash
# Get immediate context
tt c

# Or for full context
tt cf
```

Copy the output and paste it at the beginning of your AI conversation. This gives the AI:
- Your current work status
- Recent decisions
- Active blockers
- Project goals

### 2. During Development
```bash
# Document progress
tt j "Implemented user authentication with JWT tokens"

# Record decisions
tt j --type decision "Using PostgreSQL for better JSON support"

# Note blockers
tt j --type blocker "CORS issues with frontend API calls"

# Tag important work
tt j --tags auth,security "Added password hashing with bcrypt"
```

### 3. Switching AI Tools
When moving from one AI to another (e.g., Cursor to ChatGPT):
```bash
# Generate fresh context
tt cf --output context.md

# Then paste the content into your new AI session
```

## Integration Patterns

### Pattern 1: Continuous Context (Recommended)
```bash
# Start of session
tt c

# After significant progress
tt j "Completed user registration flow"
tt c  # Regenerate context

# Before complex questions
tt cf  # Get full context for AI
```

### Pattern 2: Session-Based Development
```bash
# Morning startup
tt cf --output morning-context.md

# Throughout the day
tt j "progress updates..."

# End of day
tt j --type decision "Tomorrow: focus on API optimization"
tt journal-export markdown --output today-journal.md
```

### Pattern 3: Feature-Focused Context
```bash
# Tag all work on a feature
tt j --tags auth "Starting OAuth implementation"
tt j --tags auth "Added Google OAuth provider"

# Get feature-specific context
tt journal-show --tag auth
```

## AI Tool-Specific Tips

### Cursor
1. Use `tt c` output in your system prompt
2. Update context after file changes
3. Use `tt j --files filename.js` to track file-specific work

### ChatGPT/Claude
1. Start conversations with `tt cf` output
2. Use `tt journal-export` for long conversations
3. Reference specific decisions: `tt journal-search "architecture"`

### GitHub Copilot
1. Keep `context.md` in your project root
2. Update it regularly: `tt cf --output context.md`
3. Reference it in comments for better suggestions

## Advanced Workflows

### 1. PRD-Driven Development
```bash
# Set project vision
tt prd requirements.md

# Generate PRD context for AI
tt prd-context

# Combine with journal
tt cf  # Includes both PRD and journal
```

### 2. Debugging with Context
```bash
# Document the issue
tt j --type blocker "API returns 500 on user creation"

# Add relevant files
tt j --files "api/users.js,models/user.js" "Investigating user creation bug"

# Generate debug context
tt cf 1  # Last day only for focused context
```

### 3. Architecture Decisions
```bash
# Document major decisions
tt j --type decision --tags architecture "Microservices for scalability"

# Export architecture decisions
tt journal-search "architecture" 
tt journal-export markdown --output architecture-decisions.md
```

## Best Practices

### 1. Context Hygiene
- Regenerate context at the start of each session
- Use `tt c` for quick questions
- Use `tt cf` for complex implementation tasks

### 2. Meaningful Entries
❌ Bad: `tt j "fixed bug"`
✅ Good: `tt j "Fixed null pointer in user auth when email is missing"`

### 3. Decision Documentation
Always document "why" not just "what":
```bash
tt j --type decision "Chose Redis for session storage due to auto-expiration feature"
```

### 4. Blocker Patterns
When stuck, document thoroughly:
```bash
tt j --type blocker "CORS error: 'Access-Control-Allow-Origin' missing"
tt j "Tried adding cors middleware - still failing"
tt j --type decision "Solution: Configure CORS before other middleware"
```

## JSON API for Tool Integration

TaskTracker supports JSON output for programmatic use:

```bash
# Get journal entries as JSON
tt journal-show --json

# Search with JSON output
tt journal-search "auth" --json

# Export for processing
tt journal-export json --output data.json
```

### JSON Structure
```json
{
  "success": true,
  "data": {
    "entries": [{
      "id": 1234567890,
      "timestamp": "2024-01-15T10:30:00Z",
      "type": "progress",
      "content": "Implemented user authentication",
      "tags": ["auth", "backend"],
      "files": ["auth.js"],
      "session": "2024-1-15-10"
    }]
  }
}
```

## Troubleshooting

### Context Too Long
```bash
# Limit to recent days
tt cf 3  # Last 3 days only

# Or use quick context
tt c  # Essential info only
```

### Missing Context
```bash
# Check journal entries
tt js

# Verify PRD
tt prd-show

# Regenerate everything
tt cf --output full-context.md
```

### Stale Context
```bash
# Always regenerate after breaks
tt c  # Quick refresh

# Document session boundaries
tt j --type context "Resuming after 2-day break"
```

## Future Integrations

TaskTracker is designed to be extended. Planned integrations:
- VS Code extension for automatic context updates
- GitHub Actions for PR context
- Slack bot for team context sharing
- API endpoints for custom integrations

---

Remember: TaskTracker is your development memory. The more you document, the better your AI assistants can help you. 