/**
 * TaskTracker PRD Command
 * 
 * Parse Product Requirements Documents and break them into actionable development context
 * Helps maintain project vision and requirements across development sessions
 */

const fs = require('fs');
const path = require('path');
const { output } = require('../core/formatting');

/**
 * Initialize paths required by the PRD command
 * @param {string} rootDir The application root directory
 */
function initPaths(_rootDir) {
  // PRD will be stored in .tasktracker/prd/
}

/**
 * Parse and store a PRD
 * @param {array} args Command arguments (file path or direct text)
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function parsePRD(args, options = {}) {
  try {
    let prdContent = '';
    
    if (args.length === 0) {
      output('❌ PRD content or file path required', 'error', { globalOptions: options });
      output('Usage: tt prd "Build a todo app with user auth" or tt prd ./requirements.md', 'info', { globalOptions: options });
      return { success: false, error: 'PRD content required' };
    }

    const input = args.join(' ');
    
    // Check if input is a file path
    if (fs.existsSync(input)) {
      try {
        prdContent = fs.readFileSync(input, 'utf8');
        output(`📄 Reading PRD from ${input}`, 'info', { globalOptions: options });
      } catch (e) {
        output(`❌ Error reading file ${input}: ${e.message}`, 'error', { globalOptions: options });
        return { success: false, error: `Cannot read file: ${e.message}` };
      }
    } else {
      // Treat as direct PRD content
      prdContent = input;
    }

    if (!prdContent.trim()) {
      output('❌ PRD content is empty', 'error', { globalOptions: options });
      return { success: false, error: 'Empty PRD content' };
    }

    // Parse the PRD into structured data
    const parsedPRD = extractPRDStructure(prdContent);
    
    // Save the PRD
    savePRD(parsedPRD);
    
    // Generate initial journal entries from PRD
    if (options.journal !== false) {
      generateJournalFromPRD(parsedPRD);
    }

    if (options.json) {
      output(JSON.stringify({
        success: true,
        data: parsedPRD,
        message: 'PRD parsed and stored'
      }, null, 2), 'data', { globalOptions: options });
    } else {
      output('✅ PRD parsed successfully', 'success', { globalOptions: options });
      output(`📋 Project: ${parsedPRD.title}`, 'info', { globalOptions: options });
      output(`🎯 Goals: ${parsedPRD.goals.length} identified`, 'info', { globalOptions: options });
      output(`⚙️  Features: ${parsedPRD.features.length} identified`, 'info', { globalOptions: options });
      output(`🚧 Requirements: ${parsedPRD.requirements.length} identified`, 'info', { globalOptions: options });
      
      if (options.journal !== false) {
        output('📝 Initial journal entries created from PRD', 'info', { globalOptions: options });
      }
    }

    return { success: true, prd: parsedPRD };

  } catch (error) {
    output(`❌ Error parsing PRD: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Show current PRD summary
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function showPRD(args, options = {}) {
  try {
    const prd = loadPRD();
    
    if (!prd) {
      output('📄 No PRD found. Create one with: tt prd "Your project description"', 'info', { globalOptions: options });
      return { success: true, message: 'No PRD found' };
    }

    if (options.json) {
      output(JSON.stringify({
        success: true,
        data: prd
      }, null, 2), 'data', { globalOptions: options });
    } else {
      displayPRDSummary(prd, options);
    }

    return { success: true, prd };

  } catch (error) {
    output(`❌ Error showing PRD: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Generate development context from PRD
 * @param {array} args Command arguments
 * @param {object} options Command options
 * @returns {object} Result with status
 */
function generatePRDContext(args, options = {}) {
  try {
    const prd = loadPRD();
    
    if (!prd) {
      output('📄 No PRD found. Create one first with: tt prd "Your project description"', 'info', { globalOptions: options });
      return { success: false, error: 'No PRD found' };
    }

    const context = buildPRDContext(prd);
    
    if (options.output) {
      const outputPath = options.output.endsWith('.md') ? options.output : `${options.output}.md`;
      fs.writeFileSync(outputPath, context);
      output(`✅ PRD context written to ${outputPath}`, 'success', { globalOptions: options });
    } else {
      output(context, 'info', { globalOptions: options });
    }

    return { success: true, context, prd };

  } catch (error) {
    output(`❌ Error generating PRD context: ${error.message}`, 'error', { globalOptions: options });
    return { success: false, error: error.message };
  }
}

/**
 * Extract structured data from PRD content with improved parsing
 */
