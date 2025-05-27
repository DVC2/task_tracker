/**
 * TaskTracker Performance Benchmark
 * Measures execution time for common operations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚡ TaskTracker Performance Benchmark\n');

// Ensure we're in a clean test environment
const testDir = path.join(__dirname, '..', '.benchmark-test');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true });
}
fs.mkdirSync(testDir);

// Helper to measure command execution time
function benchmark(name, command) {
  console.log(`📊 ${name}:`);
  const start = process.hrtime.bigint();
  
  try {
    execSync(command, { 
      cwd: testDir,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
    
    console.log(`   ✅ Completed in ${duration.toFixed(2)}ms`);
    return duration;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

// Run benchmarks
console.log('🏃 Running benchmarks...\n');

const results = [];

// Test 1: Initialize
results.push({
  name: 'Initialize project',
  time: benchmark('Initialize project', '../bin/tt init --force')
});

// Test 2: Add journal entry
results.push({
  name: 'Add journal entry',
  time: benchmark('Add journal entry', '../bin/tt journal "Test entry for benchmarking"')
});

// Test 3: Show journal entries
results.push({
  name: 'Show journal entries',
  time: benchmark('Show journal entries', '../bin/tt journal-show')
});

// Test 4: Generate quick context
results.push({
  name: 'Generate quick context',
  time: benchmark('Generate quick context', '../bin/tt context-quick')
});

// Test 5: Generate full context
results.push({
  name: 'Generate full context',
  time: benchmark('Generate full context', '../bin/tt context-full')
});

// Test 6: Show help
results.push({
  name: 'Show help',
  time: benchmark('Show help', '../bin/tt help')
});

// Test 7: Multiple journal entries
console.log('\n📊 Bulk operations:');
const bulkStart = process.hrtime.bigint();
for (let i = 0; i < 100; i++) {
  execSync(`../bin/tt journal "Bulk test entry ${i}"`, {
    cwd: testDir,
    stdio: 'pipe'
  });
}
const bulkEnd = process.hrtime.bigint();
const bulkDuration = Number(bulkEnd - bulkStart) / 1_000_000;
console.log(`   ✅ Added 100 entries in ${bulkDuration.toFixed(2)}ms (${(bulkDuration/100).toFixed(2)}ms per entry)`);

results.push({
  name: 'Add 100 journal entries',
  time: bulkDuration,
  perItem: bulkDuration / 100
});

// Summary
console.log('\n📈 Performance Summary:\n');
console.log('Command                    | Time (ms)');
console.log('---------------------------|----------');

results.forEach(result => {
  if (result.time !== null) {
    const name = result.name.padEnd(26);
    const time = result.time.toFixed(2).padStart(8);
    console.log(`${name} | ${time}`);
    if (result.perItem) {
      console.log(`  └─ Per item              | ${result.perItem.toFixed(2).padStart(8)}`);
    }
  }
});

// Performance recommendations
console.log('\n💡 Performance Analysis:\n');

const avgTime = results
  .filter(r => r.time !== null && !r.name.includes('100'))
  .reduce((sum, r) => sum + r.time, 0) / results.filter(r => r.time !== null && !r.name.includes('100')).length;

if (avgTime < 50) {
  console.log('✅ Excellent performance! Commands execute very quickly.');
} else if (avgTime < 100) {
  console.log('👍 Good performance. Commands are reasonably fast.');
} else if (avgTime < 200) {
  console.log('⚠️  Moderate performance. Consider optimizations.');
} else {
  console.log('❌ Poor performance. Significant optimizations needed.');
}

if (results.find(r => r.name === 'Show help')?.time > 100) {
  console.log('\n- Help command is slow. Consider lazy-loading help content.');
}

if (results.find(r => r.name === 'Add journal entry')?.time > 50) {
  console.log('\n- Journal writes could be optimized. Consider batching or async writes.');
}

// Cleanup
fs.rmSync(testDir, { recursive: true });

console.log('\n✅ Benchmark complete!\n'); 