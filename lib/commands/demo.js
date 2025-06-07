/**
 * TaskTracker Demo Command
 * 
 * Shows example workflow and helps users understand TaskTracker's capabilities
 */

const { output } = require('../core/formatting');
const { saveJournalEntry, getCurrentSession } = require('../utils/journal-utils');

/**
 * Initialize paths (demo doesn't need specific paths)
 */
function initPaths(_rootDir) {
  // Demo command doesn't need path initialization
}

/**
 * Show demo workflow
 */
function showDemo(args, options = {}) {
  output('🎬 TaskTracker Demo - Perfect Developer Memory Tool', 'success', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('📝 1. Start by setting your project vision:', 'info', { globalOptions: options });
  output('   tt prd "Building a REST API for user management with JWT auth"', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('🚀 2. Document your daily progress:', 'info', { globalOptions: options });
  output('   tt j "Implemented user registration endpoint"', 'info', { globalOptions: options });
  output('   tt j --type decision "Using bcrypt for password hashing"', 'info', { globalOptions: options });
  output('   tt j --type blocker "JWT refresh token logic is complex"', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('🤖 3. Generate context for your AI assistant:', 'info', { globalOptions: options });
  output('   tt c   # Quick context (last day)', 'info', { globalOptions: options });
  output('   tt cf  # Full context (last 7 days)', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('🔍 4. Search and review your work:', 'info', { globalOptions: options });
  output('   tt journal-search "authentication"', 'info', { globalOptions: options });
  output('   tt journal-show --type decision', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('💡 Pro Tips:', 'warning', { globalOptions: options });
  output('   • Be specific: "Fixed null check in auth middleware" > "fixed bug"', 'info', { globalOptions: options });
  output('   • Document decisions with reasoning', 'info', { globalOptions: options });
  output('   • Tag related work: --tags auth,security,backend', 'info', { globalOptions: options });
  output('   • Regenerate context at start of each AI session', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  output('🎯 Ready to try? Run: tt quickstart', 'success', { globalOptions: options });
  
  return { success: true };
}

/**
 * Create quickstart with sample data
 */
function createQuickstart(args, options = {}) {
  try {
    output('🚀 Setting up TaskTracker quickstart...', 'info', { globalOptions: options });
    
    // Create sample PRD
    const prdCommands = require('./prd');
    const samplePRD = 'Build a modern web application with user authentication, real-time features, and a clean API design. Focus on developer experience and maintainable code.';
    
    output('📋 Creating sample project vision...', 'info', { globalOptions: options });
    prdCommands.parsePRD([samplePRD], { ...options, journal: true });
    
    // Create sample journal entries
    const baseTime = Date.now();
    const session = getCurrentSession();
    
    const sampleEntries = [
      {
        id: baseTime + 1000,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        type: 'progress',
        content: 'Set up project structure and initial dependencies',
        tags: ['setup', 'initial'],
        files: ['package.json', 'src/app.js'],
        session: session
      },
      {
        id: baseTime + 2000,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        type: 'decision',
        content: 'Decided to use Express.js for the API framework - good ecosystem and middleware support',
        tags: ['architecture', 'backend'],
        files: ['src/server.js'],
        session: session
      },
      {
        id: baseTime + 3000,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        type: 'progress',
        content: 'Implemented basic authentication endpoints (/login, /register, /logout)',
        tags: ['auth', 'api'],
        files: ['src/routes/auth.js', 'src/middleware/auth.js'],
        session: session
      },
      {
        id: baseTime + 4000,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        type: 'blocker',
        content: 'JWT token refresh logic is getting complex - need to research best practices',
        tags: ['auth', 'jwt', 'research'],
        files: ['src/utils/jwt.js'],
        session: session
      }
    ];
    
    output('📝 Creating sample journal entries...', 'info', { globalOptions: options });
    sampleEntries.forEach(entry => {
      saveJournalEntry(entry);
    });
    
    output('', 'info', { globalOptions: options });
    output('✅ Quickstart complete! Here\'s what you can try:', 'success', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    
    output('🔍 View your journal:', 'info', { globalOptions: options });
    output('   tt js', 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    
    output('🤖 Generate AI context:', 'info', { globalOptions: options });
    output('   tt cf', 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    
    output('📋 View your project vision:', 'info', { globalOptions: options });
    output('   tt prd-show', 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    
    output('🔍 Search your work:', 'info', { globalOptions: options });
    output('   tt journal-search "auth"', 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
    
    output('➡️  Start adding your own entries with: tt j "your progress update"', 'warning', { globalOptions: options });
    
    return { success: true };
    
  } catch (error) {
    output(`❌ Error setting up quickstart: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initPaths,
  showDemo,
  createQuickstart
}; 