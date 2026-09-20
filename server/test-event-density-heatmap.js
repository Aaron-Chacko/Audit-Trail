/**
 * Test Suite: Event Density Heatmap & Activity Transformer
 */
import assert from 'assert';
import {
  buildEventDensityBuckets,
  detectBurstWindows,
  getDensityMetrics
} from '../client/src/utils/event-density-heatmap.js';

console.log('====================================================');
console.log('       EVENT DENSITY HEATMAP TEST SUITE             ');
console.log('====================================================\n');

const mockEvents = [
  { version: 1, eventType: 'SHIPMENT_CREATED', timestamp: '2026-09-20T10:05:00.000Z' },
  { version: 2, eventType: 'LOCATION_UPDATED', timestamp: '2026-09-20T10:15:00.000Z' },
  { version: 3, eventType: 'TEMPERATURE_RECORDED', timestamp: '2026-09-20T10:45:00.000Z' },
  { version: 4, eventType: 'TEMPERATURE_ALERT', timestamp: '2026-09-20T10:50:00.000Z' },
  { version: 5, eventType: 'LOCATION_UPDATED', timestamp: '2026-09-20T14:00:00.000Z' },
  { version: 6, eventType: 'DELIVERED', timestamp: '2026-09-21T09:00:00.000Z' }
];

console.log('[1] Hourly Bucketing:');
const hourlyBuckets = buildEventDensityBuckets(mockEvents, 'hour');
assert.strictEqual(hourlyBuckets.length, 3);
assert.strictEqual(hourlyBuckets[0].bucketKey, '2026-09-20T10:00');
assert.strictEqual(hourlyBuckets[0].count, 4);
assert.strictEqual(hourlyBuckets[0].hasAlert, true);
console.log('    - Correctly groups events into hourly buckets: PASS');

console.log('[2] Daily Bucketing:');
const dailyBuckets = buildEventDensityBuckets(mockEvents, 'day');
assert.strictEqual(dailyBuckets.length, 2);
assert.strictEqual(dailyBuckets[0].bucketKey, '2026-09-20');
assert.strictEqual(dailyBuckets[0].count, 5);
assert.strictEqual(dailyBuckets[1].count, 1);
console.log('    - Correctly groups events into daily buckets: PASS');

console.log('[3] Burst Window Detection:');
const bursts = detectBurstWindows(hourlyBuckets, 3);
assert.strictEqual(bursts.length, 1);
assert.strictEqual(bursts[0].bucketKey, '2026-09-20T10:00');
console.log('    - Detects high-velocity event bursts: PASS');

console.log('[4] Density Metrics:');
const metrics = getDensityMetrics(hourlyBuckets);
assert.strictEqual(metrics.peakCount, 4);
assert.strictEqual(metrics.peakBucket.bucketKey, '2026-09-20T10:00');
assert.strictEqual(metrics.averagePerBucket, 2.0);
console.log('    - Computes peak count and average event density: PASS');

console.log('\n====================================================');
console.log('    ALL EVENT DENSITY HEATMAP TESTS PASSED! (4/4)   ');
console.log('====================================================\n');
