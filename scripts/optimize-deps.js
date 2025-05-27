/**
 * Dependency Optimization Script
 * Analyzes and suggests optimizations for project dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing TaskTracker dependencies...\n');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Analyze each dependency
console.log('📦 Production Dependencies:');
Object.entries(pkg.dependencies || {}).forEach(([name, version]) => {
  try {
    const size = execSync(`du -sh node_modules/${name}`, { encoding: 'utf8' }).trim();
    console.log(`  - ${name}@${version}: ${size}`);
  } catch (e) {
    console.log(`  - ${name}@${version}: (not installed)`);
  }
});

console.log('\n🛠️  Dev Dependencies:');
Object.entries(pkg.devDependencies || {}).forEach(([name, version]) => {
  try {
    const size = execSync(`du -sh node_modules/${name}`, { encoding: 'utf8' }).trim();
    console.log(`  - ${name}@${version}: ${size}`);
  } catch (e) {
    console.log(`  - ${name}@${version}: (not installed)`);
  }
});

// Suggestions
console.log('\n💡 Optimization Suggestions:\n');

// Check for chalk alternatives
if (pkg.dependencies.chalk) {
  console.log('1. Consider replacing chalk with picocolors or kleur:');
  console.log('   - picocolors: 2.5KB (vs chalk: ~40KB with dependencies)');
  console.log('   - kleur: 6KB, zero dependencies');
  console.log('   npm uninstall chalk && npm install picocolors');
}

// Check for fs-extra
if (pkg.dependencies['fs-extra']) {
  console.log('\n2. fs-extra might be overkill for simple file operations:');
  console.log('   - Use native fs.promises instead');
  console.log('   - Or use smaller alternatives like make-dir for specific needs');
}

// Check for commander
if (pkg.dependencies.commander) {
  console.log('\n3. Commander.js alternatives for smaller footprint:');
  console.log('   - yargs-parser: 40KB (just parsing, no help generation)');
  console.log('   - mri: 5KB (ultra-minimal argument parser)');
  console.log('   - For a simple CLI, consider writing your own parser');
}

// Bundle size estimate
console.log('\n📊 Bundle Size Analysis:');
try {
  const totalSize = execSync('du -sh node_modules', { encoding: 'utf8' }).trim();
  console.log(`   Total node_modules: ${totalSize}`);
  
  // Count total dependencies
  const depCount = execSync('find node_modules -maxdepth 1 -type d | wc -l', { encoding: 'utf8' }).trim();
  console.log(`   Total packages: ${depCount}`);
} catch (e) {
  console.log('   Unable to calculate sizes');
}

console.log('\n✅ Analysis complete!');
console.log('\n📝 Next steps:');
console.log('   1. Review the suggestions above');
console.log('   2. Test alternatives in a branch');
console.log('   3. Run tests after each change');
console.log('   4. Measure the size reduction\n'); 