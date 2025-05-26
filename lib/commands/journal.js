/**
 * TaskTracker Journal Command
 * 
 * Captures development context, decisions, and progress for AI and human reference
 * The core of maintaining context across development sessions
 */

const fs = require('fs');
const path = require('path');
const { output } = require('../core/formatting');
const { getCurrentSession, saveJournalEntry, loadJournalEntries } = require('../utils/journal-utils');

/**
 * Initialize paths required by the journal command
 * @param {string} rootDir The application root directory
 */
function initPaths(_rootDir) {
  // Journal will be stored in .tasktracker/journal/
}

/**
 * Add a journal entry
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function addEntry(args, options = {}) {
  try {
    const entryText = args.join(' ');
    const type = options.type || 'progress';
    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
    
    if (!entryText) {
      output('❌ Journal entry text required', 'error', { globalOptions: options });
      output('Usage: tt journal "Working on user auth, decided to use JWT tokens"', 'info', { globalOptions: options });
      return { success: false, error: 'Entry text required' };
    }

    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: type, // progress, decision, blocker, idea, context
      content: entryText,
      tags: tags,
      files: options.files ? options.files.split(',').map(f => f.trim()) : [],
      session: getCurrentSession()
    };

    saveJournalEntry(entry);
    
    if (options.json) {
      output(JSON.stringify({
        success: true,
        data: entry,
        message: 'Journal entry added'
      }, null, 2), 'data', { globalOptions: options });
    } else {
      output(`✅ Journal entry added (#${entry.id})`, 'success', { globalOptions: options });
      output(`📝 ${entry.content}`, 'info', { globalOptions: options });
      if (tags.length > 0) {
        output(`🏷️  Tags: ${tags.join(', ')}`, 'info', { globalOptions: options });
      }
    }

    return { success: true, entry };

  } catch (error) {
    output(`❌ Error adding journal entry: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Search journal entries
 * @param {array} args Search query
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function searchEntries(args, options = {}) {
  try {
    const query = args.join(' ').toLowerCase();
    
    if (!query) {
      output('❌ Search query required', 'error', { globalOptions: options });
      output('Usage: tt journal-search "authentication"', 'info', { globalOptions: options });
      return { success: false, error: 'Search query required' };
    }

    const entries = loadJournalEntries();
    
    // Search in content, tags, and type
    const results = entries.filter(entry => {
      const contentMatch = entry.content.toLowerCase().includes(query);
      const tagMatch = entry.tags.some(tag => tag.toLowerCase().includes(query));
      const typeMatch = entry.type.toLowerCase().includes(query);
      const fileMatch = entry.files.some(file => file.toLowerCase().includes(query));
      
      return contentMatch || tagMatch || typeMatch || fileMatch;
    });

    if (results.length === 0) {
      output(`📝 No entries found matching "${query}"`, 'info', { globalOptions: options });
      return { success: true, entries: [] };
    }

    if (options.json) {
      output(JSON.stringify({
        success: true,
        data: { entries: results, total: results.length, query }
      }, null, 2), 'data', { globalOptions: options });
    } else {
      output(`📖 Found ${results.length} entries matching "${query}":\n`, 'info', { globalOptions: options });
      displayEntries(results.slice(0, options.limit || 10), options);
    }

    return { success: true, entries: results };

  } catch (error) {
    output(`❌ Error searching entries: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Generate context summary for AI assistants
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function generateContext(args, options = {}) {
  try {
    const entries = loadJournalEntries();
    const days = parseInt(args[0]) || 7; // Default to last 7 days
    const includeFiles = options.files !== false;
    const includeDecisions = options.decisions !== false;
    
    // Filter recent entries
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentEntries = entries.filter(entry => 
      new Date(entry.timestamp) > cutoffDate
    );

    if (recentEntries.length === 0) {
      output('📝 No recent journal entries found', 'info', { globalOptions: options });
      output('Add your first entry: tt journal "Started working on user authentication"', 'info', { globalOptions: options });
      return { success: true, message: 'No entries found' };
    }

    const context = buildContextSummary(recentEntries, { includeFiles, includeDecisions });
    
    if (options.output) {
      const outputPath = options.output.endsWith('.md') ? options.output : `${options.output}.md`;
      fs.writeFileSync(outputPath, context);
      output(`✅ Context written to ${outputPath}`, 'success', { globalOptions: options });
    } else {
      output(context, 'info', { globalOptions: options });
    }

    return { success: true, context, entries: recentEntries };

  } catch (error) {
    output(`❌ Error generating context: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Show recent journal entries
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function showEntries(args, options = {}) {
  try {
    const entries = loadJournalEntries();
    const limit = parseInt(args[0]) || 10;
    const filterType = options.type;
    const filterTag = options.tag;
    const filterDate = options.date;
    const filterSession = options.session;

    let filteredEntries = entries;

    // Apply filters
    if (filterType) {
      filteredEntries = filteredEntries.filter(e => e.type === filterType);
    }
    if (filterTag) {
      filteredEntries = filteredEntries.filter(e => e.tags.includes(filterTag));
    }
    if (filterDate) {
      const targetDate = new Date(filterDate);
      filteredEntries = filteredEntries.filter(e => {
        const entryDate = new Date(e.timestamp);
        return entryDate.toDateString() === targetDate.toDateString();
      });
    }
    if (filterSession) {
      filteredEntries = filteredEntries.filter(e => e.session === filterSession);
    }

    // Sort by timestamp (newest first) and limit
    const recentEntries = filteredEntries
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    if (recentEntries.length === 0) {
      output('📝 No journal entries found', 'info', { globalOptions: options });
      return { success: true, entries: [] };
    }

    if (options.json) {
      output(JSON.stringify({
        success: true,
        data: { entries: recentEntries, total: entries.length }
      }, null, 2), 'data', { globalOptions: options });
    } else {
      output(`📖 Recent Journal Entries (${recentEntries.length}/${entries.length}):\n`, 'info', { globalOptions: options });
      displayEntries(recentEntries, options);
    }

    return { success: true, entries: recentEntries };

  } catch (error) {
    output(`❌ Error showing entries: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Export journal entries
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function exportEntries(args, options = {}) {
  try {
    const format = args[0] || 'markdown';
    const outputFile = options.output || `journal-export-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;
    
    const entries = loadJournalEntries();
    
    if (entries.length === 0) {
      output('📝 No journal entries to export', 'info', { globalOptions: options });
      return { success: true, message: 'No entries to export' };
    }

    let exportContent;
    
    if (format === 'json') {
      exportContent = JSON.stringify(entries, null, 2);
    } else {
      // Markdown format
      exportContent = '# Development Journal Export\n\n';
      exportContent += `**Exported:** ${new Date().toLocaleDateString()}\n`;
      exportContent += `**Total Entries:** ${entries.length}\n\n`;
      
      // Group by date
      const entriesByDate = {};
      entries.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        if (!entriesByDate[date]) {
          entriesByDate[date] = [];
        }
        entriesByDate[date].push(entry);
      });
      
      // Write entries by date
      Object.keys(entriesByDate).sort().reverse().forEach(date => {
        exportContent += `## ${date}\n\n`;
        entriesByDate[date].forEach(entry => {
          const time = new Date(entry.timestamp).toLocaleTimeString();
          const typeEmoji = getTypeEmoji(entry.type);
          
          exportContent += `### ${typeEmoji} ${time} - ${entry.type}\n\n`;
          exportContent += `${entry.content}\n\n`;
          
          if (entry.tags.length > 0) {
            exportContent += `**Tags:** ${entry.tags.join(', ')}\n\n`;
          }
          if (entry.files.length > 0) {
            exportContent += `**Files:** ${entry.files.join(', ')}\n\n`;
          }
        });
      });
    }
    
    fs.writeFileSync(outputFile, exportContent);
    output(`✅ Journal exported to ${outputFile}`, 'success', { globalOptions: options });
    
    return { success: true, file: outputFile, entries: entries.length };

  } catch (error) {
    output(`❌ Error exporting journal: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Display entries in a formatted way
 */
