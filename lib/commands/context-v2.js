/**
 * TaskTracker Context V2 Command
 * 
 * Unified context generation combining PRD, journal entries, and project state
 * The main command for maintaining development context across AI sessions
 */

const fs = require('fs');
const path = require('path');
const { output } = require('../core/formatting');

/**
 * Initialize paths required by the context command
 * @param {string} _rootDir The application root directory (unused)
 */
function initPaths(_rootDir) {
  // Context uses journal and PRD data
}

/**
 * Generate comprehensive development context
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function generateFullContext(args, options = {}) {
  try {
    const days = parseInt(args[0]) || 7; // Default to last 7 days
    const format = options.format || 'markdown';
    
    // Load all data sources
    const prd = loadPRD();
    const journalEntries = loadRecentJournalEntries(days);
    const projectInfo = getProjectInfo();
    
    // Build comprehensive context
    const context = buildUnifiedContext({
      prd,
      journalEntries,
      projectInfo,
      days,
      format
    });
    
    if (options.output) {
      const outputPath = options.output.endsWith('.md') ? options.output : `${options.output}.md`;
      fs.writeFileSync(outputPath, context);
      output(`✅ Development context written to ${outputPath}`, 'success', { globalOptions: options });
    } else {
      output(context, 'info', { globalOptions: options });
    }

    return { 
      success: true, 
      context, 
      data: { prd, journalEntries, projectInfo } 
    };

  } catch (error) {
    output(`❌ Error generating context: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Quick context for immediate AI assistance
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function quickContext(args, options = {}) {
  try {
    // Get just the essentials for quick AI context
    const recentEntries = loadRecentJournalEntries(1); // Last day only
    const prd = loadPRD();
    
    let context = '# Quick Development Context\n\n';
    
    // Current status from latest journal entry
    if (recentEntries.length > 0) {
      const latest = recentEntries[recentEntries.length - 1];
      context += `## Current Status\n\n`;
      context += `**Last Update:** ${new Date(latest.timestamp).toLocaleDateString()}\n`;
      context += `**Working On:** ${latest.content}\n\n`;
    }
    
    // Project goals from PRD
    if (prd && prd.goals.length > 0) {
      context += `## Project Goals\n\n`;
      prd.goals.slice(0, 3).forEach((goal, i) => {
        context += `${i + 1}. ${goal}\n`;
      });
      context += '\n';
    }
    
    // Recent decisions and blockers
    const decisions = recentEntries.filter(e => e.type === 'decision');
    const blockers = recentEntries.filter(e => e.type === 'blocker');
    
    if (decisions.length > 0) {
      context += `## Recent Decisions\n\n`;
      decisions.slice(-3).forEach(decision => {
        context += `- ${decision.content}\n`;
      });
      context += '\n';
    }
    
    if (blockers.length > 0) {
      context += `## Current Blockers\n\n`;
      blockers.forEach(blocker => {
        context += `- ${blocker.content}\n`;
      });
      context += '\n';
    }
    
    context += `## AI Instructions\n\n`;
    context += `Continue from where we left off. Help implement the project goals while respecting previous decisions.\n`;
    
    if (options.output) {
      const outputPath = options.output.endsWith('.md') ? options.output : `${options.output}.md`;
      fs.writeFileSync(outputPath, context);
      output(`✅ Quick context written to ${outputPath}`, 'success', { globalOptions: options });
    } else {
      output(context, 'info', { globalOptions: options });
    }

    return { success: true, context };

  } catch (error) {
    output(`❌ Error generating quick context: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Build unified context from all data sources
 */
