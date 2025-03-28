#!/usr/bin/env node

/**
 * TaskTracker One-Command Installer
 * 
 * This script provides a simplified one-command installation process
 * for the TaskTracker system.
 * 
 * Usage: node install.js [--auto]
 * Options:
 *   --auto: Automatically configure Git hooks and cron jobs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check for auto flag
const autoFlag = process.argv.includes('--auto');

// ASCII art banner for a nicer first impression
const banner = `
┌─────────────────────────────────────────────┐
│                                             │
│   ████████╗ █████╗ ███████╗██╗  ██╗         │
│   ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝         │
│      ██║   ███████║███████╗█████╔╝          │
│      ██║   ██╔══██║╚════██║██╔═██╗          │
│      ██║   ██║  ██║███████║██║  ██╗         │
│      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝         │
│                                             │
│   ████████╗██████╗  █████╗  ██████╗██╗  ██╗ │
│   ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝ │
│      ██║   ██████╔╝███████║██║     █████╔╝  │
│      ██║   ██╔══██╗██╔══██║██║     ██╔═██╗  │
│      ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗ │
│      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ │
│                                             │
└─────────────────────────────────────────────┘
`;

console.log(banner);
console.log('TaskTracker - Lightweight Task Management System');
console.log('================================================\n');

// Try to import the showQuickStartGuide function from tasktracker.js
let showQuickStartGuide;
try {
  // Use a relative path based on the current file's directory
  const taskTrackerPath = path.join(__dirname, 'tasktracker.js');
  if (fs.existsSync(taskTrackerPath)) {
    // Import the function if the file exists
    const taskTracker = require(taskTrackerPath);
    showQuickStartGuide = taskTracker.showQuickStartGuide;
  }
} catch (error) {
  // Fallback function if import fails
  showQuickStartGuide = function() {
    console.log('\nQuick Start:');
    console.log('  node tasktracker.js add         Create a new task');
    console.log('  node tasktracker.js list        List all tasks');
    console.log('  node tasktracker.js update      Update a task status');
  };
}

async function install() {
  try {
    // Step 1: Install core files
    console.log('📦 Step 1/3: Installing core files...');
    
    // Copy tasktracker.js
    if (fs.existsSync('taskmanager.js')) {
      fs.copyFileSync('taskmanager.js', 'tasktracker.js');
      console.log('✅ Created tasktracker.js');
    } else if (!fs.existsSync('tasktracker.js')) {
      console.error('❌ Error: taskmanager.js not found! Cannot continue installation.');
      process.exit(1);
    } else {
      console.log('✅ tasktracker.js already exists');
    }
    
    // Make it executable on Unix systems
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync('tasktracker.js', '755');
        console.log('✅ Made tasktracker.js executable');
      } catch (error) {
        console.log('⚠️ Could not make tasktracker.js executable. You may need to run: chmod +x tasktracker.js');
      }
    }
    
    // Copy stats-tracker.js if it exists
    if (fs.existsSync('stats-tracker.js')) {
      console.log('✅ stats-tracker.js already exists');
      
      // Make it executable on Unix systems
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('stats-tracker.js', '755');
          console.log('✅ Made stats-tracker.js executable');
        } catch (error) {
          console.log('⚠️ Could not make stats-tracker.js executable. You may need to run: chmod +x stats-tracker.js');
        }
      }
    } else {
      console.log('⚠️ stats-tracker.js not found. Statistics tracking will not be available.');
    }
    
    // Step 2: Initialize TaskTracker
    console.log('\n📝 Step 2/3: Initializing TaskTracker...');
    try {
      execSync('node tasktracker.js init', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Error initializing TaskTracker:', error.message);
      if (!autoFlag) {
        const continue_anyway = await askQuestion('Continue anyway? (y/n): ');
        if (continue_anyway.toLowerCase() !== 'y') {
          process.exit(1);
        }
      }
    }
    
    // Step 3: Setup automation (optional)
    if (autoFlag || await askQuestion('\nDo you want to set up automation (Git hooks and scheduled tasks)? (y/n): ') === 'y') {
      console.log('\n🚀 Step 3/3: Setting up automation...');
      
      if (fs.existsSync('auto-tracker.sh')) {
        try {
          if (process.platform === 'win32') {
            console.log('⚠️ Windows detected. You\'ll need to manually run auto-tracker.sh using Git Bash or WSL.');
          } else {
            execSync('bash auto-tracker.sh', { stdio: 'inherit' });
          }
        } catch (error) {
          console.error('❌ Error running auto-tracker.sh:', error.message);
        }
      } else {
        console.log('⚠️ auto-tracker.sh not found. Skipping automation setup.');
      }
    } else {
      console.log('\n🚀 Step 3/3: Skipping automation setup (manual mode).');
    }
    
    // Installation complete
    console.log('\n🎉 TaskTracker has been successfully installed!');

    // Use the imported function or fallback
    showQuickStartGuide();

    if (fs.existsSync('stats-tracker.js')) {
      console.log('  node stats-tracker.js snapshot  Take a statistics snapshot');
      console.log('  node stats-tracker.js report    Generate a project report');
    }
    
    console.log('\nFor more information, see TaskTracker-README.md');
  } catch (error) {
    console.error('❌ Unexpected error during installation:', error.message);
  } finally {
    rl.close();
  }
}

// Helper function to ask a question
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Run the installation
install().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
}); 