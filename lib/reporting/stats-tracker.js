#!/usr/bin/env node

/**
 * TaskTracker Statistics Tracker
 * 
 * This script tracks, analyzes, and visualizes statistics for your project.
 * It works with the TaskTracker system to provide insights into your development process.
 * 
 * Usage:
 *   node stats-tracker.js [command] [options]
 * 
 * Commands:
 *   snapshot        Take a snapshot of the current project state
 *   report [type]   Generate a report (types: text, html, json)
 *   compare [days]  Compare current state with a previous snapshot
 *   trends          Show task completion trends over time
 *   help            Display help information
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

// Configuration
const CONFIG = {
  statsDir: '.tasktracker/stats',
  tasksFile: '.tasktracker/tasks.json',
  configFile: '.tasktracker/config.json',
  snapshotsFile: '.tasktracker/snapshots.json',
  reportsDir: '.tasktracker/reports',
  templateDir: '.tasktracker/templates',
  fileMetricsFile: '.tasktracker/file_metrics.json',
  nonInteractiveMode: false
};

// Check if we are in non-interactive mode
if (process.argv.includes('--non-interactive') || process.argv.includes('-n')) {
  CONFIG.nonInteractiveMode = true;
}

// Ensure directories exist
function initializeDirectories() {
  const directories = [
    CONFIG.statsDir,
    CONFIG.reportsDir,
    CONFIG.templateDir
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Load configuration
function loadConfig() {
  if (!fs.existsSync(CONFIG.configFile)) {
    console.error('❌ TaskTracker configuration not found!');
    console.log('Please run "node tasktracker.js init" first.');
    process.exit(1);
  }
  
  try {
    return JSON.parse(fs.readFileSync(CONFIG.configFile, 'utf8'));
  } catch (error) {
    console.error('❌ Error loading configuration:', error.message);
    process.exit(1);
  }
}

// Load tasks
function loadTasks() {
  if (!fs.existsSync(CONFIG.tasksFile)) {
    console.error('❌ Tasks file not found!');
    console.log('Please run "node tasktracker.js init" first.');
    process.exit(1);
  }
  
  try {
    return JSON.parse(fs.readFileSync(CONFIG.tasksFile, 'utf8'));
  } catch (error) {
    console.error('❌ Error loading tasks:', error.message);
    process.exit(1);
  }
}

// Get Git statistics
async function getGitStats() {
  return new Promise((resolve) => {
    // Check if git is available
    exec('git rev-parse --is-inside-work-tree', (error) => {
      if (error) {
        resolve({
          isGitRepo: false,
          stats: {}
        });
        return;
      }
      
      const stats = {};
      
      // Get commit count
      exec('git rev-list --count HEAD', (err, stdout) => {
        if (!err) {
          stats.totalCommits = parseInt(stdout.trim(), 10);
        }
        
        // Get branch count
        exec('git branch --all | wc -l', (err, stdout) => {
          if (!err) {
            stats.branchCount = parseInt(stdout.trim(), 10);
          }
          
          // Get contributor count
          exec('git shortlog -sn --no-merges | wc -l', (err, stdout) => {
            if (!err) {
              stats.contributorCount = parseInt(stdout.trim(), 10);
            }
            
            // Get latest commit
            exec('git log -1 --format=%cd --date=iso', (err, stdout) => {
              if (!err) {
                stats.latestCommit = stdout.trim();
              }
              
              // Get current branch
              exec('git branch --show-current', (err, stdout) => {
                if (!err) {
                  stats.currentBranch = stdout.trim();
                }
                
                // Get merge and pull request counts if we have access to them
                exec('git log --merges | grep -c "Merge"', (err, stdout) => {
                  if (!err) {
                    stats.mergeCount = parseInt(stdout.trim(), 10);
                  }
                  
                  resolve({
                    isGitRepo: true,
                    stats: stats
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Get file statistics
async function getFileStats() {
  return new Promise((resolve) => {
    const stats = {
      totalFiles: 0,
      totalLines: 0,
      byExtension: {},
      largestFiles: []
    };
    
    // Find all files in the project directory (excluding .git, node_modules, etc.)
    exec('find . -type f -not -path "*/\\.*" -not -path "*/node_modules/*" -not -path "*/dist/*" | sort', (err, stdout) => {
      if (err) {
        resolve(stats);
        return;
      }
      
      const files = stdout.trim().split('\n').filter(Boolean);
      stats.totalFiles = files.length;
      
      // Track file sizes and extensions
      const filePromises = files.map(file => {
        return new Promise((resolve) => {
          fs.stat(file, (err, stat) => {
            if (err) {
              resolve(null);
              return;
            }
            
            const ext = path.extname(file).toLowerCase() || 'no-extension';
            
            if (!stats.byExtension[ext]) {
              stats.byExtension[ext] = {
                count: 0,
                lines: 0,
                size: 0
              };
            }
            
            stats.byExtension[ext].count++;
            stats.byExtension[ext].size += stat.size;
            
            // Count lines for text files
            const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.java', '.c', '.cpp', '.h', '.php', '.html', '.css', '.scss', '.md', '.txt', '.json', '.yml', '.yaml', '.sh'];
            
            if (textExtensions.includes(ext)) {
              try {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n').length;
                stats.byExtension[ext].lines += lines;
                stats.totalLines += lines;
                
                // Track large files
                stats.largestFiles.push({
                  file: file,
                  size: stat.size,
                  lines: lines
                });
              } catch (e) {
                // Skip file if we can't read it
              }
            }
            
            resolve(null);
          });
        });
      });
      
      Promise.all(filePromises).then(() => {
        // Sort largest files
        stats.largestFiles.sort((a, b) => b.size - a.size);
        stats.largestFiles = stats.largestFiles.slice(0, 10);
        
        resolve(stats);
      });
    });
  });
}

// Take a snapshot of the current project state
async function takeSnapshot() {
  console.log('📸 Taking a project snapshot...');
  
  initializeDirectories();
  const config = loadConfig();
  const taskData = loadTasks();
  const gitData = await getGitStats();
  const fileData = await getFileStats();
  
  // Generate snapshot data
  const snapshot = {
    timestamp: new Date().toISOString(),
    version: config.currentVersion,
    taskStats: {
      total: taskData.tasks.length,
      byStatus: {},
      byCategory: {}
    },
    gitStats: gitData.stats,
    fileStats: fileData
  };
  
  // Calculate task stats
  config.taskStatuses.forEach(status => {
    snapshot.taskStats.byStatus[status] = taskData.tasks.filter(t => t.status === status).length;
  });
  
  config.taskCategories.forEach(category => {
    snapshot.taskStats.byCategory[category] = taskData.tasks.filter(t => t.category === category).length;
  });
  
  // Calculate completion percentage
  const completedTasks = snapshot.taskStats.byStatus.done || 0;
  snapshot.taskStats.completionPercentage = taskData.tasks.length > 0 
    ? (completedTasks / taskData.tasks.length * 100).toFixed(1)
    : 0;
  
  // Save the snapshot
  const snapshotsPath = CONFIG.snapshotsFile;
  let snapshots = [];
  
  if (fs.existsSync(snapshotsPath)) {
    try {
      snapshots = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Error loading snapshots file, creating new one');
    }
  }
  
  // Add the new snapshot
  snapshots.push(snapshot);
  
  // Keep only the last 90 days of snapshots
  if (snapshots.length > 90) {
    snapshots = snapshots.slice(snapshots.length - 90);
  }
  
  // Save snapshots file
  fs.writeFileSync(snapshotsPath, JSON.stringify(snapshots, null, 2));
  
  // Save a dated snapshot file for long-term storage
  const dateStr = new Date().toISOString().split('T')[0];
  fs.writeFileSync(
    `${CONFIG.statsDir}/snapshot-${dateStr}.json`,
    JSON.stringify(snapshot, null, 2)
  );
  
  console.log('✅ Snapshot saved successfully');
  
  return snapshot;
}

// Track file metrics over time
async function updateFileMetrics() {
  const taskData = loadTasks();
  let metrics = {};
  
  // Load existing metrics if available
  if (fs.existsSync(CONFIG.fileMetricsFile)) {
    try {
      metrics = JSON.parse(fs.readFileSync(CONFIG.fileMetricsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Error loading file metrics, creating new one');
    }
  }
  
  // Get frequency of files in tasks
  const fileFrequency = {};
  taskData.tasks.forEach(task => {
    task.relatedFiles.forEach(file => {
      if (!fileFrequency[file]) {
        fileFrequency[file] = {
          mentions: 0,
          taskIds: [],
          lastUpdated: null
        };
      }
      
      fileFrequency[file].mentions++;
      
      if (!fileFrequency[file].taskIds.includes(task.id)) {
        fileFrequency[file].taskIds.push(task.id);
      }
      
      // Track the most recent update
      const taskDate = new Date(task.lastUpdated);
      if (!fileFrequency[file].lastUpdated || 
          taskDate > new Date(fileFrequency[file].lastUpdated)) {
        fileFrequency[file].lastUpdated = task.lastUpdated;
      }
    });
  });
  
  // Merge with existing metrics
  Object.keys(fileFrequency).forEach(file => {
    if (!metrics[file]) {
      metrics[file] = {
        firstSeen: new Date().toISOString(),
        mentions: 0,
        taskCount: 0,
        history: []
      };
    }
    
    // Record a history point
    metrics[file].history.push({
      date: new Date().toISOString(),
      mentions: fileFrequency[file].mentions,
      taskCount: fileFrequency[file].taskIds.length
    });
    
    // Keep history at a reasonable size
    if (metrics[file].history.length > 30) {
      metrics[file].history = metrics[file].history.slice(metrics[file].history.length - 30);
    }
    
    // Update current stats
    metrics[file].mentions = fileFrequency[file].mentions;
    metrics[file].taskCount = fileFrequency[file].taskIds.length;
    metrics[file].lastUpdated = fileFrequency[file].lastUpdated;
  });
  
  // Save metrics
  fs.writeFileSync(CONFIG.fileMetricsFile, JSON.stringify(metrics, null, 2));
  
  return metrics;
}

// Generate a text report
function generateTextReport(snapshot) {
  const config = loadConfig();
  
  let report = `# TaskTracker Project Report\n\n`;
  report += `## Project: ${config.projectName}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Version: ${snapshot.version}\n\n`;
  
  report += `## Task Summary\n\n`;
  report += `Total Tasks: ${snapshot.taskStats.total}\n`;
  report += `Completion: ${snapshot.taskStats.completionPercentage}%\n\n`;
  
  report += `## Task Status\n\n`;
  Object.entries(snapshot.taskStats.byStatus).forEach(([status, count]) => {
    const percentage = snapshot.taskStats.total > 0 
      ? ((count / snapshot.taskStats.total) * 100).toFixed(1) 
      : 0;
    report += `- ${status}: ${count} (${percentage}%)\n`;
  });
  report += '\n';
  
  report += `## Task Categories\n\n`;
  Object.entries(snapshot.taskStats.byCategory).forEach(([category, count]) => {
    const percentage = snapshot.taskStats.total > 0 
      ? ((count / snapshot.taskStats.total) * 100).toFixed(1) 
      : 0;
    report += `- ${category}: ${count} (${percentage}%)\n`;
  });
  report += '\n';
  
  // Git stats if available
  if (snapshot.gitStats && Object.keys(snapshot.gitStats).length > 0) {
    report += `## Git Statistics\n\n`;
    if (snapshot.gitStats.totalCommits) report += `Total Commits: ${snapshot.gitStats.totalCommits}\n`;
    if (snapshot.gitStats.branchCount) report += `Branch Count: ${snapshot.gitStats.branchCount}\n`;
    if (snapshot.gitStats.contributorCount) report += `Contributors: ${snapshot.gitStats.contributorCount}\n`;
    if (snapshot.gitStats.mergeCount) report += `Merges: ${snapshot.gitStats.mergeCount}\n`;
    if (snapshot.gitStats.currentBranch) report += `Current Branch: ${snapshot.gitStats.currentBranch}\n`;
    if (snapshot.gitStats.latestCommit) report += `Latest Commit: ${snapshot.gitStats.latestCommit}\n`;
    report += '\n';
  }
  
  // File stats if available
  if (snapshot.fileStats) {
    report += `## File Statistics\n\n`;
    report += `Total Files: ${snapshot.fileStats.totalFiles}\n`;
    report += `Total Lines of Code: ${snapshot.fileStats.totalLines.toLocaleString()}\n\n`;
    
    report += `### Files by Type\n\n`;
    Object.entries(snapshot.fileStats.byExtension)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .forEach(([ext, stats]) => {
        report += `- ${ext}: ${stats.count} files, ${stats.lines.toLocaleString()} lines\n`;
      });
    report += '\n';
    
    report += `### Largest Files\n\n`;
    snapshot.fileStats.largestFiles.slice(0, 5).forEach(file => {
      const sizeKB = (file.size / 1024).toFixed(1);
      report += `- ${file.file}: ${sizeKB} KB, ${file.lines} lines\n`;
    });
    report += '\n';
  }
  
  return report;
}

// Generate an HTML report
function generateHtmlReport(snapshot) {
  const config = loadConfig();
  
  // Create a basic HTML template
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.projectName} - TaskTracker Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .header {
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .card {
      border: 1px solid #eee;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .progress-container {
      width: 100%;
      height: 20px;
      background-color: #f5f5f5;
      border-radius: 10px;
      margin: 10px 0;
    }
    .progress-bar {
      height: 20px;
      background-color: #4CAF50;
      border-radius: 10px;
      text-align: center;
      color: white;
      line-height: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
    }
    .stat-item {
      background-color: #f9f9f9;
      border-radius: 5px;
      padding: 15px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
      margin: 5px 0;
    }
    .stat-label {
      font-size: 14px;
      color: #7f8c8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    table, th, td {
      border: 1px solid #eee;
    }
    th, td {
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    .chart-container {
      height: 200px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.projectName} - Project Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Version: ${snapshot.version}</p>
  </div>
  
  <div class="card">
    <h2>Project Progress</h2>
    <p>Overall Completion: ${snapshot.taskStats.completionPercentage}%</p>
    <div class="progress-container">
      <div class="progress-bar" style="width: ${snapshot.taskStats.completionPercentage}%">${snapshot.taskStats.completionPercentage}%</div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">Total Tasks</div>
        <div class="stat-value">${snapshot.taskStats.total}</div>
      </div>`;
  
  // Add task stats by status
  Object.entries(snapshot.taskStats.byStatus).forEach(([status, count]) => {
    html += `
      <div class="stat-item">
        <div class="stat-label">${status}</div>
        <div class="stat-value">${count}</div>
      </div>`;
  });
  
  html += `
    </div>
  </div>
  
  <div class="card">
    <h2>Task Categories</h2>
    <table>
      <tr>
        <th>Category</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>`;
  
  // Add task categories
  Object.entries(snapshot.taskStats.byCategory).forEach(([category, count]) => {
    const percentage = snapshot.taskStats.total > 0 
      ? ((count / snapshot.taskStats.total) * 100).toFixed(1) 
      : 0;
    html += `
      <tr>
        <td>${category}</td>
        <td>${count}</td>
        <td>${percentage}%</td>
      </tr>`;
  });
  
  html += `
    </table>
  </div>`;
  
  // Add Git stats if available
  if (snapshot.gitStats && Object.keys(snapshot.gitStats).length > 0) {
    html += `
  <div class="card">
    <h2>Git Statistics</h2>
    <div class="stats-grid">`;
    
    if (snapshot.gitStats.totalCommits) {
      html += `
      <div class="stat-item">
        <div class="stat-label">Total Commits</div>
        <div class="stat-value">${snapshot.gitStats.totalCommits}</div>
      </div>`;
    }
    
    if (snapshot.gitStats.branchCount) {
      html += `
      <div class="stat-item">
        <div class="stat-label">Branches</div>
        <div class="stat-value">${snapshot.gitStats.branchCount}</div>
      </div>`;
    }
    
    if (snapshot.gitStats.contributorCount) {
      html += `
      <div class="stat-item">
        <div class="stat-label">Contributors</div>
        <div class="stat-value">${snapshot.gitStats.contributorCount}</div>
      </div>`;
    }
    
    if (snapshot.gitStats.mergeCount) {
      html += `
      <div class="stat-item">
        <div class="stat-label">Merges</div>
        <div class="stat-value">${snapshot.gitStats.mergeCount}</div>
      </div>`;
    }
    
    html += `
    </div>
    
    <p><strong>Current Branch:</strong> ${snapshot.gitStats.currentBranch || 'N/A'}</p>
    <p><strong>Latest Commit:</strong> ${snapshot.gitStats.latestCommit || 'N/A'}</p>
  </div>`;
  }
  
  // Add file stats if available
  if (snapshot.fileStats) {
    html += `
  <div class="card">
    <h2>File Statistics</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">Total Files</div>
        <div class="stat-value">${snapshot.fileStats.totalFiles}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Lines of Code</div>
        <div class="stat-value">${snapshot.fileStats.totalLines.toLocaleString()}</div>
      </div>
    </div>
    
    <h3>Files by Type</h3>
    <table>
      <tr>
        <th>Extension</th>
        <th>Files</th>
        <th>Lines</th>
      </tr>`;
    
    Object.entries(snapshot.fileStats.byExtension)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .forEach(([ext, stats]) => {
        html += `
      <tr>
        <td>${ext}</td>
        <td>${stats.count}</td>
        <td>${stats.lines.toLocaleString()}</td>
      </tr>`;
      });
    
    html += `
    </table>
    
    <h3>Largest Files</h3>
    <table>
      <tr>
        <th>File</th>
        <th>Size (KB)</th>
        <th>Lines</th>
      </tr>`;
    
    snapshot.fileStats.largestFiles.slice(0, 5).forEach(file => {
      const sizeKB = (file.size / 1024).toFixed(1);
      html += `
      <tr>
        <td>${file.file}</td>
        <td>${sizeKB}</td>
        <td>${file.lines}</td>
      </tr>`;
    });
    
    html += `
    </table>
  </div>`;
  }
  
  // Footer
  html += `
  <div class="footer">
    <p>Generated by TaskTracker Statistics Tracker</p>
  </div>
</body>
</html>`;
  
  return html;
}

// Generate a JSON report
function generateJsonReport(snapshot) {
  return JSON.stringify(snapshot, null, 2);
}

// Generate a report based on the most recent snapshot
async function generateReport(type = 'text') {
  console.log(`📊 Generating ${type} report...`);
  
  initializeDirectories();
  
  // Load the most recent snapshot
  const snapshotsPath = CONFIG.snapshotsFile;
  let snapshots = [];
  
  if (fs.existsSync(snapshotsPath)) {
    try {
      snapshots = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading snapshots:', error.message);
      return;
    }
  }
  
  if (snapshots.length === 0) {
    console.log('📸 No snapshots found. Taking a new snapshot...');
    const snapshot = await takeSnapshot();
    snapshots.push(snapshot);
  }
  
  const latestSnapshot = snapshots[snapshots.length - 1];
  let report;
  let extension;
  
  // Generate the appropriate report type
  switch (type.toLowerCase()) {
    case 'html':
      report = generateHtmlReport(latestSnapshot);
      extension = 'html';
      break;
    case 'json':
      report = generateJsonReport(latestSnapshot);
      extension = 'json';
      break;
    case 'text':
    default:
      report = generateTextReport(latestSnapshot);
      extension = 'md';
      break;
  }
  
  // Save the report
  const dateStr = new Date().toISOString().split('T')[0];
  const reportPath = `${CONFIG.reportsDir}/report-${dateStr}.${extension}`;
  fs.writeFileSync(reportPath, report);
  
  // Also save as latest report
  fs.writeFileSync(`${CONFIG.reportsDir}/latest-report.${extension}`, report);
  
  console.log(`✅ Report saved to ${reportPath}`);
  
  return reportPath;
}

// Compare current state with a previous snapshot
async function compareSnapshots(days = 7) {
  console.log(`🔍 Comparing current state with snapshot from ${days} days ago...`);
  
  initializeDirectories();
  
  // Load snapshots
  const snapshotsPath = CONFIG.snapshotsFile;
  let snapshots = [];
  
  if (fs.existsSync(snapshotsPath)) {
    try {
      snapshots = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading snapshots:', error.message);
      return;
    }
  }
  
  if (snapshots.length < 2) {
    console.log('❌ Not enough snapshots for comparison. Need at least 2 snapshots.');
    return;
  }
  
  // Get current snapshot
  const currentSnapshot = snapshots[snapshots.length - 1];
  
  // Find snapshot from X days ago
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);
  
  let closestSnapshot = null;
  let closestDiff = Infinity;
  
  snapshots.forEach(snapshot => {
    const snapshotDate = new Date(snapshot.timestamp);
    const diff = Math.abs(snapshotDate.getTime() - targetDate.getTime());
    
    if (diff < closestDiff) {
      closestDiff = diff;
      closestSnapshot = snapshot;
    }
  });
  
  if (!closestSnapshot) {
    console.log(`❌ No snapshot found close to ${days} days ago.`);
    return;
  }
  
  // Generate comparison
  const comparison = {
    currentDate: new Date().toISOString(),
    previousDate: closestSnapshot.timestamp,
    daysBetween: Math.round(closestDiff / (1000 * 60 * 60 * 24)),
    tasks: {
      current: currentSnapshot.taskStats.total,
      previous: closestSnapshot.taskStats.total,
      change: currentSnapshot.taskStats.total - closestSnapshot.taskStats.total
    },
    completion: {
      current: parseFloat(currentSnapshot.taskStats.completionPercentage),
      previous: parseFloat(closestSnapshot.taskStats.completionPercentage),
      change: parseFloat(currentSnapshot.taskStats.completionPercentage) - 
              parseFloat(closestSnapshot.taskStats.completionPercentage)
    },
    status: {},
    category: {}
  };
  
  // Compare statuses
  Object.keys({...currentSnapshot.taskStats.byStatus, ...closestSnapshot.taskStats.byStatus})
    .forEach(status => {
      const current = currentSnapshot.taskStats.byStatus[status] || 0;
      const previous = closestSnapshot.taskStats.byStatus[status] || 0;
      
      comparison.status[status] = {
        current,
        previous,
        change: current - previous
      };
    });
  
  // Compare categories
  Object.keys({...currentSnapshot.taskStats.byCategory, ...closestSnapshot.taskStats.byCategory})
    .forEach(category => {
      const current = currentSnapshot.taskStats.byCategory[category] || 0;
      const previous = closestSnapshot.taskStats.byCategory[category] || 0;
      
      comparison.category[category] = {
        current,
        previous,
        change: current - previous
      };
    });
  
  // Display comparison
  console.log('\n📊 Comparison Report:');
  console.log('================================================================================');
  console.log(`Comparing current state with snapshot from ${comparison.daysBetween} days ago`);
  console.log(`Current: ${new Date(comparison.currentDate).toLocaleString()}`);
  console.log(`Previous: ${new Date(comparison.previousDate).toLocaleString()}`);
  console.log();
  
  console.log(`Tasks: ${comparison.tasks.current} (${comparison.tasks.change >= 0 ? '+' : ''}${comparison.tasks.change} since previous)`);
  console.log(`Completion: ${comparison.completion.current}% (${comparison.completion.change >= 0 ? '+' : ''}${comparison.completion.change.toFixed(1)}% since previous)`);
  console.log();
  
  console.log('Status Changes:');
  Object.entries(comparison.status)
    .sort((a, b) => Math.abs(b[1].change) - Math.abs(a[1].change))
    .forEach(([status, data]) => {
      console.log(`- ${status}: ${data.current} (${data.change >= 0 ? '+' : ''}${data.change})`);
    });
  console.log();
  
  console.log('Category Changes:');
  Object.entries(comparison.category)
    .sort((a, b) => Math.abs(b[1].change) - Math.abs(a[1].change))
    .forEach(([category, data]) => {
      console.log(`- ${category}: ${data.current} (${data.change >= 0 ? '+' : ''}${data.change})`);
    });
  console.log('================================================================================');
  
  return comparison;
}

// Show task completion trends over time
async function showTrends() {
  console.log('📈 Analyzing task completion trends...');
  
  // Load snapshots
  const snapshotsPath = CONFIG.snapshotsFile;
  let snapshots = [];
  
  if (fs.existsSync(snapshotsPath)) {
    try {
      snapshots = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading snapshots:', error.message);
      return;
    }
  }
  
  if (snapshots.length < 2) {
    console.log('❌ Not enough snapshots for trend analysis. Need at least 2 snapshots.');
    return;
  }
  
  // Calculate task completion rate
  const trends = {
    dates: [],
    completionRates: [],
    taskCounts: [],
    velocities: []
  };
  
  // Process snapshots chronologically
  snapshots.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let previousSnapshot = null;
  snapshots.forEach(snapshot => {
    const date = new Date(snapshot.timestamp).toLocaleDateString();
    
    // Calculate completion rate
    const completionRate = parseFloat(snapshot.taskStats.completionPercentage);
    
    // Calculate task count
    const taskCount = snapshot.taskStats.total;
    
    // Calculate velocity (tasks completed since last snapshot)
    let velocity = 0;
    if (previousSnapshot) {
      const currentDone = snapshot.taskStats.byStatus.done || 0;
      const prevDone = previousSnapshot.taskStats.byStatus.done || 0;
      
      // Calculate days between snapshots
      const currentDate = new Date(snapshot.timestamp);
      const prevDate = new Date(previousSnapshot.timestamp);
      const daysDiff = Math.max(1, Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24)));
      
      velocity = (currentDone - prevDone) / daysDiff;
    }
    
    trends.dates.push(date);
    trends.completionRates.push(completionRate);
    trends.taskCounts.push(taskCount);
    trends.velocities.push(velocity);
    
    previousSnapshot = snapshot;
  });
  
  // Display trends
  console.log('\n📊 Task Completion Trends:');
  console.log('================================================================================');
  
  // Calculate overall velocity (tasks/day)
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];
  
  const firstDate = new Date(firstSnapshot.timestamp);
  const lastDate = new Date(lastSnapshot.timestamp);
  const daysDiff = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
  
  const firstDone = firstSnapshot.taskStats.byStatus.done || 0;
  const lastDone = lastSnapshot.taskStats.byStatus.done || 0;
  
  const overallVelocity = (lastDone - firstDone) / daysDiff;
  
  console.log(`Overall Task Velocity: ${overallVelocity.toFixed(2)} tasks/day`);
  console.log(`Analysis Period: ${daysDiff} days (from ${firstDate.toLocaleDateString()} to ${lastDate.toLocaleDateString()})`);
  console.log();
  
  // Projected completion
  const remainingTasks = lastSnapshot.taskStats.total - lastDone;
  const projectedDays = overallVelocity > 0 ? Math.ceil(remainingTasks / overallVelocity) : 'Unknown';
  
  if (typeof projectedDays === 'number') {
    const projectedDate = new Date(lastDate);
    projectedDate.setDate(projectedDate.getDate() + projectedDays);
    
    console.log(`Projected Completion: ${projectedDays} days (around ${projectedDate.toLocaleDateString()})`);
  } else {
    console.log(`Projected Completion: ${projectedDays}`);
  }
  console.log();
  
  // Display ASCII chart of completion percentage
  console.log('Completion Rate Over Time:');
  console.log('    0%  25%  50%  75% 100%');
  console.log('    |    |    |    |    |');
  
  // Limit display to last 10 entries
  const displayLimit = Math.min(10, trends.dates.length);
  const startIndex = Math.max(0, trends.dates.length - displayLimit);
  
  for (let i = startIndex; i < trends.dates.length; i++) {
    const date = trends.dates[i];
    const completion = trends.completionRates[i];
    
    // Create ASCII bar
    const barLength = Math.round(completion / 100 * 20);
    const bar = '#'.repeat(barLength) + ' '.repeat(20 - barLength);
    
    console.log(`${date.padStart(10)}: [${bar}] ${completion}%`);
  }
  
  console.log('================================================================================');
  
  return trends;
}

// Create a command-line interface
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Display help information
function showHelp() {
  console.log(`
TaskTracker Statistics Tracker

Usage:
  node stats-tracker.js [command] [options]

Commands:
  snapshot                Take a snapshot of the current project state
  report [type]           Generate a report (types: text, html, json)
  compare [days]          Compare current state with a previous snapshot
  trends                  Show task completion trends over time
  help                    Display this help information

Options:
  --non-interactive, -n   Run in non-interactive mode

Examples:
  node stats-tracker.js snapshot
  node stats-tracker.js report html
  node stats-tracker.js compare 7
  node stats-tracker.js trends
  node stats-tracker.js -n snapshot
`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Filter out option flags
  const command = args.filter(arg => !arg.startsWith('-'))[0];
  
  // Extract other arguments (filtering out options)
  const cmdArgs = args.filter(arg => !arg.startsWith('-')).slice(1);
  
  switch (command) {
    case 'snapshot':
      await takeSnapshot();
      await updateFileMetrics();
      break;
      
    case 'report':
      const reportType = cmdArgs[0] || 'text';
      await generateReport(reportType);
      break;
      
    case 'compare':
      const days = parseInt(cmdArgs[0], 10) || 7;
      await compareSnapshots(days);
      break;
      
    case 'trends':
      await showTrends();
      break;
      
    case undefined:
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the program
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

// Export functions for direct use in other scripts
module.exports = {
  takeSnapshot,
  generateReport,
  compareSnapshots,
  showTrends
};
