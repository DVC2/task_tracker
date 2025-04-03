/**
 * TaskTracker Batch Command
 * 
 * Processes multiple task operations in a single command.
 * This is especially useful for AI agent integration to reduce the number of API calls.
 */

const fs = require('fs');
const path = require('path');
const { output } = require('../core/formatting');
const { processBatchOperations, OPERATION_TYPES } = require('../utils/batch-processor');
const security = require('../utils/security-middleware');

/**
 * Process batch operations from a JSON file or command line
 * @param {string} inputFile JSON file containing batch operations or JSON string
 * @param {object} options Command options
 * @returns {object} Result of batch processing
 */
async function processBatch(inputFile, options = {}) {
  let operations;
  
  try {
    // Check if input is a direct JSON string
    if (inputFile && inputFile.trim().startsWith('{')) {
      try {
        operations = security.safeJsonParse(inputFile);
      } catch (error) {
        output(`❌ Failed to parse JSON input: ${error.message}`, 'error', { globalOptions: options });
        return { success: false };
      }
    } 
    // Check if input is a file path
    else if (inputFile && fs.existsSync(inputFile)) {
      try {
        const content = fs.readFileSync(inputFile, 'utf8');
        operations = security.safeJsonParse(content);
      } catch (error) {
        output(`❌ Failed to read or parse file ${inputFile}: ${error.message}`, 'error', { globalOptions: options });
        return { success: false };
      }
    } 
    // No valid input provided
    else {
      output('❌ Please provide a JSON file path or a JSON string containing batch operations', 'error', { globalOptions: options });
      showBatchHelp(options);
      return { success: false };
    }
    
    // Validate operations format
    if (!operations.operations || !Array.isArray(operations.operations)) {
      output('❌ Invalid batch format: Missing "operations" array', 'error', { globalOptions: options });
      showBatchHelp(options);
      return { success: false };
    }
    
    // Process batch operations
    const result = await processBatchOperations(operations.operations, {
      failFast: options.failFast,
      ...options
    });
    
    if (options.json) {
      output(result, 'data', { globalOptions: options });
    } else {
      // Show a summary of the results
      const { successful, failed, total } = result.metadata;
      output(`✅ Batch processing completed: ${successful} of ${total} operations successful`, 'success', { globalOptions: options });
      
      if (failed > 0) {
        output(`❌ ${failed} operations failed`, 'error', { globalOptions: options });
        
        // Show error details
        result.errors.forEach(error => {
          output(`  - ${error.type} (Task #${error.taskId}): ${error.error}`, 'error', { globalOptions: options });
        });
      }
    }
    
    return result;
  } catch (error) {
    output(`❌ Error processing batch: ${error.message}`, 'error', { globalOptions: options });
    return { success: false };
  }
}

/**
 * Show help for batch command
 * @param {object} options Command options
 */
function showBatchHelp(options = {}) {
  output(`
Batch Command Usage
------------------
tt batch <operations-file.json> [options]

The operations file should contain a JSON object with an "operations" array:

{
  "operations": [
    {
      "type": "create",
      "data": {
        "title": "Task title",
        "description": "Task description",
        "category": "feature",
        ...
      }
    },
    {
      "type": "update",
      "taskId": 123,
      "updates": {
        "status": "in-progress",
        "priority": "p1-high"
      }
    },
    ...
  ]
}

Supported operation types:
${Object.values(OPERATION_TYPES).map(type => `- ${type}`).join('\n')}

Options:
  --fail-fast     Stop processing after the first error
  --json          Output results in JSON format
  --silent        Suppress non-error output
`, 'info', { globalOptions: options });
}

module.exports = processBatch; 