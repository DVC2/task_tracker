# TaskTracker Reports & Statistics Guide

TaskTracker provides comprehensive project statistics and reporting capabilities to help you track progress, visualize trends, and understand your development process better.

## Types of Reports

TaskTracker offers several report formats:

1. **Text Reports** - Markdown-formatted text for easy terminal viewing
2. **HTML Reports** - Visually rich reports with charts and progress indicators
3. **JSON Reports** - Machine-readable format for further analysis

## Generating Reports

```bash
# Basic text report
./tasktracker report text

# HTML report (saved to .tasktracker/reports/)
./tasktracker report html

# JSON report for data analysis
./tasktracker report json
```

## Statistics Snapshots

TaskTracker keeps track of your project's progress by taking statistical snapshots:

```bash
# Take a snapshot manually
./tasktracker snapshot

# View trends based on snapshots
./tasktracker trends

# Compare with previous snapshot
./tasktracker compare 7  # Compare with 7 days ago
```

Snapshots capture:
- Task counts by status and category
- Completion percentages
- File statistics
- Git repository metrics

## Understanding Reports

### Text Reports

Text reports provide a quick overview of your project:

```
# TaskTracker Project Report

## Project: YourProject
Generated: 2023-03-28 15:30:45
Version: 1.2.0

## Task Summary

Total Tasks: 24
Completion: 62.5%

## Task Status

- done: 15 (62.5%)
- in-progress: 5 (20.8%)
- todo: 3 (12.5%)
- review: 1 (4.2%)

## Task Categories

- feature: 10 (41.7%)
- bugfix: 8 (33.3%)
- refactor: 4 (16.7%)
- docs: 2 (8.3%)
```

### HTML Reports

HTML reports are more visually rich, featuring:
- Progress bars for completion rates
- Task breakdown by status and category
- File statistics with tables
- Git commit and contributor information

These reports are saved to `.tasktracker/reports/` as both dated files and a `latest-report.html`.

### JSON Reports

JSON reports provide all statistics in a machine-readable format that can be imported into other tools for further analysis.

## Report Automation

You can automate report generation:

1. **Git Pre-commit Hooks**: Take snapshots before each commit
2. **Daily Snapshots**: Configure a daily cron job for statistics
3. **Weekly Reports**: Generate HTML reports at regular intervals

Set up automation with:

```bash
./tasktracker automate
```

## Completion Trends & Projections

The trends analysis shows task completion rates over time and provides projections:

```bash
./tasktracker trends
```

Output includes:
- Task velocity (tasks completed per day)
- Projected completion date
- Visualization of completion rates over time

## File Statistics

Reports include detailed file statistics:
- Total files and lines of code
- Breakdown by file extension
- Largest files by size and line count

This helps identify complex areas of your codebase that might need refactoring.

## Comparing Progress

The compare command shows changes between snapshots:

```bash
./tasktracker compare 7  # Compare with 7 days ago
```

This is helpful for understanding:
- How many tasks were completed in a period
- Progress on specific categories
- Changes in completion percentage

## Customizing Reports

You can customize report sections by editing the `.tasktracker/config.json` file to focus on the aspects most important to your project.

## Best Practices

1. **Take regular snapshots** to build meaningful trend data
2. **Generate HTML reports** before team meetings
3. **Use comparisons** to track progress between sprints
4. **Share reports** with stakeholders to show progress
5. **Keep reports in version control** for historical tracking

## Troubleshooting

If reports show unexpected results:
- Ensure tasks are properly categorized
- Check that task statuses are kept up to date
- Verify that file associations are correct
- Make sure snapshots are taken regularly 