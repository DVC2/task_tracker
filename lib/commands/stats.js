/**
 * TaskTracker Stats Command
 * 
 * Shows statistics about journal entries and project progress
 */

const fs = require('fs');
const path = require('path');
const { output } = require('../core/formatting');
const { loadJournalEntries } = require('../utils/journal-utils');
const { loadPRD } = require('./prd');

/**
 * Show project statistics
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function showStats(args, options = {}) {
  try {
    const journalEntries = loadJournalEntries();
    const prd = loadPRD();
    
    if (journalEntries.length === 0) {
      output('📊 No journal entries found', 'info', { globalOptions: options });
      output('Start documenting your progress: tt journal "your update"', 'info', { globalOptions: options });
      return { success: true };
    }

    // Calculate statistics
    const stats = {
      totalEntries: journalEntries.length,
      byType: {},
      byDay: {},
      recentActivity: 0,
      projectAge: 0
    };

    // Group by type
    journalEntries.forEach(entry => {
      const type = entry.type || 'progress';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // Count recent activity (last 7 days)
      const entryDate = new Date(entry.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      if (entryDate > weekAgo) {
        stats.recentActivity++;
      }
    });

    // Calculate project age
    if (journalEntries.length > 0) {
      const firstEntry = new Date(journalEntries[0].timestamp);
      const now = new Date();
      stats.projectAge = Math.ceil((now - firstEntry) / (1000 * 60 * 60 * 24));
    }

    if (options.json) {
      output(JSON.stringify({
        success: true,
        data: { stats, prd: prd ? { title: prd.title, goals: prd.goals.length } : null }
      }, null, 2), 'data', { globalOptions: options });
    } else {
      displayStats(stats, prd, options);
    }

    return { success: true, stats };

  } catch (error) {
    output(`❌ Error generating stats: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Display statistics in human-readable format
 */
function displayStats(stats, prd, options) {
  output('📊 TaskTracker Project Statistics', 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  if (prd) {
    output(`📋 Project: ${prd.title}`, 'info', { globalOptions: options });
    output(`🎯 Goals: ${prd.goals.length} defined`, 'info', { globalOptions: options });
    output('', 'info', { globalOptions: options });
  }
  
  output(`📝 Total Journal Entries: ${stats.totalEntries}`, 'info', { globalOptions: options });
  output(`🔥 Recent Activity (7 days): ${stats.recentActivity} entries`, 'info', { globalOptions: options });
  output(`📅 Project Age: ${stats.projectAge} days`, 'info', { globalOptions: options });
  output('', 'info', { globalOptions: options });
  
  if (Object.keys(stats.byType).length > 0) {
    output('📈 Entry Types:', 'info', { globalOptions: options });
    Object.entries(stats.byType).forEach(([type, count]) => {
      const emoji = getTypeEmoji(type);
      output(`   ${emoji} ${type}: ${count}`, 'info', { globalOptions: options });
    });
    output('', 'info', { globalOptions: options });
  }
  
  const avgPerDay = stats.projectAge > 0 ? (stats.totalEntries / stats.projectAge).toFixed(1) : 0;
  output(`📊 Average entries per day: ${avgPerDay}`, 'info', { globalOptions: options });
  
  if (stats.recentActivity === 0 && stats.projectAge > 7) {
    output('💡 Tip: Regular journal updates help maintain better context!', 'info', { globalOptions: options });
  }
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
  showStats
}; 