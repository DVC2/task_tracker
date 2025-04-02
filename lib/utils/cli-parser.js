/**
 * TaskTracker CLI Argument Parser
 * 
 * Handles parsing command line arguments and options
 */

/**
 * Parse command line arguments and extract options
 * @param {string[]} args Command line arguments to parse
 * @returns {object} Object containing parsed arguments and options
 */
function parseArgs(args) {
  const commandArgs = [];
  const options = {
    nonInteractive: false,
    silent: false,
    json: false,
    minimal: false,  // Minimal output mode
    plain: false,    // Plain text mode with no formatting
    page: 1,         // Current page for pagination
    pageSize: 20,     // Number of items per page
    showArchived: false // Whether to show archived tasks
  };
  
  // Process each argument
  args.forEach(arg => {
    if (arg === '--non-interactive' || arg === '--ni') {
      options.nonInteractive = true;
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (arg === '--json' || arg === '-j') {
      options.json = true;
    } else if (arg === '--minimal' || arg === '-m') {  // Minimal output mode
      options.minimal = true;
    } else if (arg === '--plain' || arg === '-p') {    // Plain text mode
      options.plain = true;
    } else if (arg.startsWith('--page=')) {            // Pagination: current page
      const pageNum = parseInt(arg.split('=')[1]);
      if (!isNaN(pageNum) && pageNum > 0) {
        options.page = pageNum;
      }
    } else if (arg.startsWith('--page-size=')) {       // Pagination: page size
      const size = parseInt(arg.split('=')[1]);
      if (!isNaN(size) && size > 0) {
        options.pageSize = size;
      }
    } else if (arg === '--show-archived' || arg === '--archived') {
      options.showArchived = true;
    } else if (arg.startsWith('--category=')) {        // Category filter
      options.categoryFilter = arg.split('=')[1];
    } else if (arg.startsWith('--priority=')) {        // Priority filter
      options.priorityFilter = arg.split('=')[1];
    } else if (arg.startsWith('--keyword=')) {         // Keyword search
      options.keywordFilter = arg.split('=')[1];
    } else if (arg.startsWith('--sort=')) {            // Sort order
      options.sortBy = arg.split('=')[1];
    } else if (arg === '--current') {                  // Show current task only
      options.showCurrentOnly = true;
    } else if (arg === '--full') {                     // Show full task details
      options.showFull = true;
    } else if (arg === '--verbose' || arg === '-v') {  // Verbose output
      options.verbose = true;
    } else {
      commandArgs.push(arg);
    }
  });
  
  return { commandArgs, options };
}

/**
 * Extract global options from command line arguments
 * @param {string[]} args Command line arguments
 * @returns {object} Global options object
 */
function extractGlobalOptions(args) {
  const globalOptions = {
    silent: false,
    json: false,
    nonInteractive: false,
    minimal: false,
    plain: false
  };
  
  // Extract basic global flags
  for (const arg of args) {
    if (arg === '--silent' || arg === '-s') {
      globalOptions.silent = true;
    } else if (arg === '--json' || arg === '-j') {
      globalOptions.json = true;
    } else if (arg === '--non-interactive' || arg === '--ni') {
      globalOptions.nonInteractive = true;
    } else if (arg === '--minimal' || arg === '-m') {
      globalOptions.minimal = true;
    } else if (arg === '--plain' || arg === '-p') {
      globalOptions.plain = true;
    }
  }
  
  return globalOptions;
}

/**
 * Filter out global options from command arguments
 * @param {string[]} args Command line arguments
 * @returns {string[]} Filtered arguments without global options
 */
function filterGlobalOptions(args) {
  const globalFlags = [
    '--silent', '-s', 
    '--json', '-j', 
    '--non-interactive', '--ni',
    '--minimal', '-m',
    '--plain', '-p'
  ];
  
  return args.filter(arg => !globalFlags.includes(arg));
}

/**
 * Parse a specific command's arguments and options
 * @param {string} command Command name
 * @param {string[]} args Command line arguments
 * @returns {object} Parsed command args and options
 */
function parseCommand(command, args) {
  // Start with getting global options
  const globalOptions = extractGlobalOptions(args);
  const filteredArgs = filterGlobalOptions(args);
  
  // Parse command-specific arguments and options
  const { commandArgs, options } = parseArgs(filteredArgs);
  
  // Merge global options with command options
  const mergedOptions = { ...globalOptions, ...options };
  
  // Handle special cases for specific commands
  switch (command) {
    case 'list':
    case 'status':
      // First arg might be a status filter if not prefixed with --
      if (commandArgs.length > 0 && !commandArgs[0].startsWith('--')) {
        mergedOptions.statusFilter = commandArgs[0];
      }
      break;
      
    case 'view':
      // First arg is always the task ID
      mergedOptions.taskId = commandArgs[0];
      break;
      
    case 'update':
      // First arg is the task ID, second is the field, rest are values
      mergedOptions.taskId = commandArgs[0];
      mergedOptions.field = commandArgs[1];
      mergedOptions.values = commandArgs.slice(2);
      break;
      
    case 'archive':
      // First arg is the task ID, rest is the reason
      mergedOptions.taskId = commandArgs[0];
      mergedOptions.reason = commandArgs.slice(1).join(' ');
      break;
      
    case 'restore':
      // First arg is the task ID
      mergedOptions.taskId = commandArgs[0];
      break;
  }
  
  return { args: commandArgs, options: mergedOptions };
}

module.exports = {
  parseArgs,
  extractGlobalOptions,
  filterGlobalOptions,
  parseCommand
}; 