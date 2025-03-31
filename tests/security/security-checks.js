/**
 * TaskTracker Security Test Suite
 * 
 * This script performs basic security checks on the TaskTracker codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SENSITIVE_PATTERNS = [
  /password\s*=\s*['"][^'"]+['"]/i,
  /token\s*=\s*['"][^'"]+['"]/i,
  /secret\s*=\s*['"][^'"]+['"]/i,
  /credential\s*=\s*['"][^'"]+['"]/i,
  /private\s*=\s*['"][^'"]+['"]/i,
  /api[_\s]?key\s*=\s*['"][^'"]+['"]/i
];

const DANGEROUS_PATTERNS = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /setTimeout\s*\(\s*['"`][^'"`]+['"`]/,
  /setInterval\s*\(\s*['"`][^'"`]+['"`]/,
  /exec\s*\(\s*['"`][^'"`]+['"`]/
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage'
];

// Test: Check for sensitive information in code
function checkForSensitiveInfo() {
  console.log('\n🔒 Checking for sensitive information in codebase...');
  
  const violations = [];
  const projectDir = path.resolve(__dirname, '../../');
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip ignored directories
      if (entry.isDirectory() && IGNORE_DIRS.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(js|ts|json|md|txt)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for sensitive patterns
          for (const pattern of SENSITIVE_PATTERNS) {
            if (pattern.test(content)) {
              violations.push({
                file: path.relative(projectDir, fullPath),
                pattern: pattern.toString().replace(/^\/|\/i$/g, ''),
                type: 'sensitive-info'
              });
              break; // Only report once per file per pattern type
            }
          }
        } catch (err) {
          console.error(`Error reading ${fullPath}: ${err.message}`);
        }
      }
    }
  }
  
  scanDirectory(projectDir);
  
  if (violations.length > 0) {
    console.log('❌ Sensitive information found:');
    violations.forEach(v => {
      console.log(`  - ${v.file} matches pattern: ${v.pattern}`);
    });
  } else {
    console.log('✅ No sensitive information found in codebase');
  }
  
  return violations.length === 0;
}

// Test: Check for dangerous code patterns
function checkForDangerousPatterns() {
  console.log('\n⚠️ Checking for potentially dangerous code patterns...');
  
  const violations = [];
  const projectDir = path.resolve(__dirname, '../../');
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip ignored directories
      if (entry.isDirectory() && IGNORE_DIRS.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.js$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for dangerous patterns
          for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.test(content)) {
              violations.push({
                file: path.relative(projectDir, fullPath),
                pattern: pattern.toString().replace(/^\/|\/$/g, ''),
                type: 'dangerous-pattern'
              });
            }
          }
        } catch (err) {
          console.error(`Error reading ${fullPath}: ${err.message}`);
        }
      }
    }
  }
  
  scanDirectory(projectDir);
  
  if (violations.length > 0) {
    console.log('⚠️ Potentially dangerous patterns found:');
    violations.forEach(v => {
      console.log(`  - ${v.file} matches pattern: ${v.pattern}`);
    });
    console.log('\nNOTE: These may be legitimate uses. Please review each case.');
  } else {
    console.log('✅ No dangerous code patterns found in codebase');
  }
  
  return true; // Don't fail the build, just warn
}

// Test: Verify .taskignore configurations
function verifyTaskIgnore() {
  console.log('\n📋 Verifying .taskignore configuration...');
  
  const taskIgnorePath = path.resolve(__dirname, '../../.taskignore');
  
  if (!fs.existsSync(taskIgnorePath)) {
    console.log('❌ .taskignore file not found');
    return false;
  }
  
  const content = fs.readFileSync(taskIgnorePath, 'utf8');
  const requiredPatterns = [
    '.env',
    '*credentials*',
    '*secret*',
    '*token*',
    '*password*',
    '*.pem',
    '*.key',
    '*private*'
  ];
  
  const missingPatterns = [];
  
  for (const pattern of requiredPatterns) {
    if (!content.includes(pattern)) {
      missingPatterns.push(pattern);
    }
  }
  
  if (missingPatterns.length > 0) {
    console.log('❌ .taskignore is missing required patterns:');
    missingPatterns.forEach(p => console.log(`  - ${p}`));
    return false;
  }
  
  console.log('✅ .taskignore contains all required security patterns');
  return true;
}

// Run all tests
function runAllTests() {
  console.log('🔐 Running TaskTracker security tests...');
  
  const results = {
    sensitiveInfo: checkForSensitiveInfo(),
    dangerousPatterns: checkForDangerousPatterns(),
    taskIgnoreConfig: verifyTaskIgnore()
  };
  
  console.log('\n📝 Security Test Summary:');
  console.log(`Sensitive Info Check: ${results.sensitiveInfo ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Dangerous Patterns Check: ${results.dangerousPatterns ? '✅ PASS' : '⚠️ WARNING'}`);
  console.log(`TaskIgnore Config Check: ${results.taskIgnoreConfig ? '✅ PASS' : '❌ FAIL'}`);
  
  const success = results.sensitiveInfo && results.taskIgnoreConfig;
  console.log(`\nOverall Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
  
  process.exit(success ? 0 : 1);
}

// Execute tests
runAllTests(); 