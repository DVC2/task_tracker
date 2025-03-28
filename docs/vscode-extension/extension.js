const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('TaskTracker extension is now active');

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'tasktracker.listTasks';
  context.subscriptions.push(statusBarItem);

  // Update status bar with current task info
  function updateStatusBar() {
    if (!vscode.workspace.workspaceFolders) return;
    
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const tasksPath = path.join(rootPath, '.tasktracker', 'tasks.json');
    
    if (fs.existsSync(tasksPath)) {
      try {
        const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
        const activeTasks = tasksData.tasks.filter(t => t.status !== 'done');
        const techDebtTasks = tasksData.tasks.filter(t => t.category === 'technical-debt' && t.status !== 'done');
        
        statusBarItem.text = `$(tasklist) Tasks: ${activeTasks.length} active, ${techDebtTasks.length} tech debt`;
        statusBarItem.tooltip = 'Click to view TaskTracker tasks';
        statusBarItem.show();
      } catch (error) {
        console.error('Error reading tasks:', error);
        statusBarItem.hide();
      }
    } else {
      statusBarItem.text = '$(tasklist) TaskTracker: Not initialized';
      statusBarItem.tooltip = 'Click to initialize TaskTracker';
      statusBarItem.show();
    }
  }

  // Run TaskTracker command and show output
  function runTaskTrackerCommand(command, args = []) {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('TaskTracker: No workspace folder open');
      return;
    }
    
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const outputChannel = vscode.window.createOutputChannel('TaskTracker');
    outputChannel.show();
    
    let cmd = 'tasktracker';
    // Check if global tasktracker is installed, otherwise use local
    try {
      if (!spawn(cmd, ['--version']).pid) throw new Error('Command not found');
    } catch (error) {
      // Try local installation
      const localCmd = path.join(rootPath, 'bin', 'tasktracker');
      if (fs.existsSync(localCmd)) {
        cmd = localCmd;
      } else {
        vscode.window.showErrorMessage('TaskTracker: Command not found. Please install TaskTracker globally or in this project.');
        return;
      }
    }
    
    outputChannel.appendLine(`Running: ${cmd} ${command} ${args.join(' ')}`);
    
    const process = spawn(cmd, [command, ...args], {
      cwd: rootPath,
      shell: true
    });
    
    process.stdout.on('data', data => {
      outputChannel.append(data.toString());
    });
    
    process.stderr.on('data', data => {
      outputChannel.append(data.toString());
    });
    
    process.on('close', code => {
      outputChannel.appendLine(`\nCommand exited with code ${code}`);
      updateStatusBar();
    });
  }

  // Register commands
  const commands = {
    'tasktracker.init': () => runTaskTrackerCommand('init'),
    'tasktracker.listTasks': () => runTaskTrackerCommand('list'),
    'tasktracker.addTask': async () => {
      const title = await vscode.window.showInputBox({ 
        prompt: 'Enter task title',
        placeHolder: 'Task title'
      });
      
      if (!title) return;
      
      const categories = ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore', 'technical-debt'];
      const category = await vscode.window.showQuickPick(categories, {
        placeHolder: 'Select task category'
      });
      
      if (!category) return;
      
      runTaskTrackerCommand('quick', [title, category]);
    },
    'tasktracker.viewTask': async () => {
      // Getting the task ID from user input
      const id = await vscode.window.showInputBox({
        prompt: 'Enter task ID',
        placeHolder: 'Task ID'
      });
      
      if (!id) return;
      
      runTaskTrackerCommand('view', [id]);
    },
    'tasktracker.updateTask': async () => {
      // Getting the task ID from user input
      const id = await vscode.window.showInputBox({
        prompt: 'Enter task ID',
        placeHolder: 'Task ID'
      });
      
      if (!id) return;
      
      const fields = ['status', 'category', 'priority', 'effort', 'title', 'comment'];
      const field = await vscode.window.showQuickPick(fields, {
        placeHolder: 'Select field to update'
      });
      
      if (!field) return;
      
      const value = await vscode.window.showInputBox({
        prompt: `Enter new ${field} value`,
        placeHolder: field === 'status' ? 'todo, in-progress, review, done' : ''
      });
      
      if (!value) return;
      
      runTaskTrackerCommand('update', [id, field, value]);
    },
    'tasktracker.codeHealth': () => runTaskTrackerCommand('code-health')
  };

  // Register all commands
  for (const [command, handler] of Object.entries(commands)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }

  // Update status bar on activation
  updateStatusBar();
  
  // Watch for changes in .tasktracker directory
  const watcher = vscode.workspace.createFileSystemWatcher('**/.tasktracker/**');
  watcher.onDidChange(updateStatusBar);
  watcher.onDidCreate(updateStatusBar);
  watcher.onDidDelete(updateStatusBar);
  context.subscriptions.push(watcher);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}; 