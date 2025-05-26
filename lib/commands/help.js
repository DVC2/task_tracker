/**
 * TaskTracker Help Command
 * 
 * Simplified help for context journal commands
 */

const { output } = require('../core/formatting');

/**
 * Initialize paths required by the help command
 * @param {string} rootDir The application root directory
 */
function initPaths(_rootDir) {
  // Help doesn't need special path initialization
}

/**
 * Show help information
 * @param {array} args Command arguments (optional topic)
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function showHelp(args, options = {}) {
  const topic = args && args.length > 0 ? args[0] : null;
  
  if (topic) {
    showSpecificHelp(topic, options);
  } else {
    showGeneralHelp(options);
  }
  
  return { success: true };
}

/**
 * Show general help information
 */
function showGeneralHelp(options) {
  output('📝 TaskTracker: Developer Context Journal', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  output('Usage:', 'info', { globalOptions: options });
  output('  tt <command> [arguments]', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('📖 Journal Commands:', 'info', { globalOptions: options });
  output('  journal "text"      Add development journal entry', 'info', { globalOptions: options });
  output('  journal-show        Show recent journal entries', 'info', { globalOptions: options });
  output('  journal-search      Search journal entries', 'info', { globalOptions: options });
  output('  journal-export      Export journal to file', 'info', { globalOptions: options });
  output('  j "text"            Alias for journal', 'info', { globalOptions: options });
  output('  js                  Alias for journal-show', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('📋 PRD Commands:', 'info', { globalOptions: options });
  output('  prd "description"   Parse and store project requirements', 'info', { globalOptions: options });
  output('  prd-show            Show current PRD summary', 'info', { globalOptions: options });
  output('  prd-context         Generate PRD context for AI', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('🤖 Context Commands:', 'info', { globalOptions: options });
  output('  context-quick       Generate quick context for AI assistance', 'info', { globalOptions: options });
  output('  context-full        Generate comprehensive development context', 'info', { globalOptions: options });
  output('  c                   Alias for context-quick', 'info', { globalOptions: options });
  output('  cf                  Alias for context-full', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('🔧 Setup:', 'info', { globalOptions: options });
  output('  init                Initialize TaskTracker in current directory', 'info', { globalOptions: options });
  output('  stats               Show project statistics', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('📚 Examples:', 'info', { globalOptions: options });
  output('  tt init                                    # Initialize project', 'info', { globalOptions: options });
  output('  tt prd "Build a REST API with JWT auth"   # Set project vision', 'info', { globalOptions: options });
  output('  tt j "Implemented user login" --type progress # Document progress', 'info', { globalOptions: options });
  output('  tt j "Using Redis for sessions" --type decision # Document decision', 'info', { globalOptions: options });
  output('  tt c                                       # Get AI context', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('💡 Workflow:', 'info', { globalOptions: options });
  output('  1. tt init                    # Setup', 'info', { globalOptions: options });
  output('  2. tt prd "project goals"     # Define vision', 'info', { globalOptions: options });
  output('  3. tt j "progress update"     # Document work', 'info', { globalOptions: options });
  output('  4. tt c                       # Generate context for AI', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('For detailed help: tt help <command>', 'info', { globalOptions: options });
}

/**
 * Show help for a specific command
 */
function showSpecificHelp(topic, options) {
  switch (topic.toLowerCase()) {
    case 'journal':
    case 'j':
      output('📖 Journal Command', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Usage: tt journal "your progress update" [options]', 'info', { globalOptions: options });
      output('       tt j "your progress update" [options]', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Document your development progress, decisions, and blockers.', 'info', { globalOptions: options });
      output('Journal entries maintain context across AI sessions.', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Options:', 'info', { globalOptions: options });
      output('  --type TYPE        Entry type: progress, decision, blocker, idea, context', 'info', { globalOptions: options });
      output('  --tags TAG1,TAG2   Comma-separated tags for categorization', 'info', { globalOptions: options });
      output('  --files FILE1,FILE2 Comma-separated files related to this entry', 'info', { globalOptions: options });
      output('  --json             Output result in JSON format', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Examples:', 'info', { globalOptions: options });
      output('  tt j "Implemented user authentication with JWT"', 'info', { globalOptions: options });
      output('  tt j "Using PostgreSQL over MongoDB" --type decision', 'info', { globalOptions: options });
      output('  tt j "CORS issues with API calls" --type blocker', 'info', { globalOptions: options });
      output('  tt j "Added rate limiting" --tags api,security --files auth.js', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Related Commands:', 'info', { globalOptions: options });
      output('  tt journal-show           Show recent entries', 'info', { globalOptions: options });
      output('  tt journal-search "query" Search entries', 'info', { globalOptions: options });
      output('  tt journal-export         Export journal', 'info', { globalOptions: options });
      break;
      
    case 'journal-show':
    case 'js':
      output('📖 Journal Show Command', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Usage: tt journal-show [limit] [options]', 'info', { globalOptions: options });
      output('       tt js [limit] [options]', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Show recent journal entries with optional filtering.', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Options:', 'info', { globalOptions: options });
      output('  --type TYPE        Filter by entry type', 'info', { globalOptions: options });
      output('  --tag TAG          Filter by tag', 'info', { globalOptions: options });
      output('  --date YYYY-MM-DD  Filter by date', 'info', { globalOptions: options });
      output('  --session SESSION  Filter by session', 'info', { globalOptions: options });
      output('  --json             Output in JSON format', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Examples:', 'info', { globalOptions: options });
      output('  tt js 20                    # Show last 20 entries', 'info', { globalOptions: options });
      output('  tt js --type decision       # Show only decisions', 'info', { globalOptions: options });
      output('  tt js --tag auth            # Show auth-related entries', 'info', { globalOptions: options });
      output('  tt js --date 2024-01-15     # Show entries from specific date', 'info', { globalOptions: options });
      break;
      
    case 'journal-search':
      output('🔍 Journal Search Command', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Usage: tt journal-search "search query" [options]', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Search journal entries by content, tags, type, or files.', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Options:', 'info', { globalOptions: options });
      output('  --limit NUMBER     Maximum results to show (default: 10)', 'info', { globalOptions: options });
      output('  --json             Output in JSON format', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Examples:', 'info', { globalOptions: options });
      output('  tt journal-search "authentication"', 'info', { globalOptions: options });
      output('  tt journal-search "cors" --limit 5', 'info', { globalOptions: options });
      output('  tt journal-search "decision" --json', 'info', { globalOptions: options });
      break;
      
    case 'journal-export':
      output('📤 Journal Export Command', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Usage: tt journal-export [format] [options]', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Export journal entries to markdown or JSON format.', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Formats:', 'info', { globalOptions: options });
      output('  markdown           Export as markdown (default)', 'info', { globalOptions: options });
      output('  json               Export as JSON', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Options:', 'info', { globalOptions: options });
      output('  --output FILE      Output filename', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Examples:', 'info', { globalOptions: options });
      output('  tt journal-export markdown', 'info', { globalOptions: options });
      output('  tt journal-export json --output backup.json', 'info', { globalOptions: options });
      break;
      
    case 'prd':
      output('📋 PRD Command', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Usage: tt prd "project description"', 'info', { globalOptions: options });
      output('       tt prd ./requirements.md', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Parse and store your Product Requirements Document.', 'info', { globalOptions: options });
      output('Helps maintain project vision and goals.', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Examples:', 'info', { globalOptions: options });
      output('  tt prd "Build a todo app with user auth and real-time sync"', 'info', { globalOptions: options });
      output('  tt prd ./project-requirements.md', 'info', { globalOptions: options });
      break;
      
    case 'context-quick':
    case 'c':
      output('🤖 Quick Context Command', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Usage: tt context-quick', 'info', { globalOptions: options });
      output('       tt c', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Generate essential context for immediate AI assistance.', 'info', { globalOptions: options });
      output('Perfect for starting new AI chat sessions.', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Copy the output and paste it to your AI assistant to provide context.', 'info', { globalOptions: options });
      break;
      
    case 'context-full':
      output('🤖 Full Context Command', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Usage: tt context-full [days]', 'info', { globalOptions: options });
      output('       tt context-full --output context.md', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Generate comprehensive development context.', 'info', { globalOptions: options });
      output('Includes PRD, journal entries, and project state.', 'info', { globalOptions: options });
      output('', 'info', { globalOptions: options });
      output('Examples:', 'info', { globalOptions: options });
      output('  tt context-full 14              # Last 14 days', 'info', { globalOptions: options });
      output('  tt context-full --output ctx.md # Save to file', 'info', { globalOptions: options });
      break;
      
    default:
      output(`❌ No help available for: ${topic}`, 'error', { globalOptions: options });
      output('Available commands: journal, journal-show, journal-search, journal-export,', 'info', { globalOptions: options });
      output('                   prd, context-quick, context-full, init, stats', 'info', { globalOptions: options });
  }
}

module.exports = {
  initPaths,
  showHelp
}; 