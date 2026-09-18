import assert from 'assert';
import { analyzeEventStreamHealth } from '../client/src/utils/anomaly-detector.js';
import {
  SHIPMENT_CREATED,
  SHIPMENT_DEPARTED,
  TEMPERATURE_SPIKE,
  CUSTOMS_HELD,
} from '../client/src/constants/event-types.js';

console.log('====================================================');
console.log('       EVENT STREAM ANOMALY DETECTOR TEST           ');
console.log('====================================================\n');

// Test 1: Clean stream analysis
console.log('[1] Clean Stream Analysis:');
const cleanEvents = [
  { version: 1, eventType: SHIPMENT_CREATED, timestamp: '2026-08-01T08:00:00Z', payload: { temperature: 4.0 } },
  { version: 2, eventType: SHIPMENT_DEPARTED, timestamp: '2026-08-01T12:00:00Z', payload: { temperature: 4.5 } },
];
const cleanResult = analyzeEventStreamHealth(cleanEvents);
assert.strictEqual(cleanResult.isHealthy, true, 'Clean stream should be healthy');
assert.strictEqual(cleanResult.score, 100, 'Score should be 100');
console.log('    - Clean stream audit: PASS');

// Test 2: Rapid thermal fluctuation detection
console.log('\n[2] Rapid Thermal Delta Detection:');
const spikeEvents = [
  { version: 1, eventType: SHIPMENT_CREATED, timestamp: '2026-08-01T08:00:00Z', payload: { temperature: 4.0 } },
  { version: 2, eventType: TEMPERATURE_SPIKE, timestamp: '2026-08-01T12:00:00Z', payload: { temperature: 14.8 } },
];
const spikeResult = analyzeEventStreamHealth(spikeEvents);
assert.strictEqual(spikeResult.isHealthy, false, 'Spike stream should flag anomaly');
const thermalIssue = spikeResult.issues.find((i) => i.type === 'RAPID_THERMAL_DELTA');
assert(thermalIssue, 'Should detect RAPID_THERMAL_DELTA issue');
console.log('    - Thermal delta issue detected: PASS');

// Test 3: Version sequence gap detection
console.log('\n[3] Sequence Gap Detection:');
const gapEvents = [
  { version: 1, eventType: SHIPMENT_CREATED, timestamp: '2026-08-01T08:00:00Z' },
  { version: 3, eventType: SHIPMENT_DEPARTED, timestamp: '2026-08-01T12:00:00Z' },
];
const gapResult = analyzeEventStreamHealth(gapEvents);
const seqIssue = gapResult.issues.find((i) => i.type === 'VERSION_SEQUENCE_MISMATCH');
assert(seqIssue, 'Should detect sequence gap');
console.log('    - Sequence mismatch detected: PASS');

console.log('\n====================================================');
console.log('  ALL ANOMALY DETECTOR TESTS PASSED! (3/3)          ');
console.log('====================================================');