function extractPRDStructure(content) {
  const prd = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    title: '',
    description: '',
    goals: [],
    features: [],
    requirements: [],
    constraints: [],
    userStories: [],
    technicalStack: [],
    rawContent: content
  };

  // Parse markdown structure if present
  const lines = content.split('\n');
  let currentSection = null;
  let currentList = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract title from first heading or first line
    if (!prd.title && line) {
      if (line.startsWith('#')) {
        prd.title = line.replace(/^#+\s*/, '');
      } else if (i === 0) {
        prd.title = line.length > 100 ? line.substring(0, 100) + '...' : line;
      }
    }

    // Detect markdown sections
    if (line.startsWith('#')) {
      // Save previous section's list
      if (currentSection && currentList.length > 0) {
        addToAppropriateSection(prd, currentSection, currentList);
        currentList = [];
      }
      
      currentSection = line.toLowerCase();
    }
    
    // Parse list items
    if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
      const item = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (item) {
        currentList.push(item);
      }
    }
    
    // Parse user stories (As a... I want... So that...)
    if (line.toLowerCase().includes('as a') && line.toLowerCase().includes('i want')) {
      prd.userStories.push(line);
    }
    
    // Detect technical stack mentions
    const techKeywords = ['react', 'node', 'python', 'django', 'vue', 'angular', 'postgres', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'gcp', 'azure'];
    const lineLower = line.toLowerCase();
    techKeywords.forEach(tech => {
      if (lineLower.includes(tech) && !prd.technicalStack.includes(tech)) {
        prd.technicalStack.push(tech);
      }
    });
  }
  
  // Save last section
  if (currentSection && currentList.length > 0) {
    addToAppropriateSection(prd, currentSection, currentList);
  }
  
  // If no structured data found, use intelligent extraction
  if (prd.goals.length === 0 && prd.features.length === 0 && prd.requirements.length === 0) {
    intelligentExtraction(content, prd);
  }

  // Set description from content if not already set
  if (!prd.description) {
    const paragraphs = content.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
    if (paragraphs.length > 0) {
      prd.description = paragraphs[0].trim().substring(0, 300) + (paragraphs[0].length > 300 ? '...' : '');
    }
  }

  return prd;
}

/**
 * Add items to appropriate PRD section based on section heading
 */
function addToAppropriateSection(prd, sectionHeading, items) {
  const heading = sectionHeading.toLowerCase();
  
  if (heading.includes('goal') || heading.includes('objective') || heading.includes('aim')) {
    prd.goals.push(...items);
  } else if (heading.includes('feature') || heading.includes('functionality') || heading.includes('capability')) {
    prd.features.push(...items);
  } else if (heading.includes('requirement') || heading.includes('must have') || heading.includes('need')) {
    prd.requirements.push(...items);
  } else if (heading.includes('constraint') || heading.includes('limitation') || heading.includes('restriction')) {
    prd.constraints.push(...items);
  } else if (heading.includes('user stor')) {
    prd.userStories.push(...items);
  } else if (heading.includes('tech') || heading.includes('stack')) {
    prd.technicalStack.push(...items);
  }
}

/**
 * Intelligent extraction when no clear structure is found
 */
function intelligentExtraction(content, prd) {
  // Split into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  sentences.forEach(sentence => {
    const clean = sentence.trim();
    const lower = clean.toLowerCase();
    
    // Goals/Objectives
    if (lower.includes('goal') || lower.includes('objective') || lower.includes('aim') || 
        lower.includes('purpose') || lower.includes('mission')) {
      prd.goals.push(clean);
    }
    // Features
    else if (lower.includes('feature') || lower.includes('function') || lower.includes('capability') ||
             lower.includes('should be able to') || lower.includes('users can') || lower.includes('will allow')) {
      prd.features.push(clean);
    }
    // Requirements
    else if (lower.includes('must') || lower.includes('require') || lower.includes('need') ||
             lower.includes('essential') || lower.includes('critical')) {
      prd.requirements.push(clean);
    }
    // Constraints
    else if (lower.includes('cannot') || lower.includes('should not') || lower.includes('limit') ||
             lower.includes('constraint') || lower.includes('restriction')) {
      prd.constraints.push(clean);
    }
    // User stories
    else if (lower.includes('as a') && (lower.includes('i want') || lower.includes('i need'))) {
      prd.userStories.push(clean);
      }
  });
  
  // If still no goals, use the description as a general goal
  if (prd.goals.length === 0 && prd.description) {
    prd.goals.push(prd.description);
  }
}

/**
 * Save PRD to storage
 */
function savePRD(prd) {
  const prdDir = path.join(process.cwd(), '.tasktracker', 'prd');
  if (!fs.existsSync(prdDir)) {
    fs.mkdirSync(prdDir, { recursive: true });
  }

  const prdFile = path.join(prdDir, 'current.json');
  fs.writeFileSync(prdFile, JSON.stringify(prd, null, 2));
}

/**
 * Load current PRD
 */
