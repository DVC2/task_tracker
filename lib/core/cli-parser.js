/**
 * CLI Argument Parser
 * 
 * Properly parses command line arguments with support for command-specific options
 */

/**
 * Parses command line arguments with proper option handling
 * 
 * @param {string[]} args - Array of arguments (excluding the script name and command)
 * @param {object} config - Configuration options
 * @returns {object} Parsed arguments: { commandArgs: string[], options: object, validationIssues: string[], valid: boolean }
 */
function parseArgs(args, _config = {}) {
  const options = {};
  const commandArgs = [];
  const validationIssues = [];
  
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Long option
      const optionName = arg.substring(2);
      
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Option with value
        options[optionName] = args[i + 1];
        i += 2;
      } else {
        // Boolean option
        options[optionName] = true;
        i++;
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      // Short option(s)
      const shortOpts = arg.substring(1);
      
      if (shortOpts.length === 1 && i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Single short option with value
        options[shortOpts] = args[i + 1];
        i += 2;
      } else {
        // Boolean short option(s)
        for (const opt of shortOpts) {
          options[opt] = true;
        }
        i++;
      }
    } else {
      // Positional argument
      commandArgs.push(arg);
      i++;
    }
  }
  
  return {
    commandArgs,
    options,
    validationIssues,
    valid: true
  };
}

module.exports = { parseArgs }; 