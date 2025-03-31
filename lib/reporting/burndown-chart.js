#!/usr/bin/env node

/**
 * TaskTracker Burndown Chart Generator
 * 
 * Generates burndown charts from TaskTracker snapshot data.
 * Can output to terminal (ASCII), HTML, or JSON formats.
 * 
 * Usage:
 *   node burndown-chart.js [options]
 * 
 * Options:
 *   --start=YYYY-MM-DD  Start date (default: 2 weeks ago)
 *   --end=YYYY-MM-DD    End date (default: today)
 *   --format=ascii|html|json  Output format (default: ascii)
 *   --output=filename   Output file (default: stdout)
 *   --ideal             Show ideal burndown line
 *   --filter=category   Filter by task category
 */

const fs = require('fs');
const path = require('path');

// Constants
const DATA_DIR = path.join(process.cwd(), '.tasktracker');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const STATS_DIR = path.join(DATA_DIR, 'stats');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    start: null,
    end: null,
    format: 'ascii',
    output: null,
    ideal: false,
    filter: null
  };

  args.forEach(arg => {
    if (arg.startsWith('--start=')) {
      options.start = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--end=')) {
      options.end = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg === '--ideal') {
      options.ideal = true;
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  });

  // Set default dates if not provided
  if (!options.end) {
    options.end = new Date();
  }
  
  if (!options.start) {
    // Default to 2 weeks ago
    options.start = new Date();
    options.start.setDate(options.start.getDate() - 14);
  }

  return options;
}

// Display help information
function showHelp() {
  console.log(`
TaskTracker Burndown Chart Generator

Generates burndown charts from TaskTracker snapshot data.
Can output to terminal (ASCII), HTML, or JSON formats.

Usage:
  node burndown-chart.js [options]

Options:
  --start=YYYY-MM-DD  Start date (default: 2 weeks ago)
  --end=YYYY-MM-DD    End date (default: today)
  --format=ascii|html|json  Output format (default: ascii)
  --output=filename   Output file (default: stdout)
  --ideal             Show ideal burndown line
  --filter=category   Filter by task category
  --help, -h          Show this help message
  `);
}

// Get snapshots between start and end dates
function getSnapshots(start, end) {
  try {
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
      console.error(`❌ Snapshots directory not found: ${SNAPSHOTS_DIR}`);
      process.exit(1);
    }

    // Load snapshot index
    const snapshots = JSON.parse(fs.readFileSync(SNAPSHOTS_DIR, 'utf8'));
    
    // Filter snapshots by date
    return snapshots.filter(snapshot => {
      const snapshotDate = new Date(snapshot.date);
      return snapshotDate >= start && snapshotDate <= end;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error(`❌ Error loading snapshots: ${error.message}`);
    process.exit(1);
  }
}

// Get individual snapshot files for more detailed data
function getSnapshotFiles(snapshots) {
  return snapshots.map(snapshot => {
    const dateStr = new Date(snapshot.date).toISOString().split('T')[0].replace(/-/g, '');
    const filename = `snapshot_${dateStr}.json`;
    const filePath = path.join(STATS_DIR, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        return {
          ...snapshot,
          details: JSON.parse(fs.readFileSync(filePath, 'utf8'))
        };
      }
      return snapshot;
    } catch (error) {
      console.warn(`⚠️ Warning: Could not read snapshot file: ${filePath}`);
      return snapshot;
    }
  });
}

// Extract burndown data from snapshots
function extractBurndownData(snapshots, filter) {
  const burndownData = snapshots.map(snapshot => {
    let remainingTasks = 0;
    let completedTasks = 0;
    
    // If we have detailed snapshot data
    if (snapshot.details) {
      const tasks = snapshot.details.tasks || [];
      
      // Apply category filter if specified
      const filteredTasks = filter 
        ? tasks.filter(task => task.category === filter)
        : tasks;
      
      // Count remaining and completed tasks
      remainingTasks = filteredTasks.filter(task => task.status !== 'done').length;
      completedTasks = filteredTasks.filter(task => task.status === 'done').length;
    } else {
      // Use summary data if details are not available
      const tasksByStatus = snapshot.tasksByStatus || {};
      
      // If we have filtered data for the category
      if (filter && snapshot.tasksByCategory && snapshot.tasksByCategory[filter]) {
        remainingTasks = snapshot.tasksByCategory[filter] - (snapshot.completedByCategory?.[filter] || 0);
        completedTasks = snapshot.completedByCategory?.[filter] || 0;
      } else {
        // Use total tasks
        remainingTasks = Object.values(tasksByStatus).reduce((sum, count) => sum + count, 0) - (tasksByStatus.done || 0);
        completedTasks = tasksByStatus.done || 0;
      }
    }
    
    return {
      date: new Date(snapshot.date),
      remaining: remainingTasks,
      completed: completedTasks,
      total: remainingTasks + completedTasks
    };
  });
  
  return burndownData;
}

