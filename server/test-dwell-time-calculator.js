/**
 * Test Suite: Shipment Velocity & Dwell-Time Calculator
 */
import assert from 'assert';
import {
  formatDuration,
  calculateDwellTimes,
  detectDwellBottlenecks
} from '../client/src/utils/dwell-time-calculator.js';

console.log('====================================================');
console.log('       DWELL-TIME & VELOCITY CALCULATOR TEST        ');
console.log('====================================================\n');

console.log('[1] Duration Formatter:');
assert.strictEqual(formatDuration(0), '0m');
assert.strictEqual(formatDuration(60000), '1m');
assert.strictEqual(formatDuration(3600000), '1h');
assert.strictEqual(formatDuration(90000000), '1d 1h');
console.log('    - Millisecond to human-readable conversion: PASS');

console.log('[2] Stage Duration Breakdown:');
const baseTime = 1700000000000;
const mockEvents = [
  {
    version: 1,
    eventType: 'SHIPMENT_CREATED',
    timestamp: new Date(baseTime).toISOString(),
    payload: { location: 'Warehouse A' }
  },
  {
    version: 2,
    eventType: 'LOADED_ON_SHIP',
    timestamp: new Date(baseTime + 3600000 * 4).toISOString(), // +4 hours
    payload: { location: 'Port Origin' }
  },
  {
    version: 3,
    eventType: 'ARRIVED_AT_PORT',
    timestamp: new Date(baseTime + 3600000 * 28).toISOString(), // +24 hours
    payload: { location: 'Port Destination' }
  }
];

const analysis = calculateDwellTimes(mockEvents);
assert.strictEqual(analysis.stageDurations.length, 2);
assert.strictEqual(analysis.totalDurationMs, 3600000 * 28);
assert.strictEqual(analysis.stageDurations[0].durationMs, 3600000 * 4);
assert.strictEqual(analysis.stageDurations[1].durationMs, 3600000 * 24);
assert.strictEqual(analysis.longestStage.fromEvent, 'LOADED_ON_SHIP');
console.log('    - Chronological stage delta & longest duration: PASS');

console.log('[3] Bottleneck Detection:');
const bottlenecks = detectDwellBottlenecks(analysis.stageDurations, 3600000 * 10); // > 10 hours
assert.strictEqual(bottlenecks.length, 1);
assert.strictEqual(bottlenecks[0].fromEvent, 'LOADED_ON_SHIP');
console.log('    - High dwell-time bottleneck alerts: PASS');

console.log('\n====================================================');
console.log('    ALL DWELL-TIME CALCULATOR TESTS PASSED! (3/3)   ');
console.log('====================================================\n');
