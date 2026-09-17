import assert from 'assert';
import {
  applyEventToShipmentState,
  reconstructStateAtVersion,
  reconstructStateAtTimestamp,
} from '../client/src/utils/shipment-state-reconstructor.js';
import { computeStateDiff } from '../client/src/utils/state-diff.js';
import { getEventCategory, isAlertEvent, EVENT_CATEGORIES } from '../client/src/utils/event-theme.js';
import {
  SHIPMENT_CREATED,
  SHIPMENT_DEPARTED,
  TEMPERATURE_SPIKE,
  ARRIVED_AT_PORT,
  CUSTOMS_HELD,
  CUSTOMS_CLEARED,
} from '../client/src/constants/event-types.js';

console.log('====================================================');
console.log('       TIMELINE ENGINE & STATE REPLAY TEST          ');
console.log('====================================================\n');

// Mock Event Sequence
const mockEvents = [
  {
    aggregateId: 'SHIP-10042',
    eventType: SHIPMENT_CREATED,
    version: 1,
    timestamp: '2026-08-25T08:00:00Z',
    payload: {
      origin: { port: 'Chennai', country: 'India' },
      destination: { port: 'Rotterdam', country: 'Netherlands' },
      cargo: { description: 'Semiconductors', weightKg: 14000 },
      vessel: { name: 'MSC Oscar', imo: '9703291' },
    },
  },
  {
    aggregateId: 'SHIP-10042',
    eventType: SHIPMENT_DEPARTED,
    version: 2,
    timestamp: '2026-08-25T10:00:00Z',
    payload: {
      location: { port: 'Chennai Port Outer Anchorage' },
    },
  },
  {
    aggregateId: 'SHIP-10042',
    eventType: TEMPERATURE_SPIKE,
    version: 3,
    timestamp: '2026-08-26T14:30:00Z',
    payload: {
      temperature: 14.5,
      threshold: 8.0,
    },
  },
  {
    aggregateId: 'SHIP-10042',
    eventType: CUSTOMS_HELD,
    version: 4,
    timestamp: '2026-08-28T09:00:00Z',
    payload: {
      reason: 'Physical inspection required',
    },
  },
  {
    aggregateId: 'SHIP-10042',
    eventType: CUSTOMS_CLEARED,
    version: 5,
    timestamp: '2026-08-28T16:00:00Z',
    payload: {
      clearanceCode: 'C-9921',
    },
  },
  {
    aggregateId: 'SHIP-10042',
    eventType: ARRIVED_AT_PORT,
    version: 6,
    timestamp: '2026-08-30T18:00:00Z',
    payload: {
      port: 'Rotterdam',
      location: { port: 'Rotterdam Main Terminal' },
    },
  },
];

// Test 1: Genesis Reconstruction
console.log('[1] Genesis State Reconstruction (v1):');
const stateV1 = reconstructStateAtVersion(mockEvents, 1);
assert.strictEqual(stateV1.version, 1, 'Version should be 1');
assert.strictEqual(stateV1.status, 'created', 'Status should be created');
assert.strictEqual(stateV1.origin.port, 'Chennai', 'Origin port should be Chennai');
assert.strictEqual(stateV1.vessel.name, 'MSC Oscar', 'Vessel name should be MSC Oscar');
console.log('    - Genesis aggregate initialization: PASS');

// Test 2: Mid-Stream Scrubber State (v3 - Temperature Spike)
console.log('\n[2] Mid-Stream Time-Travel (v3):');
const stateV3 = reconstructStateAtVersion(mockEvents, 3);
assert.strictEqual(stateV3.version, 3, 'Version should be 3');
assert.strictEqual(stateV3.status, 'in_transit', 'Status should be in_transit');
assert.strictEqual(stateV3.sensorState.temperature, 14.5, 'Temperature should be 14.5');
assert.strictEqual(stateV3.flags.hasTemperatureSpike, true, 'Temperature spike flag should be true');
assert.strictEqual(stateV3.flags.customsHeld, false, 'Customs held should be false at v3');
console.log('    - Mid-stream point-in-time state: PASS');

// Test 3: Final State Reconstruction (v6)
console.log('\n[3] Full Event Replay to Head (v6):');
const stateV6 = reconstructStateAtVersion(mockEvents, 6);
assert.strictEqual(stateV6.version, 6, 'Version should be 6');
assert.strictEqual(stateV6.status, 'arrived', 'Status should be arrived');
assert.strictEqual(stateV6.currentLocation.port, 'Rotterdam Main Terminal', 'Current location should be Rotterdam');
assert.strictEqual(stateV6.flags.customsHeld, false, 'Customs held should be cleared');
console.log('    - Head aggregate state reconstruction: PASS');

// Test 4: State Diff Calculations
console.log('\n[4] State Mutation Diff Calculation:');
const genesisDiff = computeStateDiff(null, stateV1);
assert.strictEqual(genesisDiff.isGenesis, true, 'Should detect genesis event');
console.log('    - Genesis diff detection: PASS');

const diffV2V3 = computeStateDiff(reconstructStateAtVersion(mockEvents, 2), stateV3);
assert.strictEqual(diffV2V3.isGenesis, false, 'Should not be genesis');
const tempChange = diffV2V3.changes.find((c) => c.field === 'Temperature');
assert(tempChange, 'Should contain temperature change');
assert.strictEqual(tempChange.curr, '14.5°C', 'Temperature curr should be 14.5°C');
const spikeAlert = diffV2V3.changes.find((c) => c.field === 'Temperature Spike Alert');
assert(spikeAlert, 'Should contain temperature alert flag');
console.log('    - Mutation delta detection & alert flags: PASS');

// Test 5: Event Theme & Categories
console.log('\n[5] Event Theme & Categories:');
assert.strictEqual(getEventCategory(TEMPERATURE_SPIKE), EVENT_CATEGORIES.ALERT, 'Temp spike should be in ALERT category');
assert.strictEqual(isAlertEvent(TEMPERATURE_SPIKE), true, 'Temp spike should be an alert event');
assert.strictEqual(isAlertEvent(SHIPMENT_CREATED), false, 'Shipment created should not be an alert event');
console.log('    - Category and alert mapping: PASS');

console.log('\n====================================================');
console.log('  ALL TIMELINE ENGINE & REPLAY TESTS PASSED! (5/5)  ');
console.log('====================================================');