function loadPRD() {
  const prdFile = path.join(process.cwd(), '.tasktracker', 'prd', 'current.json');
  
  if (!fs.existsSync(prdFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(prdFile, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * Display PRD summary
 */
function displayPRDSummary(prd, options) {
  output(`📋 Project: ${prd.title}`, 'info', { globalOptions: options });
  output(`📅 Created: ${new Date(prd.timestamp).toLocaleDateString()}`, 'info', { globalOptions: options });
  
  if (prd.description) {
    output(`\n📝 Description:\n${prd.description}`, 'info', { globalOptions: options });
  }

  if (prd.goals && prd.goals.length > 0) {
    output('\n🎯 Goals:', 'info', { globalOptions: options });
    prd.goals.forEach((goal, i) => {
      output(`   ${i + 1}. ${goal}`, 'info', { globalOptions: options });
    });
  }

  if (prd.features && prd.features.length > 0) {
    output('\n⚙️  Features:', 'info', { globalOptions: options });
    prd.features.forEach((feature, i) => {
      output(`   ${i + 1}. ${feature}`, 'info', { globalOptions: options });
    });
  }

  if (prd.requirements && prd.requirements.length > 0) {
    output('\n🚧 Requirements:', 'info', { globalOptions: options });
    prd.requirements.forEach((req, i) => {
      output(`   ${i + 1}. ${req}`, 'info', { globalOptions: options });
    });
  }

  if (prd.userStories && prd.userStories.length > 0) {
    output('\n👤 User Stories:', 'info', { globalOptions: options });
    prd.userStories.forEach((story, i) => {
      output(`   ${i + 1}. ${story}`, 'info', { globalOptions: options });
    });
  }

  if (prd.technicalStack && prd.technicalStack.length > 0) {
    output('\n🛠️  Technical Stack:', 'info', { globalOptions: options });
    output(`   ${prd.technicalStack.join(', ')}`, 'info', { globalOptions: options });
  }

  if (prd.constraints && prd.constraints.length > 0) {
    output('\n⚠️  Constraints:', 'info', { globalOptions: options });
    prd.constraints.forEach((constraint, i) => {
      output(`   ${i + 1}. ${constraint}`, 'info', { globalOptions: options });
    });
  }
}

/**
 * Build context from PRD for AI assistants
 */
function buildPRDContext(prd) {
  let context = '# Product Requirements Document\n\n';
  
  context += `## Project: ${prd.title}\n\n`;
  
  if (prd.description) {
    context += `**Description:** ${prd.description}\n\n`;
  }

  if (prd.goals.length > 0) {
    context += '## Project Goals\n\n';
    prd.goals.forEach((goal, i) => {
      context += `${i + 1}. ${goal}\n`;
    });
    context += '\n';
  }

  if (prd.features.length > 0) {
    context += '## Required Features\n\n';
    prd.features.forEach((feature, i) => {
      context += `${i + 1}. ${feature}\n`;
    });
    context += '\n';
  }

  if (prd.requirements.length > 0) {
    context += '## Technical Requirements\n\n';
    prd.requirements.forEach((req, i) => {
      context += `${i + 1}. ${req}\n`;
    });
    context += '\n';
  }

  if (prd.constraints.length > 0) {
    context += '## Constraints & Limitations\n\n';
    prd.constraints.forEach((constraint, i) => {
      context += `${i + 1}. ${constraint}\n`;
    });
    context += '\n';
  }

  context += '## AI Development Context\n\n';
  context += 'You are helping implement this project. Key points:\n\n';
  context += '1. **Stay aligned with the goals** - All development should serve the stated objectives\n';
  context += '2. **Implement required features** - Focus on the features listed above\n';
  context += '3. **Respect constraints** - Work within the specified limitations\n';
  context += '4. **Maintain project vision** - Keep the overall product direction in mind\n\n';
  
  context += '**Remember:** Use `tt journal` to document decisions and progress as you implement these requirements.\n';

  return context;
}

/**
 * Generate initial journal entries from PRD
 */
function generateJournalFromPRD(prd) {
  // Add PRD context entry
  const contextEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type: 'context',
    content: `Project initialized: ${prd.title}. Goals: ${prd.goals.length}, Features: ${prd.features.length}, Requirements: ${prd.requirements.length}`,
    tags: ['prd', 'initialization'],
    files: [],
    session: getCurrentSession()
  };

  // Add goal entries
  prd.goals.forEach((goal, i) => {
    const goalEntry = {
      id: Date.now() + i + 1,
      timestamp: new Date().toISOString(),
      type: 'idea',
      content: `Project Goal: ${goal}`,
      tags: ['prd', 'goal'],
      files: [],
      session: getCurrentSession()
    };
    saveJournalEntry(goalEntry);
  });

  saveJournalEntry(contextEntry);
}

/**
 * Get current session identifier
 */
function getCurrentSession() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
}

/**
 * Save a journal entry (helper function)
 */
function saveJournalEntry(entry) {
  const journalDir = path.join(process.cwd(), '.tasktracker', 'journal');
  if (!fs.existsSync(journalDir)) {
    fs.mkdirSync(journalDir, { recursive: true });
  }

  const journalFile = path.join(journalDir, 'entries.json');
  let entries = [];
  
  if (fs.existsSync(journalFile)) {
    try {
      entries = JSON.parse(fs.readFileSync(journalFile, 'utf8'));
    } catch (e) {
      entries = [];
    }
  }

  entries.push(entry);
  fs.writeFileSync(journalFile, JSON.stringify(entries, null, 2));
}

module.exports = {
  initPaths,
  parsePRD,
  showPRD,
  generatePRDContext
}; 