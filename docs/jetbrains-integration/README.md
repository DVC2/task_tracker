# TaskTracker Integration for JetBrains IDEs

This guide explains how to integrate TaskTracker with JetBrains IDEs like IntelliJ IDEA, WebStorm, PyCharm, etc.

## Setup

### Prerequisites

- TaskTracker installed either globally or locally in your project
- JetBrains IDE (IntelliJ IDEA, WebStorm, PyCharm, etc.)

### Integration Steps

1. **External Tools Configuration**:

   - Go to **Settings/Preferences** > **Tools** > **External Tools**
   - Click the **+** button to add a new tool
   - Configure the following tools:

#### List Tasks

- **Name**: TaskTracker: List Tasks
- **Program**: tasktracker (or full path to the script)
- **Arguments**: list
- **Working Directory**: $ProjectFileDir$

#### Add Task

- **Name**: TaskTracker: Add Task
- **Program**: tasktracker (or full path to the script)
- **Arguments**: add
- **Working Directory**: $ProjectFileDir$

#### View Task

- **Name**: TaskTracker: View Task
- **Program**: tasktracker (or full path to the script)
- **Arguments**: view $Prompt$
- **Working Directory**: $ProjectFileDir$

#### Update Task

- **Name**: TaskTracker: Update Task
- **Program**: tasktracker (or full path to the script)
- **Arguments**: update $Prompt$ $Prompt$ $Prompt$
- **Working Directory**: $ProjectFileDir$

#### Quick Add Task

- **Name**: TaskTracker: Quick Add Task
- **Program**: tasktracker (or full path to the script)
- **Arguments**: quick "$Prompt$" "$Prompt$"
- **Working Directory**: $ProjectFileDir$

#### Code Health Analysis

- **Name**: TaskTracker: Code Health Analysis
- **Program**: tasktracker (or full path to the script)
- **Arguments**: code-health
- **Working Directory**: $ProjectFileDir$

2. **Adding Keyboard Shortcuts**:

   - Go to **Settings/Preferences** > **Keymap**
   - Find your tools under **External Tools** > **External Tools**
   - Right-click each one and select **Add Keyboard Shortcut**
   - Recommended shortcuts:
     - List Tasks: Alt+T, L
     - Quick Add Task: Alt+T, A
     - Update Task: Alt+T, U
     - Code Health Analysis: Alt+T, H

3. **Live Templates for Technical Debt**:

   - Go to **Settings/Preferences** > **Editor** > **Live Templates**
   - Add a new template group called "TaskTracker"
   - Add a new template:
     - **Abbreviation**: techdebt
     - **Description**: TaskTracker Technical Debt Template
     - **Template text**:

```java
/**
 * Technical Debt: [Short title]
 * Category: technical-debt
 * Priority: [p0-critical/p1-high/p2-medium/p3-low]
 * Effort: [1-trivial/3-medium/5-large/8-xlarge]
 *
 * Issue:
 * [Describe the technical debt issue]
 *
 * Risk:
 * [What happens if we don't fix this]
 *
 * Solution:
 * [How to fix it]
 */
```

4. **Creating Run Configurations**:

   - Go to **Run** > **Edit Configurations...**
   - Click the **+** button and select **Shell Script**
   - Configure the following run configurations:

#### TaskTracker: List Tasks

- **Name**: TaskTracker: List Tasks
- **Script Path**: tasktracker (or full path to the script)
- **Script Options**: list
- **Working Directory**: $ProjectFileDir$

#### TaskTracker: Code Health

- **Name**: TaskTracker: Code Health
- **Script Path**: tasktracker (or full path to the script)
- **Script Options**: code-health
- **Working Directory**: $ProjectFileDir$

## Usage

After configuration, you can access TaskTracker in the following ways:

1. From the **Tools** menu under **External Tools**
2. Using the keyboard shortcuts you defined
3. From the **Run** menu if you created run configurations
4. Using the Live Template by typing "techdebt" and pressing Tab

## JetBrains Plugin (Coming Soon)

A dedicated JetBrains plugin is under development that will provide:

- Dedicated tool window
- Task list integration with IDE tasks
- Status bar integration
- Technical debt highlighting
- Automatic code analysis 