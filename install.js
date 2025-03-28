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

async function install() {
  try {
    // Step 1: Ensure directories exist
    console.log('📦 Step 1/3: Setting up directory structure...');
    
    // Create bin and lib directories if they don't exist
    if (!fs.existsSync('bin')) {
      fs.mkdirSync('bin');
      console.log('✅ Created bin directory');
    }
    
    if (!fs.existsSync('lib')) {
      fs.mkdirSync('lib');
      console.log('✅ Created lib directory');
    }
    
    // Check that the main executable exists
    if (!fs.existsSync('bin/tasktracker')) {
      console.error('❌ Error: bin/tasktracker not found! Cannot continue installation.');
      process.exit(1);
    } else {
      console.log('✅ bin/tasktracker exists');
      
      // Make it executable on Unix systems
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('bin/tasktracker', '755');
          console.log('✅ Made bin/tasktracker executable');
        } catch (error) {
          console.log('⚠️ Could not make bin/tasktracker executable. You may need to run: chmod +x bin/tasktracker');
        }
      }
    }
    
    // Check core script files
    const libFiles = ['tasktracker.js', 'stats-tracker.js', 'quick-task.js', 'auto-tracker.sh'];
    let allFilesExist = true;
    
    for (const file of libFiles) {
      const filePath = path.join('lib', file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${filePath} exists`);
        
        // Make scripts executable on Unix systems
        if (process.platform !== 'win32' && (file.endsWith('.js') || file.endsWith('.sh'))) {
          try {
            fs.chmodSync(filePath, '755');
            console.log(`✅ Made ${filePath} executable`);
          } catch (error) {
            console.log(`⚠️ Could not make ${filePath} executable. You may need to run: chmod +x ${filePath}`);
          }
        }
      } else {
        console.log(`❌ ${filePath} not found!`);
        allFilesExist = false;
      }
    }
    
    if (!allFilesExist) {
      console.error('❌ Some required files are missing. Installation may not work correctly.');
      if (!autoFlag) {
        const continue_anyway = await askQuestion('Continue anyway? (y/n): ');
        if (continue_anyway.toLowerCase() !== 'y') {
          process.exit(1);
        }
      }
    }
    
    // Step 2: Initialize TaskTracker
    console.log('\n📝 Step 2/3: Initializing TaskTracker...');
    try {
      execSync('./bin/tasktracker init', { stdio: 'inherit' });
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
      
      try {
        execSync('./bin/tasktracker automate', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Error setting up automation:', error.message);
      }
    } else {
      console.log('\n🚀 Step 3/3: Skipping automation setup (manual mode).');
    }
    
    // Installation complete
    console.log('\n🎉 TaskTracker has been successfully installed!');
    console.log('\nQuick Start:');
    console.log('  ./bin/tasktracker add         Create a new task');
    console.log('  ./bin/tasktracker list        List all tasks');
    console.log('  ./bin/tasktracker update      Update a task status');
    console.log('  ./bin/tasktracker snapshot    Take a statistics snapshot');
    console.log('  ./bin/tasktracker report      Generate a project report');
    
    console.log('\nFor more information, see README.md');
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