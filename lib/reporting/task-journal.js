#!/usr/bin/env node

/**
 * TaskTracker - Task Session Journal
 * 
 * Tracks work sessions on tasks with start/end times and notes.
 * Helps maintain a record of time spent and work accomplished.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Constants
const DATA_DIR = path.join(process.cwd(), '.tasktracker');
const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
const JOURNAL_PATH = path.join(DATA_DIR, 'journal.json');

/**
 * Start a work session on a task
 * 
 * @param {string} taskId - The ID of the task to work on
 * @param {Object} options - Options for the session
 */
async function startSession(taskId, options = {}) {
  try {
    // Check if TaskTracker is initialized
    if (!fs.existsSync(TASKS_PATH)) {
      console.error('❌ TaskTracker not initialized! Please run: tasktracker init');
      process.exit(1);
    }

    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    // Find the task
    const task = tasksData.tasks.find(t => t.id.toString() === taskId.toString());
    if (!task) {
      console.error(`❌ Task #${taskId} not found`);
      process.exit(1);
    }

    // Load or initialize journal
    let journalData = { sessions: [] };
    if (fs.existsSync(JOURNAL_PATH)) {
      try {
        journalData = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
      } catch (error) {
        console.warn(`⚠️ Error reading journal file: ${error.message}`);
        console.warn('Creating a new journal file');
      }
    }
    
    // Check for any active sessions
    const activeSession = journalData.sessions.find(s => s.active === true);
    if (activeSession) {
      console.error(`❌ You already have an active session on Task #${activeSession.taskId}: ${activeSession.taskTitle}`);
      console.error(`Started at ${new Date(activeSession.startTime).toLocaleString()}`);
      console.error('End your current session first with: tasktracker journal end');
      process.exit(1);
    }
    
    // Create new session
    const session = {
      id: Date.now().toString(),
      taskId: task.id,
      taskTitle: task.title,
      startTime: new Date().toISOString(),
      active: true,
      initialNotes: options.notes || '',
      endTime: null,
      duration: null,
      finalNotes: null
    };
    
    // Add to journal
    journalData.sessions.push(session);
    fs.writeFileSync(JOURNAL_PATH, JSON.stringify(journalData, null, 2));
    
    // Update task status to in-progress if not already
    if (task.status !== 'in-progress') {
      task.status = 'in-progress';
      task.lastUpdated = new Date().toISOString();
      fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
      console.log(`📝 Updated Task #${task.id} status to in-progress`);
    }
    
    console.log(`⏱️ Started work session for Task #${task.id}: ${task.title}`);
    console.log(`⏰ Started at ${new Date(session.startTime).toLocaleString()}`);
    
    if (session.initialNotes) {
      console.log(`📝 Initial notes: ${session.initialNotes}`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * End the current work session
 * 
 * @param {Object} options - Options for ending the session
 */
async function endSession(options = {}) {
  try {
    // Check if journal exists
    if (!fs.existsSync(JOURNAL_PATH)) {
      console.error('❌ No journal file found. Have you started any sessions?');
      process.exit(1);
    }

    // Load journal
    const journalData = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
    
    // Find active session
    const activeSessionIndex = journalData.sessions.findIndex(s => s.active === true);
    if (activeSessionIndex === -1) {
      console.error('❌ No active session found');
      process.exit(1);
    }
    
    const session = journalData.sessions[activeSessionIndex];
    
    // Set end time and calculate duration
    session.endTime = new Date().toISOString();
    const durationMs = new Date(session.endTime) - new Date(session.startTime);
    session.duration = Math.round(durationMs / 1000 / 60); // Duration in minutes
    session.active = false;
    
    // Get notes from options or prompt
    session.finalNotes = options.notes || '';
    
    if (!options.notes && !options.silent) {
      // Prompt for notes if not provided
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      session.finalNotes = await new Promise((resolve) => {
        rl.question('Enter notes for this session (what did you accomplish?): ', resolve);
      });
      
      rl.close();
    }
    
    // Update journal
    journalData.sessions[activeSessionIndex] = session;
    fs.writeFileSync(JOURNAL_PATH, JSON.stringify(journalData, null, 2));
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    // Find the task and update it with session info
    const task = tasksData.tasks.find(t => t.id.toString() === session.taskId.toString());
    if (task) {
      // Update task with session info
      if (!task.sessions) {
        task.sessions = [];
      }
      
      task.sessions.push({
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        notes: session.finalNotes
      });
      
      // Update total time spent
      if (!task.timeSpent) {
        task.timeSpent = 0;
      }
      
      task.timeSpent += session.duration;
      
      // Update task last updated timestamp
      task.lastUpdated = new Date().toISOString();
      
      // Add a comment about the session if there are notes
      if (session.finalNotes) {
        if (!task.comments) {
          task.comments = [];
        }
        
        task.comments.push({
          author: process.env.USER || 'TaskTracker',
          date: new Date().toISOString(),
          text: `Work session (${session.duration} minutes): ${session.finalNotes}`
        });
      }
      
      // Save updated task data
      fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksData, null, 2));
    }
    
    // Format duration nicely
    let durationText = '';
    if (session.duration >= 60) {
      const hours = Math.floor(session.duration / 60);
      const minutes = session.duration % 60;
      durationText = `${hours}h ${minutes}m`;
    } else {
      durationText = `${session.duration}m`;
    }
    
    console.log(`⏱️ Ended work session for Task #${session.taskId}: ${session.taskTitle}`);
    console.log(`⏰ Duration: ${durationText}`);
    console.log(`🕒 Started: ${new Date(session.startTime).toLocaleString()}`);
    console.log(`🕒 Ended: ${new Date(session.endTime).toLocaleString()}`);
    
    if (session.finalNotes) {
      console.log(`📝 Session notes: ${session.finalNotes}`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Show journal entries
 * 
 * @param {Object} options - Options for filtering and display
 */
function showJournal(options = {}) {
  try {
    // Check if journal exists
    if (!fs.existsSync(JOURNAL_PATH)) {
      console.log('📓 No journal entries yet');
      return;
    }

    // Load journal
    const journalData = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
    
    if (!journalData.sessions || journalData.sessions.length === 0) {
      console.log('📓 No journal entries yet');
      return;
    }
    
    // Filter entries
    let filteredSessions = journalData.sessions;
    
    // Filter by task ID if provided
    if (options.taskId) {
      filteredSessions = filteredSessions.filter(s => 
        s.taskId.toString() === options.taskId.toString()
      );
    }
    
    // Filter by day if provided
    if (options.day) {
      // Parse day string (YYYY-MM-DD)
      const dayStart = new Date(options.day);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(options.day);
      dayEnd.setHours(23, 59, 59, 999);
      
      filteredSessions = filteredSessions.filter(s => {
        const sessionTime = new Date(s.startTime);
        return sessionTime >= dayStart && sessionTime <= dayEnd;
      });
    }
    
    // Sort by start time (newest first)
    filteredSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      filteredSessions = filteredSessions.slice(0, options.limit);
    }
    
    // Display sessions
    console.log('📓 Work Session Journal:');
    console.log('---------------------');
    
    let totalDuration = 0;
    
    filteredSessions.forEach(session => {
      const startTime = new Date(session.startTime).toLocaleString();
      let endTime = 'Active';
      let duration = 'Ongoing';
      
      if (session.endTime) {
        endTime = new Date(session.endTime).toLocaleString();
        
        if (session.duration) {
          if (session.duration >= 60) {
            const hours = Math.floor(session.duration / 60);
            const minutes = session.duration % 60;
            duration = `${hours}h ${minutes}m`;
          } else {
            duration = `${session.duration}m`;
          }
          
          totalDuration += session.duration;
        }
      }
      
      console.log(`Task #${session.taskId}: ${session.taskTitle}`);
      console.log(`🕒 Started: ${startTime}`);
      console.log(`🕒 Ended: ${endTime}`);
      console.log(`⏱️ Duration: ${duration}`);
      
      if (session.initialNotes) {
        console.log(`📝 Initial notes: ${session.initialNotes}`);
      }
      
      if (session.finalNotes) {
        console.log(`📝 Final notes: ${session.finalNotes}`);
      }
      
      console.log('---------------------');
    });
    
    // Show totals
    if (totalDuration > 0) {
      let totalDurationText = '';
      if (totalDuration >= 60) {
        const hours = Math.floor(totalDuration / 60);
        const minutes = totalDuration % 60;
        totalDurationText = `${hours}h ${minutes}m`;
      } else {
        totalDurationText = `${totalDuration}m`;
      }
      
      console.log(`Total time: ${totalDurationText}`);
    }
    
    // Show active session if any
    const activeSession = journalData.sessions.find(s => s.active === true);
    if (activeSession) {
      const startTime = new Date(activeSession.startTime).toLocaleString();
      const durationMs = new Date() - new Date(activeSession.startTime);
      const durationMinutes = Math.round(durationMs / 1000 / 60);
      
      let durationText = '';
      if (durationMinutes >= 60) {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        durationText = `${hours}h ${minutes}m`;
      } else {
        durationText = `${durationMinutes}m`;
      }
      
      console.log('\n⚠️ Active Session:');
      console.log(`Task #${activeSession.taskId}: ${activeSession.taskTitle}`);
      console.log(`🕒 Started: ${startTime}`);
      console.log(`⏱️ Current duration: ${durationText}`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Show summary of time spent on tasks
 */
function showSummary() {
  try {
    // Check if journal exists
    if (!fs.existsSync(JOURNAL_PATH)) {
      console.log('📊 No journal entries yet');
      return;
    }

    // Load journal
    const journalData = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
    
    if (!journalData.sessions || journalData.sessions.length === 0) {
      console.log('📊 No journal entries yet');
      return;
    }
    
    // Load tasks
    const tasksData = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    
    // Calculate time spent per task
    const taskTimeMap = {};
    
    journalData.sessions.forEach(session => {
      if (!session.endTime || !session.duration) return;
      
      if (!taskTimeMap[session.taskId]) {
        taskTimeMap[session.taskId] = {
          id: session.taskId,
          title: session.taskTitle,
          duration: 0,
          sessions: 0
        };
      }
      
      taskTimeMap[session.taskId].duration += session.duration;
      taskTimeMap[session.taskId].sessions++;
    });
    
    // Convert to array and sort by time spent (most first)
    const taskTimes = Object.values(taskTimeMap).sort((a, b) => b.duration - a.duration);
    
    // Display summary
    console.log('📊 Task Time Summary:');
    console.log('--------------------');
    
    let totalDuration = 0;
    
    taskTimes.forEach(task => {
      totalDuration += task.duration;
      
      let durationText = '';
      if (task.duration >= 60) {
        const hours = Math.floor(task.duration / 60);
        const minutes = task.duration % 60;
        durationText = `${hours}h ${minutes}m`;
      } else {
        durationText = `${task.duration}m`;
      }
      
      console.log(`Task #${task.id}: ${task.title}`);
      console.log(`⏱️ Total time: ${durationText}`);
      console.log(`📝 Sessions: ${task.sessions}`);
      console.log('--------------------');
    });
    
    // Show total time
    let totalDurationText = '';
    if (totalDuration >= 60) {
      const hours = Math.floor(totalDuration / 60);
      const minutes = totalDuration % 60;
      totalDurationText = `${hours}h ${minutes}m`;
    } else {
      totalDurationText = `${totalDuration}m`;
    }
    
    console.log(`Total time across all tasks: ${totalDurationText}`);
    console.log(`Total sessions: ${journalData.sessions.filter(s => s.endTime).length}`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Process main command
async function processCommand() {
  const args = process.argv.slice(2);
  const command = args[0] || 'show';
  
  const options = {
    taskId: null,
    notes: null,
    day: null,
    limit: 0,
    silent: false
  };
  
  // Parse additional arguments
  if (command === 'start') {
    options.taskId = args[1];
    options.notes = args.slice(2).join(' ');
    
    if (!options.taskId) {
      console.error('❌ Task ID required');
      console.error('Usage: task-journal start <task-id> [initial notes]');
      process.exit(1);
    }
    
    await startSession(options.taskId, options);
  } 
  else if (command === 'end') {
    options.notes = args.slice(1).join(' ');
    await endSession(options);
  }
  else if (command === 'show') {
    // Process show options
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--task' && args[i+1]) {
        options.taskId = args[i+1];
        i++;
      } else if (args[i] === '--day' && args[i+1]) {
        options.day = args[i+1];
        i++;
      } else if (args[i] === '--limit' && args[i+1]) {
        options.limit = parseInt(args[i+1]);
        i++;
      }
    }
    
    showJournal(options);
  }
  else if (command === 'summary') {
    showSummary();
  }
  else {
    console.error(`❌ Unknown command: ${command}`);
    console.error('Available commands: start, end, show, summary');
    process.exit(1);
  }
}

// Allow use as a command-line script or imported module
if (require.main === module) {
  processCommand().catch(error => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  });
} else {
  module.exports = { 
    startSession,
    endSession,
    showJournal,
    showSummary
  };
} 