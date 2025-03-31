#!/usr/bin/env node

/**
 * TaskTracker - Performance Monitoring Utility
 * 
 * Provides tools to benchmark and track performance metrics across TaskTracker.
 * Helps identify bottlenecks and optimize code.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Metrics storage
const metrics = {
  timers: new Map(),
  counters: new Map(),
  histograms: new Map(),
  resourceUsage: []
};

// Config options with defaults
const config = {
  enabled: process.env.TASKTRACKER_PERF_MONITOR !== 'false',
  logToConsole: process.env.TASKTRACKER_PERF_LOG === 'true',
  sampleInterval: parseInt(process.env.TASKTRACKER_PERF_SAMPLE_INTERVAL || '1000', 10),
  outputPath: process.env.TASKTRACKER_PERF_OUTPUT || path.join(process.cwd(), '.tasktracker', 'performance.json'),
  savePeriod: parseInt(process.env.TASKTRACKER_PERF_SAVE_PERIOD || '10000', 10) // Save every 10 seconds by default
};

let resourceSamplingInterval = null;
let perfSaveInterval = null;

/**
 * Initialize performance monitoring
 * 
 * @param {Object} options - Configuration options
 */
function init(options = {}) {
  // Override default config with provided options
  Object.assign(config, options);
  
  if (!config.enabled) {
    return;
  }
  
  // Start resource usage sampling
  startResourceSampling();
  
  // Set up periodic saving of metrics
  if (config.savePeriod > 0) {
    perfSaveInterval = setInterval(() => {
      saveMetrics();
    }, config.savePeriod);
  }
  
  // Make sure intervals don't keep the process running
  if (perfSaveInterval) perfSaveInterval.unref();
  if (resourceSamplingInterval) resourceSamplingInterval.unref();
  
  log('Performance monitoring initialized');
}

/**
 * Start a timer
 * 
 * @param {string} name - Timer name
 * @returns {function} Stop function that returns the elapsed time
 */
function startTimer(name) {
  if (!config.enabled) return () => 0;
  
  const start = process.hrtime.bigint();
  
  return () => {
    const end = process.hrtime.bigint();
    const elapsed = Number(end - start) / 1e6; // Convert to milliseconds
    
    // Record in metrics
    if (!metrics.timers.has(name)) {
      metrics.timers.set(name, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0,
        samples: []
      });
    }
    
    const timer = metrics.timers.get(name);
    timer.count++;
    timer.total += elapsed;
    timer.min = Math.min(timer.min, elapsed);
    timer.max = Math.max(timer.max, elapsed);
    timer.avg = timer.total / timer.count;
    
    // Keep last 100 samples for detailed analysis
    timer.samples.push({
      timestamp: Date.now(),
      duration: elapsed
    });
    
    if (timer.samples.length > 100) {
      timer.samples.shift();
    }
    
    if (config.logToConsole) {
      log(`Timer ${name}: ${elapsed.toFixed(2)}ms (avg: ${timer.avg.toFixed(2)}ms)`);
    }
    
    return elapsed;
  };
}

/**
 * Time a synchronous function
 * 
 * @param {string} name - Timer name
 * @param {function} fn - Function to time
 * @returns {any} Function result
 */
function timeSync(name, fn) {
  if (!config.enabled) return fn();
  
  const stopTimer = startTimer(name);
  try {
    const result = fn();
    stopTimer();
    return result;
  } catch (error) {
    stopTimer();
    throw error;
  }
}

/**
 * Time an asynchronous function
 * 
 * @param {string} name - Timer name
 * @param {function} fn - Async function to time
 * @returns {Promise<any>} Function result
 */
async function timeAsync(name, fn) {
  if (!config.enabled) return fn();
  
  const stopTimer = startTimer(name);
  try {
    const result = await fn();
    stopTimer();
    return result;
  } catch (error) {
    stopTimer();
    throw error;
  }
}

/**
 * Increment a counter
 * 
 * @param {string} name - Counter name
 * @param {number} [value=1] - Amount to increment by
 * @returns {number} New counter value
 */
function incrementCounter(name, value = 1) {
  if (!config.enabled) return 0;
  
  if (!metrics.counters.has(name)) {
    metrics.counters.set(name, {
      value: 0,
      history: []
    });
  }
  
  const counter = metrics.counters.get(name);
  counter.value += value;
  
  // Record history point
  counter.history.push({
    timestamp: Date.now(),
    value: counter.value
  });
  
  // Keep history manageable
  if (counter.history.length > 100) {
    counter.history.shift();
  }
  
  if (config.logToConsole) {
    log(`Counter ${name}: ${counter.value}`);
  }
  
  return counter.value;
}

