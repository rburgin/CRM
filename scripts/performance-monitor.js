#!/usr/bin/env node

/**
 * Performance monitoring script for Vara CRM
 * Validates that our p95 targets are being met
 */

const { performance } = require('perf_hooks');

// Mock performance data for demonstration
const mockPerformanceData = [
  { operation: 'relationship.get', duration: 45, timestamp: Date.now() - 1000 },
  { operation: 'relationship.get', duration: 67, timestamp: Date.now() - 2000 },
  { operation: 'relationship.get', duration: 89, timestamp: Date.now() - 3000 },
  { operation: 'relationship.get', duration: 123, timestamp: Date.now() - 4000 },
  { operation: 'relationship.get', duration: 34, timestamp: Date.now() - 5000 },
  { operation: 'relationship.list', duration: 156, timestamp: Date.now() - 1000 },
  { operation: 'relationship.list', duration: 234, timestamp: Date.now() - 2000 },
  { operation: 'relationship.list', duration: 178, timestamp: Date.now() - 3000 },
];

function calculateP95(durations) {
  const sorted = durations.sort((a, b) => a - b);
  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[p95Index] || 0;
}

function analyzePerformance(data, operation, target) {
  const filtered = data
    .filter(d => d.operation === operation)
    .map(d => d.duration);
  
  if (filtered.length === 0) {
    return { operation, status: 'NO_DATA', p95: 0, target, count: 0 };
  }

  const p95 = calculateP95(filtered);
  const status = p95 <= target ? 'PASS' : 'FAIL';
  
  return {
    operation,
    status,
    p95: Math.round(p95),
    target,
    count: filtered.length,
    avg: Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length),
    min: Math.min(...filtered),
    max: Math.max(...filtered),
  };
}

console.log('🚀 Vara CRM Performance Monitor\n');

const targets = [
  { operation: 'relationship.get', target: 100 },
  { operation: 'relationship.list', target: 200 },
];

let allPassed = true;

targets.forEach(({ operation, target }) => {
  const result = analyzePerformance(mockPerformanceData, operation, target);
  
  const statusIcon = result.status === 'PASS' ? '✅' : '❌';
  const statusColor = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';
  
  console.log(`${statusIcon} ${operation}`);
  console.log(`   ${statusColor}P95: ${result.p95}ms (target: ${result.target}ms)${resetColor}`);
  console.log(`   Count: ${result.count} | Avg: ${result.avg}ms | Min: ${result.min}ms | Max: ${result.max}ms`);
  console.log('');
  
  if (result.status === 'FAIL') {
    allPassed = false;
  }
});

if (allPassed) {
  console.log('🎉 All performance targets met!');
  process.exit(0);
} else {
  console.log('⚠️  Some performance targets not met. Review and optimize.');
  process.exit(1);
}