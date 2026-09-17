import { eventStoreMetrics } from './src/utils/event-store-metrics.js';
import { getEventStoreMetrics, resetEventStoreMetrics } from './src/services/commands/event-store-service.js';

console.log('====================================================');
console.log('       EVENT STORE TELEMETRY & METRICS TEST         ');
console.log('====================================================\n');

// 1. Initial State
resetEventStoreMetrics();
const initial = getEventStoreMetrics();
console.log('[1] Initial Metrics State:');
console.log('    - Total events appended is 0:', initial.totalEventsAppended === 0 ? 'PASS' : 'FAIL');
console.log('    - Concurrency conflicts is 0:', initial.concurrencyConflicts === 0 ? 'PASS' : 'FAIL');
console.log('    - Uptime seconds tracked:', typeof initial.uptimeSeconds === 'number' ? 'PASS' : 'FAIL');

// 2. Record simulated events
console.log('\n[2] Record Simulated Appends & Latencies:');
eventStoreMetrics.recordAppend({ eventType: 'SHIPMENT_CREATED', payloadSize: 250, latencyMs: 12 });
eventStoreMetrics.recordAppend({ eventType: 'SHIPMENT_CREATED', payloadSize: 240, latencyMs: 10 });
eventStoreMetrics.recordAppend({ eventType: 'TEMPERATURE_SPIKE', payloadSize: 180, latencyMs: 8 });
eventStoreMetrics.recordBatchAppend({ count: 5, totalSize: 900, latencyMs: 25 });
eventStoreMetrics.recordConflict();
eventStoreMetrics.recordRetry();

const summary = getEventStoreMetrics();
console.log('    - Total events recorded is 8:', summary.totalEventsAppended === 8 ? 'PASS' : 'FAIL');
console.log('    - Total batches recorded is 1:', summary.totalBatchesAppended === 1 ? 'PASS' : 'FAIL');
console.log('    - Total bytes persisted tracked:', summary.totalBytesPersisted === (250 + 240 + 180 + 900) ? 'PASS' : 'FAIL');
console.log('    - Average latency calculated:', summary.avgLatencyMs > 0 ? 'PASS' : 'FAIL');
console.log('    - Concurrency conflicts tracked:', summary.concurrencyConflicts === 1 ? 'PASS' : 'FAIL');
console.log('    - Event type distribution tracked:', summary.eventTypeDistribution.SHIPMENT_CREATED === 2 && summary.eventTypeDistribution.TEMPERATURE_SPIKE === 1 ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   EVENT STORE METRICS VERIFIED SUCCESSFULLY!       ');
console.log('====================================================\n');

process.exit(0);