// Calculate ideal burndown line
function calculateIdealBurndown(burndownData) {
  if (burndownData.length < 2) {
    return burndownData.map(data => ({ ...data, ideal: data.remaining }));
  }
  
  const startData = burndownData[0];
  const endData = burndownData[burndownData.length - 1];
  const startDate = startData.date.getTime();
  const endDate = endData.date.getTime();
  const totalDuration = endDate - startDate;
  const startRemaining = startData.total;
  
  return burndownData.map(data => {
    const elapsed = data.date.getTime() - startDate;
    const progress = elapsed / totalDuration;
    const ideal = Math.max(0, Math.round(startRemaining * (1 - progress)));
    
    return {
      ...data,
      ideal
    };
  });
}

// Generate ASCII burndown chart
function generateASCIIChart(burndownData, options) {
  const width = 60; // Chart width
  const height = 20; // Chart height
  
  // Find max remaining tasks to scale the chart
  const maxRemaining = Math.max(...burndownData.map(d => d.total));
  
  // Calculate scale factors
  const scaleY = (maxRemaining > 0) ? height / maxRemaining : 1;
  
  // Create empty chart grid
  const grid = Array(height).fill().map(() => Array(width).fill(' '));
  
  // Draw axes
  for (let y = 0; y < height; y++) {
    grid[y][0] = '│';
  }
  
  for (let x = 0; x < width; x++) {
    grid[height - 1][x] = '─';
  }
  
  grid[height - 1][0] = '└';
  
  // Draw Y-axis labels (task count)
  for (let i = 0; i <= 10; i++) {
    const y = height - 1 - Math.floor((i / 10) * height);
    const label = String(Math.round((i / 10) * maxRemaining));
    
    if (y >= 0 && y < height) {
      grid[y][0] = '├';
      
      for (let x = 0; x < label.length && x < 4; x++) {
        if (x + 1 < width) {
          grid[y][-(x - 4)] = label[label.length - 1 - x];
        }
      }
    }
  }
  
  // Draw X-axis labels (dates)
  if (burndownData.length > 1) {
    const step = Math.max(1, Math.floor(burndownData.length / 5));
    
    for (let i = 0; i < burndownData.length; i += step) {
      const x = Math.floor(((i) / (burndownData.length - 1)) * (width - 1)) + 1;
      const date = burndownData[i].date;
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      
      if (x < width) {
        grid[height - 1][x] = '┴';
        
        for (let j = 0; j < label.length && j + x < width; j++) {
          if (height + j < height + label.length) {
            grid[height][x + j] = label[j];
          }
        }
      }
    }
  }
  
  // Plot actual burndown line
  let prevX = null;
  let prevY = null;
  
  for (let i = 0; i < burndownData.length; i++) {
    const x = Math.floor((i / (burndownData.length - 1)) * (width - 1)) + 1;
    const y = height - 1 - Math.floor(burndownData[i].remaining * scaleY);
    
    if (y >= 0 && y < height && x < width) {
      grid[y][x] = 'o';
      
      // Draw connecting lines
      if (prevX !== null && prevY !== null) {
        drawLine(grid, prevX, prevY, x, y, '*');
      }
      
      prevX = x;
      prevY = y;
    }
  }
  
  // Plot ideal burndown line if requested
  if (options.ideal && burndownData.length > 1 && burndownData[0].ideal !== undefined) {
    prevX = null;
    prevY = null;
    
    for (let i = 0; i < burndownData.length; i++) {
      const x = Math.floor((i / (burndownData.length - 1)) * (width - 1)) + 1;
      const y = height - 1 - Math.floor(burndownData[i].ideal * scaleY);
      
      if (y >= 0 && y < height && x < width) {
        if (grid[y][x] === ' ') {
          grid[y][x] = '·';
        }
        
        // Draw connecting lines
        if (prevX !== null && prevY !== null) {
          drawLine(grid, prevX, prevY, x, y, '·');
        }
        
        prevX = x;
        prevY = y;
      }
    }
  }
  
  // Convert grid to string
  let chart = '';
  const title = options.filter ? `Burndown Chart (${options.filter})` : 'Burndown Chart';
  const titlePadding = Math.floor((width - title.length) / 2);
  
  chart += ' '.repeat(titlePadding) + title + '\n\n';
  
  for (let y = 0; y < height; y++) {
    chart += ' ' + grid[y].join('') + '\n';
  }
  
  chart += '\n';
  chart += ' '.repeat(5) + `From: ${options.start.toLocaleDateString()} To: ${options.end.toLocaleDateString()}\n`;
  chart += ' '.repeat(5) + `Starting Tasks: ${burndownData[0]?.total || 0}, Remaining: ${burndownData[burndownData.length - 1]?.remaining || 0}\n`;
  chart += ' '.repeat(5) + `Completed: ${burndownData[burndownData.length - 1]?.completed || 0}, `;
  
  // Calculate completion rate
  if (burndownData.length > 1) {
    const startDate = burndownData[0].date;
    const endDate = burndownData[burndownData.length - 1].date;
    const days = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    const completed = burndownData[burndownData.length - 1].completed - burndownData[0].completed;
    const rate = days > 0 ? (completed / days).toFixed(2) : 0;
    
    chart += `Velocity: ${rate} tasks/day\n`;
    
    // Add projection to completion
    const remaining = burndownData[burndownData.length - 1].remaining;
    const projectedDays = rate > 0 ? Math.ceil(remaining / rate) : '∞';
    const projectedDate = new Date(endDate);
    projectedDate.setDate(projectedDate.getDate() + projectedDays);
    
    chart += ' '.repeat(5) + `Projected Completion: ${projectedDays} days`;
    
    if (rate > 0) {
      chart += ` (${projectedDate.toLocaleDateString()})`;
    }
    
    chart += '\n';
  }
  
  chart += '\n Legend: o - Actual Remaining';
  
  if (options.ideal) {
    chart += ', · - Ideal Burndown';
  }
  
  return chart;
}

