/**
 * HTML Report Template for TaskTracker
 * Separated for cleaner code organization
 */

/**
 * Generate HTML report from snapshot data
 * @param {Object} snapshot - Snapshot data
 * @param {Object} options - Additional options
 * @returns {string} HTML report
 */
function generateHtmlReport(snapshot, options = {}) {
  if (!snapshot) {
    return '<html><body><h1>No snapshot data available.</h1></body></html>';
  }
  
  const date = new Date(snapshot.timestamp).toLocaleString();
  
  // Create chart data for tasks by status
  const statusLabels = Object.keys(snapshot.taskStats.byStatus);
  const statusValues = Object.values(snapshot.taskStats.byStatus);
  
  // Create chart data for tasks by category
  const categoryLabels = Object.keys(snapshot.taskStats.byCategory);
  const categoryValues = Object.values(snapshot.taskStats.byCategory);
  
  // Create chart data for tasks by priority
  const priorityLabels = Object.keys(snapshot.taskStats.byPriority);
  const priorityValues = Object.values(snapshot.taskStats.byPriority);
  
  // Create chart data for files by extension
  const extensionLabels = Object.keys(snapshot.fileStats.byExtension);
  const extensionValues = extensionLabels.map(ext => snapshot.fileStats.byExtension[ext].count);
  
  // Report template
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskTracker Report - ${date}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }
    .card {
      margin-bottom: 30px;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 0 5px rgba(0,0,0,0.05);
      background-color: #fff;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .dashboard .card {
      margin-bottom: 0;
    }
    .stat-box {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      padding: 20px;
      border-radius: 5px;
      background-color: #f8f9fa;
    }
    .stat-title {
      font-size: 14px;
      font-weight: normal;
      margin-top: 5px;
      color: #6c757d;
    }
    .chart-container {
      position: relative;
      height: 300px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .progress-container {
      background-color: #e0e0e0;
      border-radius: 10px;
      height: 20px;
      margin-top: 10px;
    }
    .progress-bar {
      height: 100%;
      border-radius: 10px;
      background-color: #3498db;
      text-align: center;
      line-height: 20px;
      color: white;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>TaskTracker Statistics Report</h1>
    <p style="text-align: center; margin-bottom: 30px;">Generated on ${date}</p>
    
    <div class="dashboard">
      <div class="card">
        <div class="stat-box">
          ${snapshot.taskStats.total}
          <div class="stat-title">Total Tasks</div>
        </div>
      </div>
      <div class="card">
        <div class="stat-box">
          ${snapshot.taskStats.completionPercentage}%
          <div class="stat-title">Completion Rate</div>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${snapshot.taskStats.completionPercentage}%">
            ${snapshot.taskStats.completionPercentage}%
          </div>
        </div>
      </div>
      <div class="card">
        <div class="stat-box">
          ${snapshot.fileStats.totalFiles}
          <div class="stat-title">Total Files</div>
        </div>
      </div>
      <div class="card">
        <div class="stat-box">
          ${snapshot.fileStats.totalLines}
          <div class="stat-title">Total Lines</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>Task Status Distribution</h2>
      <div class="chart-container">
        <canvas id="statusChart"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h2>Task Categories</h2>
      <div class="chart-container">
        <canvas id="categoryChart"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h2>Task Priorities</h2>
      <div class="chart-container">
        <canvas id="priorityChart"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h2>File Types</h2>
      <div class="chart-container">
        <canvas id="fileTypesChart"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h2>Largest Files</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Size</th>
            <th>Lines</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.fileStats.largestFiles.slice(0, 10).map(file => `
            <tr>
              <td>${file.file}</td>
              <td>${options.formatBytes ? options.formatBytes(file.size) : file.size}</td>
              <td>${file.lines}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${snapshot.gitStats && snapshot.gitStats.isGitRepo ? `
    <div class="card">
      <h2>Git Statistics</h2>
      <table>
        <tr>
          <td><strong>Total Commits:</strong></td>
          <td>${snapshot.gitStats.stats.totalCommits || 'N/A'}</td>
        </tr>
        <tr>
          <td><strong>Branches:</strong></td>
          <td>${snapshot.gitStats.stats.branchCount || 'N/A'}</td>
        </tr>
        <tr>
          <td><strong>Contributors:</strong></td>
          <td>${snapshot.gitStats.stats.contributorCount || 'N/A'}</td>
        </tr>
        <tr>
          <td><strong>Current Branch:</strong></td>
          <td>${snapshot.gitStats.stats.currentBranch || 'N/A'}</td>
        </tr>
        <tr>
          <td><strong>Latest Commit:</strong></td>
          <td>${snapshot.gitStats.stats.latestCommit || 'N/A'}</td>
        </tr>
        <tr>
          <td><strong>Merged PRs:</strong></td>
          <td>${snapshot.gitStats.stats.mergeCount || 'N/A'}</td>
        </tr>
      </table>
    </div>
    ` : ''}
    
    <div class="footer">
      Generated by TaskTracker v${snapshot.version || '1.0.0'} | ${new Date().toISOString()}
    </div>
  </div>
  
  <script>
    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(statusLabels)},
        datasets: [{
          data: ${JSON.stringify(statusValues)},
          backgroundColor: [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#2c3e50'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
    
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(categoryLabels)},
        datasets: [{
          label: 'Tasks by Category',
          data: ${JSON.stringify(categoryValues)},
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // Priority Chart
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    new Chart(priorityCtx, {
      type: 'horizontalBar',
      data: {
        labels: ${JSON.stringify(priorityLabels)},
        datasets: [{
          label: 'Tasks by Priority',
          data: ${JSON.stringify(priorityValues)},
          backgroundColor: '#2ecc71'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
    
    // File Types Chart
    const fileTypesCtx = document.getElementById('fileTypesChart').getContext('2d');
    new Chart(fileTypesCtx, {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(extensionLabels)},
        datasets: [{
          data: ${JSON.stringify(extensionValues)},
          backgroundColor: [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#2c3e50',
            '#e67e22', '#16a085', '#c0392b', '#8e44ad', '#27ae60'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  </script>
</body>
</html>
`;
}

module.exports = {
  generateHtmlReport
}; 