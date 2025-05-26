/**
 * TaskTracker - Initialize Templates
 * 
 * Script to initialize default templates for the reporting system.
 */

const fs = require('fs');
const path = require('path');

// Base template directory
const TEMPLATE_DIR = path.join(__dirname, 'templates');

// Default templates content (simplified versions)
const DEFAULT_TEMPLATES = {
  'text-report.template.txt': `=======================================================
TaskTracker Statistics Report - {{formatDate timestamp}}
=======================================================

TASK STATISTICS
-------------------------------------------------------
Total Tasks: {{taskStats.total}}
Completion: {{taskStats.completionPercentage}}%

Tasks by Status:
{{#each taskStats.byStatus}}
  - {{@key}}: {{this}}
{{/each}}

GIT STATISTICS
-------------------------------------------------------
{{#if gitStats.isGitRepo}}
Total Commits: {{gitStats.stats.totalCommits}}
{{else}}
Not a Git repository
{{/if}}

FILE STATISTICS
-------------------------------------------------------
Total Files: {{fileStats.totalFiles}}
Total Lines: {{fileStats.totalLines}}`,

  'html-report.template.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskTracker Statistics Report</title>
  <style>
    body { font-family: sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .container { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>TaskTracker Statistics Report</h1>
  <p>Generated on {{formatDate timestamp}}</p>
  
  <div class="container">
    <h2>Task Statistics</h2>
    <p>Total Tasks: {{taskStats.total}}</p>
    <p>Completion: {{taskStats.completionPercentage}}%</p>
  </div>
  
  <div class="container">
    <h2>Git Statistics</h2>
    {{#if gitStats.isGitRepo}}
    <p>Total Commits: {{gitStats.stats.totalCommits}}</p>
    {{else}}
    <p>Not a Git repository</p>
    {{/if}}
  </div>
  
  <div class="container">
    <h2>File Statistics</h2>
    <p>Total Files: {{fileStats.totalFiles}}</p>
    <p>Total Lines: {{formatNumber fileStats.totalLines}}</p>
  </div>
</body>
</html>`
};

/**
 * Initialize default templates
 */
async function initializeTemplates() {
  try {
    console.log('Initializing TaskTracker report templates...');
    
    // Ensure template directory exists
    if (!fs.existsSync(TEMPLATE_DIR)) {
      console.log(`Creating template directory: ${TEMPLATE_DIR}`);
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
    }
    
    // Create default templates if they don't exist
    for (const [templateName, content] of Object.entries(DEFAULT_TEMPLATES)) {
      const templatePath = path.join(TEMPLATE_DIR, templateName);
      
      if (!fs.existsSync(templatePath)) {
        console.log(`Creating template: ${templateName}`);
        fs.writeFileSync(templatePath, content);
      } else {
        console.log(`Template already exists: ${templateName}`);
      }
    }
    
    console.log('Template initialization complete!');
  } catch (error) {
    console.error(`Error initializing templates: ${error.message}`);
  }
}

// Execute if called directly
if (require.main === module) {
  initializeTemplates();
}

module.exports = {
  initializeTemplates
}; 