// Draw a line between two points using Bresenham's line algorithm
function drawLine(grid, x0, y0, x1, y1, char) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    // Only plot if position is empty
    if (grid[y0][x0] === ' ') {
      grid[y0][x0] = char;
    }
    
    if (x0 === x1 && y0 === y1) break;
    
    const e2 = 2 * err;
    
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// Generate HTML burndown chart
function generateHTMLChart(burndownData, options) {
  // Generate data points for Chart.js
  const labels = burndownData.map(d => d.date.toLocaleDateString());
  const remainingData = burndownData.map(d => d.remaining);
  const idealData = options.ideal ? burndownData.map(d => d.ideal) : null;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskTracker Burndown Chart</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f7f9fc;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }
    .chart-container {
      position: relative;
      height: 400px;
      margin: 20px 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 30px;
    }
    .stat-card {
      background-color: #f0f7ff;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .stat-value {
      font-size: 1.8em;
      font-weight: bold;
      color: #3498db;
      margin: 5px 0;
    }
    .stat-label {
      font-size: 0.9em;
      color: #7f8c8d;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 0.8em;
      color: #95a5a6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${options.filter ? `Burndown Chart: ${options.filter}` : 'Burndown Chart'}</h1>
    
    <div class="chart-container">
      <canvas id="burndownChart"></canvas>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Period</div>
        <div class="stat-value">${burndownData.length} days</div>
        <div class="stat-label">${options.start.toLocaleDateString()} - ${options.end.toLocaleDateString()}</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Starting Tasks</div>
        <div class="stat-value">${burndownData[0]?.total || 0}</div>
        <div class="stat-label">Total tasks at start</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Completed</div>
        <div class="stat-value">${burndownData[burndownData.length - 1]?.completed - burndownData[0]?.completed || 0}</div>
        <div class="stat-label">Tasks completed in period</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Velocity</div>
        <div class="stat-value">${calculateVelocity(burndownData)}</div>
        <div class="stat-label">Tasks/day</div>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Remaining Tasks</div>
        <div class="stat-value">${burndownData[burndownData.length - 1]?.remaining || 0}</div>
        <div class="stat-label">Tasks yet to complete</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Current Completion</div>
        <div class="stat-value">${calculateCompletionPercentage(burndownData)}%</div>
        <div class="stat-label">Of total tasks</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Estimated Completion</div>
        <div class="stat-value">${calculateCompletionDays(burndownData)}</div>
        <div class="stat-label">Days remaining</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Projected Date</div>
        <div class="stat-value">${calculateProjectedDate(burndownData)}</div>
        <div class="stat-label">Expected completion</div>
      </div>
    </div>
    
    <div class="footer">
      Generated by TaskTracker on ${new Date().toLocaleString()}
    </div>
  </div>
  
  <script>
    // Chart configuration
    const ctx = document.getElementById('burndownChart').getContext('2d');
    const burndownChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [
          {
            label: 'Remaining Tasks',
            data: ${JSON.stringify(remainingData)},
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderWidth: 3,
            tension: 0.1,
            fill: true
          }${options.ideal ? `,
          {
            label: 'Ideal Burndown',
            data: ${JSON.stringify(idealData)},
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0,
            fill: false
          }` : ''}
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Remaining Tasks'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'TaskTracker Burndown Chart'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    });
  </script>
</body>
</html>`;

  return html;
}

// Helper functions for chart generation
function calculateVelocity(burndownData) {
  if (burndownData.length < 2) return '0';
  
  const startDate = burndownData[0].date;
  const endDate = burndownData[burndownData.length - 1].date;
  const days = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
  const completed = burndownData[burndownData.length - 1].completed - burndownData[0].completed;
  
  return days > 0 ? (completed / days).toFixed(1) : '0';
}

function calculateCompletionPercentage(burndownData) {
  if (burndownData.length === 0) return '0';
  
  const latest = burndownData[burndownData.length - 1];
  return latest.total > 0 
    ? Math.round((latest.completed / latest.total) * 100) 
    : '0';
}

function calculateCompletionDays(burndownData) {
  if (burndownData.length < 2) return 'N/A';
  
  const velocity = parseFloat(calculateVelocity(burndownData));
  const remaining = burndownData[burndownData.length - 1].remaining;
  
  return velocity > 0 
    ? Math.ceil(remaining / velocity)
    : '∞';
}

function calculateProjectedDate(burndownData) {
  if (burndownData.length < 2) return 'N/A';
  
  const days = calculateCompletionDays(burndownData);
  
  if (days === '∞' || days === 'N/A') return 'Unknown';
  
  const endDate = burndownData[burndownData.length - 1].date;
  const projectedDate = new Date(endDate);
  projectedDate.setDate(projectedDate.getDate() + parseInt(days));
  
  return projectedDate.toLocaleDateString();
}

// Generate JSON burndown data
function generateJSONData(burndownData, options) {
  // Calculate additional metrics
  const velocity = calculateVelocity(burndownData);
  const completionPercentage = calculateCompletionPercentage(burndownData);
  const completionDays = calculateCompletionDays(burndownData);
  const projectedDate = calculateProjectedDate(burndownData);
  
  // Create summary data
  const summary = {
    period: {
      start: options.start.toISOString(),
      end: options.end.toISOString(),
      days: burndownData.length
    },
    metrics: {
      startingTasks: burndownData[0]?.total || 0,
      remainingTasks: burndownData[burndownData.length - 1]?.remaining || 0,
      completedInPeriod: (burndownData[burndownData.length - 1]?.completed || 0) - (burndownData[0]?.completed || 0),
      velocity: parseFloat(velocity),
      completionPercentage: parseInt(completionPercentage),
      estimatedRemainingDays: completionDays === '∞' || completionDays === 'N/A' ? null : parseInt(completionDays),
      projectedCompletionDate: projectedDate === 'Unknown' || projectedDate === 'N/A' ? null : new Date(projectedDate).toISOString()
    },
    filter: options.filter || null,
    data: burndownData.map(d => ({
      date: d.date.toISOString(),
      remaining: d.remaining,
      completed: d.completed,
      total: d.total,
      ideal: d.ideal
    }))
  };
  
  return JSON.stringify(summary, null, 2);
}

// Main function
function main() {
  // Parse command line arguments
  const options = parseArgs();
  
  // Get snapshots
  const snapshots = getSnapshots(options.start, options.end);
  
  if (snapshots.length === 0) {
    console.error(`❌ No snapshots found between ${options.start.toLocaleDateString()} and ${options.end.toLocaleDateString()}`);
    process.exit(1);
  }
  
  // Get detailed snapshot data
  const detailedSnapshots = getSnapshotFiles(snapshots);
  
  // Extract burndown data
  let burndownData = extractBurndownData(detailedSnapshots, options.filter);
  
  // Calculate ideal burndown if requested
  if (options.ideal) {
    burndownData = calculateIdealBurndown(burndownData);
  }
  
  // Generate chart based on format
  let output;
  
  switch (options.format.toLowerCase()) {
    case 'html':
      output = generateHTMLChart(burndownData, options);
      break;
    case 'json':
      output = generateJSONData(burndownData, options);
      break;
    case 'ascii':
    default:
      output = generateASCIIChart(burndownData, options);
      break;
  }
  
  // Output the chart
  if (options.output) {
    fs.writeFileSync(options.output, output);
    console.log(`✅ Burndown chart saved to ${options.output}`);
  } else {
    console.log(output);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getSnapshots,
  extractBurndownData,
  calculateIdealBurndown,
  generateASCIIChart,
  generateHTMLChart,
  generateJSONData
}; 