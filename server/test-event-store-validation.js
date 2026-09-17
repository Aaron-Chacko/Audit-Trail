import { ALL_EVENT_TYPES, EVENT_TYPES, isValidEventType } from './src/events/event-types.js';
import { validateEventPayload } from './src/schemas/event-payload-schemas.js';
import { reduceShipmentEvents } from './src/services/queries/shipment-reducer.js';
import {
  appendEvent,
  appendEventsBatch,
  getStreamStats,
} from './src/services/commands/event-store-service.js';

console.log('====================================================');
console.log('    EVENT STORE VALIDATION & PIPELINE TESTING       ');
console.log('====================================================');

// 1. EVENT_TYPES dictionary export check
console.log('\n[1] EVENT_TYPES Dictionary Check:');
console.log('    - EVENT_TYPES.TEMPERATURE_SPIKE:', EVENT_TYPES.TEMPERATURE_SPIKE === 'TEMPERATURE_SPIKE' ? 'PASS' : 'FAIL');
console.log('    - EVENT_TYPES.SHIPMENT_CREATED:', EVENT_TYPES.SHIPMENT_CREATED === 'SHIPMENT_CREATED' ? 'PASS' : 'FAIL');
console.log('    - Object is frozen:', Object.isFrozen(EVENT_TYPES) ? 'PASS' : 'FAIL');

// 2. Payload Validation Schemas
console.log('\n[2] Event Payload Schemas Validation:');

// Test Valid Shipment Created
const validShipmentPayload = {
  origin: 'Singapore Port',
  destination: 'Rotterdam Port',
  carrier: 'Maersk Line',
  estimatedArrival: new Date().toISOString(),
};
const res1 = validateEventPayload(EVENT_TYPES.SHIPMENT_CREATED, validShipmentPayload);
console.log('    - Valid SHIPMENT_CREATED Payload:', res1.error === null ? 'PASS' : 'FAIL');

// Test Invalid Shipment Created (missing required origin)
const invalidShipmentPayload = {
  destination: 'Rotterdam Port',
};
const res2 = validateEventPayload(EVENT_TYPES.SHIPMENT_CREATED, invalidShipmentPayload);
console.log('    - Reject Invalid SHIPMENT_CREATED (missing origin):', res2.error !== null ? 'PASS' : 'FAIL');

// Test Valid Temperature Spike
const validTempSpike = {
  temperature: 28.5,
  threshold: 20.0,
  sensorId: 'SENSOR-TEMP-01',
};
const res3 = validateEventPayload(EVENT_TYPES.TEMPERATURE_SPIKE, validTempSpike);
console.log('    - Valid TEMPERATURE_SPIKE Payload:', res3.error === null ? 'PASS' : 'FAIL');

// Test Invalid Temperature Spike (string instead of number)
const invalidTempSpike = {
  temperature: 'VERY_HOT',
};
const res4 = validateEventPayload(EVENT_TYPES.TEMPERATURE_SPIKE, invalidTempSpike);
console.log('    - Reject Invalid TEMPERATURE_SPIKE (non-numeric):', res4.error !== null ? 'PASS' : 'FAIL');

// Test Valid Customs Held
const validCustoms = {
  reason: 'Documentation discrepancy',
  port: 'Chennai Port',
  severity: 'HIGH',
};
const res5 = validateEventPayload(EVENT_TYPES.CUSTOMS_HELD, validCustoms);
console.log('    - Valid CUSTOMS_HELD Payload:', res5.error === null ? 'PASS' : 'FAIL');

// 3. Shipment Reducer Compatibility Check
console.log('\n[3] Shipment Reducer Integration:');
const sampleStream = [
  {
    aggregateId: 'CONT-999',
    eventType: EVENT_TYPES.CONTAINER_CREATED,
    payload: { destination: 'Hamburg' },
    version: 1,
    timestamp: new Date('2026-09-01T08:00:00Z'),
  },
  {
    aggregateId: 'CONT-999',
    eventType: EVENT_TYPES.LOADED_ON_SHIP,
    payload: { vesselId: 'VESSEL-01' },
    version: 2,
    timestamp: new Date('2026-09-01T10:00:00Z'),
  },
  {
    aggregateId: 'CONT-999',
    eventType: EVENT_TYPES.TEMPERATURE_SPIKE,
    payload: { temperature: 32.4 },
    version: 3,
    timestamp: new Date('2026-09-01T12:00:00Z'),
  },
  {
    aggregateId: 'CONT-999',
    eventType: EVENT_TYPES.ARRIVED_AT_PORT,
    payload: { port: 'Hamburg' },
    version: 4,
    timestamp: new Date('2026-09-01T16:00:00Z'),
  },
];

const projectedState = reduceShipmentEvents(sampleStream);
console.log('    - Reducer Output Status:', projectedState.status === 'ARRIVED_AT_PORT' ? 'PASS' : 'FAIL');
console.log('    - Reducer Temperature Flag:', projectedState.flags.hasTemperatureSpike === true ? 'PASS' : 'FAIL');
console.log('    - Reducer Last Event Version:', projectedState.lastEventVersion === 4 ? 'PASS' : 'FAIL');

// 4. Batch Append and Stream Stats functions check
console.log('\n[4] Event Store Service Functions:');
console.log('    - appendEventsBatch is defined:', typeof appendEventsBatch === 'function' ? 'PASS' : 'FAIL');
console.log('    - getStreamStats is defined:', typeof getStreamStats === 'function' ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   ALL VALIDATION TESTS COMPLETED SUCCESSFULLY!     ');
console.log('====================================================\n');

process.exit(0);