function displayEntries(entries, options) {
  entries.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const typeEmoji = getTypeEmoji(entry.type);
        
        output(`${typeEmoji} #${entry.id} - ${date} ${time}`, 'info', { globalOptions: options });
        output(`   ${entry.content}`, 'info', { globalOptions: options });
        
        if (entry.tags.length > 0) {
          output(`   🏷️  ${entry.tags.join(', ')}`, 'info', { globalOptions: options });
        }
        
        if (entry.files.length > 0) {
          output(`   📁 ${entry.files.join(', ')}`, 'info', { globalOptions: options });
        }
        
        output('', 'info', { globalOptions: options }); // Empty line
      });
}

/**
 * Build context summary for AI assistants
 */
function buildContextSummary(entries, options) {
  let context = '# Development Context Summary\n\n';
  
  // Project overview
  context += '## Project Status\n\n';
  const latestEntry = entries[entries.length - 1];
  if (latestEntry) {
    context += `**Last Update:** ${new Date(latestEntry.timestamp).toLocaleDateString()}\n`;
    context += `**Current Focus:** ${latestEntry.content}\n\n`;
  }

  // Recent decisions
  if (options.includeDecisions) {
    const decisions = entries.filter(e => e.type === 'decision');
    if (decisions.length > 0) {
      context += '## Key Decisions Made\n\n';
      decisions.forEach(decision => {
        const date = new Date(decision.timestamp).toLocaleDateString();
        context += `- **${date}:** ${decision.content}\n`;
      });
      context += '\n';
    }
  }

  // Current blockers
  const blockers = entries.filter(e => e.type === 'blocker');
  if (blockers.length > 0) {
    context += '## Current Blockers\n\n';
    blockers.forEach(blocker => {
      const date = new Date(blocker.timestamp).toLocaleDateString();
      context += `- **${date}:** ${blocker.content}\n`;
    });
    context += '\n';
  }

  // Progress timeline
  context += '## Recent Progress\n\n';
  const progressEntries = entries
    .filter(e => e.type === 'progress')
    .slice(-10); // Last 10 progress entries
    
  progressEntries.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    context += `- **${date}:** ${entry.content}\n`;
  });
  context += '\n';

  // Files being worked on
  if (options.includeFiles) {
    const allFiles = [...new Set(entries.flatMap(e => e.files))].filter(Boolean);
    if (allFiles.length > 0) {
      context += '## Files in Focus\n\n';
      allFiles.forEach(file => {
        context += `- ${file}\n`;
      });
      context += '\n';
    }
  }

  // AI Instructions
  context += '## AI Assistant Context\n\n';
  context += 'You are helping with this development project. Based on the journal entries above:\n\n';
  context += '1. **Continue from where we left off** - Reference the latest progress\n';
  context += '2. **Respect previous decisions** - Don\'t contradict established choices\n';
  context += '3. **Address current blockers** - Help resolve any mentioned issues\n';
  context += '4. **Maintain consistency** - Keep the same coding patterns and architecture\n\n';
  
  if (latestEntry) {
    context += `**Current Session Focus:** ${latestEntry.content}\n\n`;
  }

  context += '**Remember to update the journal:** Use `tt journal "your progress update"` to maintain context for future sessions.\n';

  return context;
}

/**
 * Get emoji for entry type
 */
function getTypeEmoji(type) {
  const emojis = {
    progress: '📈',
    decision: '🎯',
    blocker: '🚫',
    idea: '💡',
    context: '📝',
    bug: '🐛',
    feature: '✨'
  };
  return emojis[type] || '📝';
}

module.exports = {
  initPaths,
  addEntry,
  searchEntries,
  generateContext,
  showEntries,
  exportEntries,
  // Potentially other exported functions if they exist
}; 