function buildUnifiedContext(data) {
  const { prd, journalEntries, projectInfo, days } = data;
  
  let context = '# Development Context Summary\n\n';
  
  // Project overview
  context += '## Project Overview\n\n';
  if (prd) {
    context += `**Project:** ${prd.title}\n`;
    if (prd.description) {
      context += `**Description:** ${prd.description}\n`;
    }
  } else {
    context += `**Project:** ${projectInfo.name || 'Current Project'}\n`;
  }
  
  if (journalEntries.length > 0) {
    const latest = journalEntries[journalEntries.length - 1];
    context += `**Last Update:** ${new Date(latest.timestamp).toLocaleDateString()}\n`;
    context += `**Current Focus:** ${latest.content}\n`;
  }
  context += '\n';
  
  // Project goals and requirements
  if (prd) {
    if (prd.goals.length > 0) {
      context += '## Project Goals\n\n';
      prd.goals.forEach((goal, i) => {
        context += `${i + 1}. ${goal}\n`;
      });
      context += '\n';
    }
    
    if (prd.features.length > 0) {
      context += '## Required Features\n\n';
      prd.features.forEach((feature, i) => {
        context += `${i + 1}. ${feature}\n`;
      });
      context += '\n';
    }
  }
  
  // Development progress
  if (journalEntries.length > 0) {
    context += `## Recent Progress (Last ${days} days)\n\n`;
    
    // Group by type
    const progressEntries = journalEntries.filter(e => e.type === 'progress');
    const decisions = journalEntries.filter(e => e.type === 'decision');
    const blockers = journalEntries.filter(e => e.type === 'blocker');
    const ideas = journalEntries.filter(e => e.type === 'idea');
    
    if (progressEntries.length > 0) {
      context += '### Progress Updates\n\n';
      progressEntries.slice(-10).forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        context += `- **${date}:** ${entry.content}\n`;
      });
      context += '\n';
    }
    
    if (decisions.length > 0) {
      context += '### Key Decisions\n\n';
      decisions.forEach(decision => {
        const date = new Date(decision.timestamp).toLocaleDateString();
        context += `- **${date}:** ${decision.content}\n`;
      });
      context += '\n';
    }
    
    if (blockers.length > 0) {
      context += '### Current Blockers\n\n';
      blockers.forEach(blocker => {
        const date = new Date(blocker.timestamp).toLocaleDateString();
        context += `- **${date}:** ${blocker.content}\n`;
      });
      context += '\n';
    }
    
    if (ideas.length > 0) {
      context += '### Ideas & Notes\n\n';
      ideas.slice(-5).forEach(idea => {
        const date = new Date(idea.timestamp).toLocaleDateString();
        context += `- **${date}:** ${idea.content}\n`;
      });
      context += '\n';
    }
  }
  
  // Files in focus
  const allFiles = [...new Set(journalEntries.flatMap(e => e.files || []))].filter(Boolean);
  if (allFiles.length > 0) {
    context += '## Files in Focus\n\n';
    allFiles.forEach(file => {
      context += `- ${file}\n`;
    });
    context += '\n';
  }
  
  // AI instructions
  context += '## AI Assistant Instructions\n\n';
  context += 'You are helping with this development project. Based on the context above:\n\n';
  
  context += '### Key Guidelines\n\n';
  context += '1. **Continue from current progress** - Build on the latest journal entries\n';
  context += '2. **Respect previous decisions** - Don\'t contradict established choices\n';
  context += '3. **Address blockers first** - Help resolve any mentioned issues\n';
  context += '4. **Stay aligned with goals** - All work should serve the project objectives\n';
  context += '5. **Maintain consistency** - Keep the same patterns and architecture\n\n';
  
  if (journalEntries.length > 0) {
    const latest = journalEntries[journalEntries.length - 1];
    context += `### Current Session\n\n`;
    context += `**Focus:** ${latest.content}\n`;
    context += `**Type:** ${latest.type}\n`;
    if (latest.tags.length > 0) {
      context += `**Tags:** ${latest.tags.join(', ')}\n`;
    }
    context += '\n';
  }
  
  context += '### Remember\n\n';
  context += '- Use `tt journal "your update"` to document progress and decisions\n';
  context += '- Use `tt journal --type decision "your decision"` for important choices\n';
  context += '- Use `tt journal --type blocker "your blocker"` when stuck\n';
  context += '- Use `tt context` to regenerate this context after significant progress\n\n';
  
  return context;
}

/**
 * Load PRD data
 */
function loadPRD() {
  const prdFile = path.join(process.cwd(), '.tasktracker', 'prd', 'current.json');
  
  if (!fs.existsSync(prdFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(prdFile, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * Load recent journal entries
 */
function loadRecentJournalEntries(days) {
  const journalFile = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
  
  if (!fs.existsSync(journalFile)) {
    return [];
  }

  try {
    const allEntries = JSON.parse(fs.readFileSync(journalFile, 'utf8'));
    
    // Filter by date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allEntries.filter(entry => 
      new Date(entry.timestamp) > cutoffDate
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (e) {
    return [];
  }
}

/**
 * Get basic project information
 */
function getProjectInfo() {
  const info = {
    name: 'Unknown Project',
    version: '1.0.0',
    description: ''
  };

  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      info.name = pkg.name || info.name;
      info.version = pkg.version || info.version;
      info.description = pkg.description || info.description;
    }
  } catch (e) {
    // Ignore errors
  }

  return info;
}

module.exports = {
  initPaths,
  generateFullContext,
  quickContext
}; 