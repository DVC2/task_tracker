const fs = require('fs');
const path = require('path');

/**
 * Get current session identifier
 * Consistent session ID format for grouping entries
 */
function getCurrentSession() {
  const now = new Date();
  // YYYY-MM-DD-HH format for session grouping
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
}

/**
 * Load all journal entries from the entries.json file
 * @returns {array} Array of journal entries, or empty array if error/not found
 */
function loadJournalEntries() {
  const journalFile = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
  if (!fs.existsSync(journalFile)) {
    return [];
  }
  try {
    const fileContent = fs.readFileSync(journalFile, 'utf8');
    if (fileContent.trim() === '') {
        return []; // Handle empty file
    }
    const entries = JSON.parse(fileContent);
    return Array.isArray(entries) ? entries : []; // Ensure it's an array
  } catch (e) {
    // console.error('Error loading journal entries:', e);
    return []; // If error (e.g. corrupt file or not an array), return empty
  }
}

/**
 * Save a journal entry to the entries.json file
 * This is a low-level utility. Calling functions should construct the entry object.
 * @param {object} entry The journal entry object to save
 */
function saveJournalEntry(entry) {
  const journalDir = path.join(process.cwd(), '.tasktracker', 'journal');
  if (!fs.existsSync(journalDir)) {
    fs.mkdirSync(journalDir, { recursive: true });
  }

  const journalFile = path.join(journalDir, 'entries.json');
  let entries = loadJournalEntries(); // Use the centralized loader

  entries.push(entry);
  fs.writeFileSync(journalFile, JSON.stringify(entries, null, 2));
}

module.exports = {
  getCurrentSession,
  loadJournalEntries,
  saveJournalEntry
}; 