/**
 * Record a value in a histogram
 * 
 * @param {string} name - Histogram name
 * @param {number} value - Value to record
 */
function recordHistogram(name, value) {
  if (!config.enabled) return;
  
  if (!metrics.histograms.has(name)) {
    metrics.histograms.set(name, {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      bins: {}
    });
  }
  
  const histogram = metrics.histograms.get(name);
  histogram.count++;
  histogram.sum += value;
  histogram.min = Math.min(histogram.min, value);
  histogram.max = Math.max(histogram.max, value);
  
  // Simple bucketing
  const bin = Math.floor(value);
  histogram.bins[bin] = (histogram.bins[bin] || 0) + 1;
  
  if (config.logToConsole) {
    log(`Histogram ${name}: ${value} (avg: ${(histogram.sum / histogram.count).toFixed(2)})`);
  }
}

/**
 * Start periodic resource usage sampling
 */
function startResourceSampling() {
  if (resourceSamplingInterval) {
    clearInterval(resourceSamplingInterval);
  }
  
  resourceSamplingInterval = setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    metrics.resourceUsage.push({
      timestamp: Date.now(),
      memory: {
        rss: memoryUsage.rss / 1024 / 1024, // MB
        heapTotal: memoryUsage.heapTotal / 1024 / 1024, // MB
        heapUsed: memoryUsage.heapUsed / 1024 / 1024, // MB
        external: memoryUsage.external / 1024 / 1024 // MB
      },
      cpu: {
        user: cpuUsage.user / 1000, // ms
        system: cpuUsage.system / 1000 // ms
      }
    });
    
    // Keep reasonable history
    if (metrics.resourceUsage.length > 100) {
      metrics.resourceUsage.shift();
    }
  }, config.sampleInterval);
}

/**
 * Save metrics to disk
 */
function saveMetrics() {
  if (!config.enabled) return;
  
  try {
    // Ensure directory exists
    const dir = path.dirname(config.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Prepare data for serialization
    const perfData = {
      timestamp: Date.now(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpus: os.cpus().length,
        totalMemory: os.totalmem() / 1024 / 1024 // MB
      },
      timers: Object.fromEntries(metrics.timers),
      counters: Object.fromEntries(metrics.counters),
      histograms: Object.fromEntries(metrics.histograms),
      resourceUsage: metrics.resourceUsage.slice(-20) // Only last 20 samples
    };
    
    // Write to file
    fs.writeFileSync(config.outputPath, JSON.stringify(perfData, null, 2));
    
    if (config.logToConsole) {
      log(`Performance metrics saved to ${config.outputPath}`);
    }
  } catch (error) {
    console.error(`Error saving performance metrics: ${error.message}`);
  }
}

/**
 * Generate a performance report
 * 
 * @returns {Object} Performance report
 */
function generateReport() {
  if (!config.enabled) return { enabled: false };
  
  // Calculate percentiles for timers
  const timerStats = {};
  metrics.timers.forEach((timer, name) => {
    const samples = timer.samples.map(s => s.duration).sort((a, b) => a - b);
    
    timerStats[name] = {
      count: timer.count,
      avg: timer.avg,
      min: timer.min,
      max: timer.max,
      p50: samples.length > 0 ? samples[Math.floor(samples.length * 0.5)] : 0,
      p90: samples.length > 0 ? samples[Math.floor(samples.length * 0.9)] : 0,
      p99: samples.length > 0 ? samples[Math.floor(samples.length * 0.99)] : 0
    };
  });
  
  // Get latest resource usage
  const latestResource = metrics.resourceUsage.length > 0 
    ? metrics.resourceUsage[metrics.resourceUsage.length - 1]
    : null;
  
  return {
    enabled: true,
    timestamp: Date.now(),
    timers: timerStats,
    counters: Object.fromEntries(metrics.counters),
    histograms: Object.fromEntries(metrics.histograms),
    resourceUsage: latestResource
  };
}

/**
 * Shutdown performance monitoring
 */
function shutdown() {
  if (!config.enabled) return;
  
  // Stop intervals
  if (resourceSamplingInterval) {
    clearInterval(resourceSamplingInterval);
    resourceSamplingInterval = null;
  }
  
  if (perfSaveInterval) {
    clearInterval(perfSaveInterval);
    perfSaveInterval = null;
  }
  
  // Save final metrics
  saveMetrics();
  
  log('Performance monitoring shutdown');
}

/**
 * Log utility for perf-monitor
 */
function log(message) {
  if (config.logToConsole) {
    console.log(`[PerfMonitor] ${message}`);
  }
}

module.exports = {
  init,
  startTimer,
  timeSync,
  timeAsync,
  incrementCounter,
  recordHistogram,
  saveMetrics,
  generateReport,
  shutdown
}; 