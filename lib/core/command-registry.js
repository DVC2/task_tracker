/**
 * TaskTracker Command Registry
 * 
 * Central registry of all available commands
 * This module solves circular dependencies between command modules 
 * by providing a central place to register and access commands.
 */

const fs = require('fs');
const path = require('path');

/**
 * Command registry 
 * Storage for all command objects
 */
const commands = {};

/**
 * Register a command handler (legacy style with commandInfo object)
 * @param {string} commandName - Name of the command
 * @param {object} commandInfo - Command metadata and handler
 * @param {string} commandInfo.description - Command description
 * @param {function} commandInfo.handler - Command implementation function
 * @param {string} [commandInfo.alias] - Optional alias to another command
 * @param {boolean} [commandInfo.standalone] - Whether command requires special handling
 */
function registerCommand(commandName, commandInfo) {
  commands[commandName] = commandInfo;
}

/**
 * Register multiple commands at once
 * @param {object} commandsObj - Object mapping command names to command info
 */
function registerCommands(commandsObj) {
  for (const [name, info] of Object.entries(commandsObj)) {
    registerCommand(name, info);
  }
}

/**
 * Register a command object
 * @param {object} command - Command object with name, description, execute, etc.
 */
function register(command) {
  if (!command || !command.name) {
    throw new Error('Invalid command: missing name');
  }
  
  if (!command.execute || typeof command.execute !== 'function') {
    throw new Error('Invalid command: missing execute function');
  }
  
  // Check if command name is already taken
  if (commands[command.name]) {
    throw new Error(`Command '${command.name}' is already registered`);
  }
  
  // Check if any aliases are already in use
  if (command.aliases && Array.isArray(command.aliases)) {
    for (const alias of command.aliases) {
      if (commands[alias] || Object.values(commands).some(cmd => 
        cmd.aliases && cmd.aliases.includes(alias))) {
        throw new Error(`Command alias '${alias}' is already in use`);
      }
    }
  }
  
  commands[command.name] = command;
}

/**
 * Get all registered commands
 * @returns {object} All commands
 */
function getAllCommands() {
  return commands;
}

/**
 * Get a command handler by name (legacy style)
 * @param {string} commandName Name of the command
 * @param {Set<string>} [visited=new Set()] - Used to detect circular aliases
 * @returns {function|null} Command handler or null if not found
 */
function getCommand(commandName, visited = new Set()) {
  if (!commandName) return null;
  
  if (visited.has(commandName)) {
    return null;
  }
  visited.add(commandName);

  const command = commands[commandName];
  if (!command) return null;
  
  // If this is an alias, get the actual command
  if (command.alias) {
    return getCommand(command.alias, visited);
  }
  
  return command.handler;
}

/**
 * Get a command by name or alias
 * @param {string} commandName Name or alias of the command
 * @returns {object|null} Command object or null if not found
 */
function get(commandName) {
  if (!commandName) return null;
  
  // Direct lookup by name
  if (commands[commandName]) {
    return commands[commandName];
  }
  
  // Look for command with this alias
  for (const command of Object.values(commands)) {
    if (command.aliases && command.aliases.includes(commandName)) {
      return command;
    }
  }
  
  return null;
}

/**
 * Get command metadata for a specific command
 * @param {string} commandName - Name of the command
 * @returns {object|null} Command metadata or null if not found
 */
function getCommandMetadata(commandName) {
  return commands[commandName] || null;
}

/**
 * Clear all registered commands (used for testing)
 */
function reset() {
  // Clear all properties from the commands object
  Object.keys(commands).forEach(key => {
    delete commands[key];
  });
}

/**
 * Load command modules from a directory
 * @param {string} dirPath - Path to directory containing command modules
 */
function loadCommands(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.error(`Command directory not found: ${dirPath}`);
      return;
    }
    
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      
      const commandName = path.basename(file, '.js');
      const absoluteCommandPath = path.resolve(dirPath, commandName);
      const normalizedPath = absoluteCommandPath.replace(/\\\\/g, '/');
      
      try {
        const commandModule = requireCommand(normalizedPath);
        
        if (commandModule && commandModule.name && commandModule.execute) {
          register(commandModule);
        } else {
          console.error(`Invalid command module: ${file}`);
        }
      } catch (error) {
        console.error(`Failed to load command '${commandName}': ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error loading commands: ${error.message}`);
  }
}

/**
 * Require a command module (exposed for testing)
 * @param {string} commandPath - Path to the command module
 * @returns {object} Command module
 */
function requireCommand(commandPath) {
  return require(commandPath);
}

module.exports = {
  registerCommand,
  registerCommands,
  getCommand,
  getAllCommands,
  getCommandMetadata,
  register,
  get,
  loadCommands,
  requireCommand,
  reset
}; 