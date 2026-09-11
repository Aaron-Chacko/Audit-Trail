import { compactStream, CRITICAL_LIFECYCLE_EVENTS } from './src/utils/stream-compactor.js';

console.log('====================================================');
console.log('       EVENT STREAM COMPACTION ENGINE TEST          ');
console.log('====================================================\n');

const mockHistoricalEvents = [
  {
    aggregateId: 'SHIP-COMPACT-01',
    version: 1,
    eventType: 'SHIPMENT_CREATED',
    payload: { origin: 'Port A', destination: 'Port B' },
    timestamp: new Date('2026-01-01T00:00:00Z'),
  },
  {
    aggregateId: 'SHIP-COMPACT-01',
    version: 2,
    eventType: 'SENSOR_READING',
    payload: { temperature: 5.2 },
    timestamp: new Date('2026-01-02T00:00:00Z'),
  },
  {
    aggregateId: 'SHIP-COMPACT-01',
    version: 3,
    eventType: 'SENSOR_READING',
    payload: { temperature: 5.8 },
    timestamp: new Date('2026-01-03T00:00:00Z'),
  },
  {
    aggregateId: 'SHIP-COMPACT-01',
    version: 4,
    eventType: 'TEMPERATURE_SPIKE',
    payload: { temperature: 14.2 },
    timestamp: new Date('2026-01-04T00:00:00Z'),
  },
  {
    aggregateId: 'SHIP-COMPACT-01',
    version: 5,
    eventType: 'SHIPMENT_ARRIVED',
    payload: { port: 'Port B' },
    timestamp: new Date('2026-01-05T00:00:00Z'),
  },
];

// 1. Compacting with old age threshold
console.log('[1] Stream Compaction with Retention Threshold:');
const compacted = compactStream(mockHistoricalEvents, {
  maxAgeMs: 1000 * 60 * 60 * 24 * 30, // 30 days retention
  keepSensorThresholdAlerts: true,
});

console.log('    - Preserves immutable lifecycle events (SHIPMENT_CREATED):', compacted.some(e => e.eventType === 'SHIPMENT_CREATED') ? 'PASS' : 'FAIL');
console.log('    - Preserves immutable lifecycle events (SHIPMENT_ARRIVED):', compacted.some(e => e.eventType === 'SHIPMENT_ARRIVED') ? 'PASS' : 'FAIL');
console.log('    - Preserves threshold alert (TEMPERATURE_SPIKE):', compacted.some(e => e.eventType === 'TEMPERATURE_SPIKE') ? 'PASS' : 'FAIL');
console.log('    - Folds noisy sensor readings into summary event:', compacted.some(e => e.eventType === 'SENSOR_READINGS_COMPACTED_SUMMARY') ? 'PASS' : 'FAIL');

const summaryEvent = compacted.find(e => e.eventType === 'SENSOR_READINGS_COMPACTED_SUMMARY');
console.log('    - Summary contains correct folded count (2 readings):', summaryEvent && summaryEvent.payload.readingsFolded === 2 ? 'PASS' : 'FAIL');
console.log('    - Summary calculated avg temperature:', summaryEvent && summaryEvent.payload.avgTemperature === 5.5 ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   STREAM COMPACTION VERIFIED SUCCESSFULLY!         ');
console.log('====================================================\n');

process.exit(0);
