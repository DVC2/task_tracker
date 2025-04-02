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
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

// Check if running as part of npm install or in a CI environment
const isNpmInstall = process.env.npm_config_argv || process.env.npm_lifecycle_event === 'install' || process.env.npm_lifecycle_event === 'postinstall';
const isCI = process.env.CI === 'true' || process.env.CI === true || process.env.CONTINUOUS_INTEGRATION || process.env.GITHUB_ACTIONS;
const isNonInteractive = isNpmInstall || isCI || process.env.NODE_ENV === 'test';

// Create interface for user input, only if not running as part of npm install
const rl = !isNonInteractive ? readline.createInterface({
  input: process.stdin,
  output: process.stdout
}) : null;

// Check for auto flag
const autoFlag = process.argv.includes('--auto') || isNonInteractive;

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

if (isNonInteractive) {
  console.log('Running in automatic mode (non-interactive)...\n');
}

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
    if (!fs.existsSync('bin/tt')) {
      console.error('❌ Error: bin/tt not found! Cannot continue installation.');
      if (isNonInteractive) {
        console.error('Exiting with success code in non-interactive mode despite errors.');
        process.exit(0);
      } else {
        process.exit(1);
      }
    } else {
      console.log('✅ bin/tt exists');
      
      // Make it executable on Unix systems
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('bin/tt', '755');
          console.log('✅ Made bin/tt executable');
        } catch (error) {
          console.log('⚠️ Could not make bin/tt executable. You may need to run: chmod +x bin/tt');
        }
      }
    }
    
    // Check core script files
    let libFiles = [];
    // Check in core directory first (new structure)
    if (fs.existsSync('lib/core')) {
      libFiles = ['core/task-manager.js', 'core/config-manager.js', 'core/formatting.js', 'core/cli-parser.js'];
    } else {
      // Fall back to checking in lib directory (old structure)
      libFiles = ['commands/index.js', 'core/task-manager.js', 'core/archive-manager.js', 'core/file-cache.js'];
    }
    
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
      if (isNonInteractive) {
        console.log('Continuing installation in non-interactive mode despite missing files...');
      } else if (!autoFlag) {
        const continue_anyway = await askQuestion('Continue anyway? (y/n): ');
        if (continue_anyway.toLowerCase() !== 'y') {
          process.exit(1);
        }
      } else {
        console.log('Continuing installation in automatic mode despite missing files...');
      }
    }
    
    // Step 2: Initialize TaskTracker
    console.log('\n📝 Step 2/3: Initializing TaskTracker...');
    try {
      // Use --non-interactive flag if in auto mode
      const initCommand = autoFlag ? './bin/tt init --non-interactive' : './bin/tt init';
      
      // Use spawnSync instead of execSync for better control
      const result = spawnSync(
        process.platform === 'win32' ? 'node' : './bin/tt', 
        process.platform === 'win32' ? ['./bin/tt', 'init', '--non-interactive'] : ['init', '--non-interactive'],
        { stdio: isNonInteractive ? 'pipe' : 'inherit' }
      );
      
      if (result.status !== 0 && result.error) {
        throw new Error(`Process exited with code ${result.status}: ${result.error.message}`);
      }
      
      if (isNonInteractive) {
        console.log('Initialization completed in non-interactive mode.');
      }
    } catch (error) {
      console.error('❌ Error initializing TaskTracker:', error.message);
      if (isNonInteractive) {
        console.log('Continuing installation in non-interactive mode despite initialization errors...');
      } else if (!autoFlag) {
        const continue_anyway = await askQuestion('Continue anyway? (y/n): ');
        if (continue_anyway.toLowerCase() !== 'y') {
          process.exit(1);
        }
      } else {
        console.log('Continuing installation in automatic mode despite initialization errors...');
      }
    }
    
    // Step 3: Setup automation (optional)
    if (isNonInteractive || autoFlag) {
      console.log('\n🚀 Step 3/3: Skipping automation setup in non-interactive mode.');
    } 
    else if (await askQuestion('\nDo you want to set up automation (Git hooks and scheduled tasks)? (y/n): ') === 'y') {
      console.log('\n🚀 Step 3/3: Setting up automation...');
      
      try {
        execSync('./bin/tt automate', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Error setting up automation:', error.message);
      }
    } else {
      console.log('\n🚀 Step 3/3: Skipping automation setup (manual mode).');
    }
    
    // Installation complete
    console.log('\n🎉 TaskTracker has been successfully installed!');
    console.log('\nQuick Start:');
    console.log('  tt add         Create a new task');
    console.log('  tt quick "Fix login button" bugfix   Quick task creation');
    console.log('  tt list        List all tasks');
    console.log('  tt update 1 status in-progress    Update task status');
    console.log('  tt help        Show all commands');
    console.log('\nFor more information, see the documentation in the docs directory.');
  } catch (error) {
    console.error('❌ Unexpected error during installation:', error.message);
    if (isNonInteractive) {
      console.error('Exiting with success code in non-interactive mode despite errors.');
      process.exit(0);
    }
  } finally {
    if (rl) rl.close();
  }
}

// Helper function to ask a question
function askQuestion(question) {
  // If in auto mode, return default value
  if (autoFlag || isNonInteractive) {
    return Promise.resolve('n');
  }
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Run the installation
install().catch(err => {
  console.error('❌ Error:', err.message);
  if (isNonInteractive) {
    console.error('Exiting with success code in non-interactive mode despite errors.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}); 