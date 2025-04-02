/**
 * TaskTracker Update Config Command
 * 
 * Updates configuration settings
 */

const fs = require('fs');
const path = require('path');

// Import dependencies
const { output } = require('../core/formatting');
const configManager = require('../core/config-manager');

/**
 * Update a configuration setting
 * @param {string} option Configuration option to update
 * @param {string[]} values Values for the update
 * @param {object} options Command options
 * @returns {object} Result with updated configuration
 */
function updateConfig(option, values = [], options = {}) {
  try {
    if (!option) {
      return showConfigOptions(options);
    }
    
    const config = configManager.loadConfig();
    let updated = false;
    
    switch (option.toLowerCase()) {
      case 'suppress-chalk-warnings':
        config.showChalkWarnings = false;
        updated = true;
        output('✅ Chalk warnings will be suppressed.', 'success', { globalOptions: options });
        break;
        
      case 'show-chalk-warnings':
        config.showChalkWarnings = true;
        updated = true;
        output('✅ Chalk warnings will be shown.', 'success', { globalOptions: options });
        break;
        
      case 'project-name':
        if (!values[0]) {
          output('❌ Project name required', 'error', { globalOptions: options });
          return { success: false, error: 'Project name required' };
        }
        
        config.projectName = values[0];
        updated = true;
        output(`✅ Project name updated to: ${config.projectName}`, 'success', { globalOptions: options });
        break;
        
      case 'add-category':
        if (!values[0]) {
          output('❌ Category name required', 'error', { globalOptions: options });
          return { success: false, error: 'Category name required' };
        }
        
        const newCategory = values[0].toLowerCase();
        if (!config.taskCategories.includes(newCategory)) {
          config.taskCategories.push(newCategory);
          updated = true;
          output(`✅ Added category: ${newCategory}`, 'success', { globalOptions: options });
        } else {
          output(`ℹ️ Category '${newCategory}' already exists.`, 'info', { globalOptions: options });
        }
        break;
        
      case 'remove-category':
        if (!values[0]) {
          output('❌ Category name required', 'error', { globalOptions: options });
          return { success: false, error: 'Category name required' };
        }
        
        const categoryToRemove = values[0].toLowerCase();
        const categoryIndex = config.taskCategories.findIndex(c => c.toLowerCase() === categoryToRemove);
        
        if (categoryIndex !== -1) {
          config.taskCategories.splice(categoryIndex, 1);
          updated = true;
          output(`✅ Removed category: ${categoryToRemove}`, 'success', { globalOptions: options });
        } else {
          output(`❌ Category '${categoryToRemove}' not found.`, 'error', { globalOptions: options });
          return { success: false, error: `Category '${categoryToRemove}' not found` };
        }
        break;
        
      case 'add-status':
        if (!values[0]) {
          output('❌ Status name required', 'error', { globalOptions: options });
          return { success: false, error: 'Status name required' };
        }
        
        const newStatus = values[0].toLowerCase();
        if (!config.taskStatuses.includes(newStatus)) {
          config.taskStatuses.push(newStatus);
          updated = true;
          output(`✅ Added status: ${newStatus}`, 'success', { globalOptions: options });
        } else {
          output(`ℹ️ Status '${newStatus}' already exists.`, 'info', { globalOptions: options });
        }
        break;
        
      case 'remove-status':
        if (!values[0]) {
          output('❌ Status name required', 'error', { globalOptions: options });
          return { success: false, error: 'Status name required' };
        }
        
        const statusToRemove = values[0].toLowerCase();
        const statusIndex = config.taskStatuses.findIndex(s => s.toLowerCase() === statusToRemove);
        
        if (statusIndex !== -1) {
          config.taskStatuses.splice(statusIndex, 1);
          updated = true;
          output(`✅ Removed status: ${statusToRemove}`, 'success', { globalOptions: options });
        } else {
          output(`❌ Status '${statusToRemove}' not found.`, 'error', { globalOptions: options });
          return { success: false, error: `Status '${statusToRemove}' not found` };
        }
        break;
        
      case 'display-width':
        const width = parseInt(values[0]);
        if (isNaN(width) || width < 60 || width > 200) {
          output('❌ Width must be a number between 60 and 200', 'error', { globalOptions: options });
          return { success: false, error: 'Invalid width value' };
        }
        
        config.maxDisplayWidth = width;
        updated = true;
        output(`✅ Display width updated to: ${width}`, 'success', { globalOptions: options });
        break;
        
      case 'default-view':
        const view = values[0];
        if (!['table', 'compact', 'detailed'].includes(view)) {
          output('❌ View must be one of: table, compact, detailed', 'error', { globalOptions: options });
          return { success: false, error: 'Invalid view value' };
        }
        
        config.defaultListView = view;
        updated = true;
        output(`✅ Default view updated to: ${view}`, 'success', { globalOptions: options });
        break;
        
      case 'date-format':
        const format = values[0];
        if (!['locale', 'iso', 'short'].includes(format)) {
          output('❌ Format must be one of: locale, iso, short', 'error', { globalOptions: options });
          return { success: false, error: 'Invalid date format value' };
        }
        
        config.dateFormat = format;
        updated = true;
        output(`✅ Date format updated to: ${format}`, 'success', { globalOptions: options });
        break;
        
      case 'show':
        // Show current configuration
        showCurrentConfig(config, options);
        return { success: true, config };
        
      default:
        output(`❌ Unknown configuration option: ${option}`, 'error', { globalOptions: options });
        showConfigOptions(options);
        return { success: false, error: `Unknown option: ${option}` };
    }
    
    if (updated) {
      // Save updated configuration
      configManager.saveConfig(config);
      
      // JSON output if requested
      if (options.json) {
        output(config, 'data', { globalOptions: options });
      }
      
      return { success: true, config };
    }
    
    return { success: false, error: 'No changes made' };
  } catch (error) {
    output(`❌ Error updating configuration: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Show available configuration options
 * @param {object} options Command options
 * @returns {object} Success status
 */
function showConfigOptions(options = {}) {
  output('\n⚙️ Available configuration options:', 'info', { globalOptions: options });
  output('  suppress-chalk-warnings      Hide chalk library compatibility warnings', 'info', { globalOptions: options });
  output('  show-chalk-warnings          Show chalk library compatibility warnings', 'info', { globalOptions: options });
  output('  project-name <name>          Set project name', 'info', { globalOptions: options });
  output('  add-category <category>      Add a task category', 'info', { globalOptions: options });
  output('  remove-category <category>   Remove a task category', 'info', { globalOptions: options });
  output('  add-status <status>          Add a task status', 'info', { globalOptions: options });
  output('  remove-status <status>       Remove a task status', 'info', { globalOptions: options });
  output('  display-width <width>        Set maximum display width (60-200)', 'info', { globalOptions: options });
  output('  default-view <view>          Set default list view (table, compact, detailed)', 'info', { globalOptions: options });
  output('  date-format <format>         Set date format (locale, iso, short)', 'info', { globalOptions: options });
  output('  show                         Show current configuration', 'info', { globalOptions: options });
  
  return { success: true };
}

/**
 * Show current configuration
 * @param {object} config Configuration object
 * @param {object} options Command options
 */
function showCurrentConfig(config, options = {}) {
  output('\n⚙️ Current Configuration:', 'info', { globalOptions: options });
  output(`  Project Name: ${config.projectName || 'Not set'}`, 'info', { globalOptions: options });
  output(`  Show Chalk Warnings: ${config.showChalkWarnings ? 'Yes' : 'No'}`, 'info', { globalOptions: options });
  output(`  Max Display Width: ${config.maxDisplayWidth || 120}`, 'info', { globalOptions: options });
  output(`  Default List View: ${config.defaultListView || 'table'}`, 'info', { globalOptions: options });
  output(`  Date Format: ${config.dateFormat || 'locale'}`, 'info', { globalOptions: options });
  
  output('\n  Task Categories:', 'info', { globalOptions: options });
  config.taskCategories.forEach(category => {
    output(`    - ${category}`, 'info', { globalOptions: options });
  });
  
  output('\n  Task Statuses:', 'info', { globalOptions: options });
  config.taskStatuses.forEach(status => {
    output(`    - ${status}`, 'info', { globalOptions: options });
  });
  
  output('\n  Priority Levels:', 'info', { globalOptions: options });
  config.priorityLevels.forEach(priority => {
    output(`    - ${priority}`, 'info', { globalOptions: options });
  });
  
  output('\n  Effort Estimation:', 'info', { globalOptions: options });
  config.effortEstimation.forEach(effort => {
    output(`    - ${effort}`, 'info', { globalOptions: options });
  });
  
  if (options.json) {
    output(config, 'data', { globalOptions: options });
  }
}

module.exports = {
  updateConfig,
  showConfigOptions
}; 