import { reduceShipmentEvents, reduceShipmentEventsUpTo } from './shipment-reducer.js';
import { CONTAINER_CREATED, LOADED_ON_SHIP, TEMPERATURE_SPIKE, ARRIVED_AT_PORT } from '../../events/event-types.js';

const aggregateId = 'SHIP-TEST-001';

const events = [
  { aggregateId, eventType: CONTAINER_CREATED, payload: { destination: 'Rotterdam' }, timestamp: '2026-08-01T08:00:00Z', version: 1 },
  { aggregateId, eventType: LOADED_ON_SHIP, payload: {}, timestamp: '2026-08-02T10:00:00Z', version: 2 },
  { aggregateId, eventType: TEMPERATURE_SPIKE, payload: { temperature: 8.5 }, timestamp: '2026-08-03T14:00:00Z', version: 3 },
  { aggregateId, eventType: ARRIVED_AT_PORT, payload: {}, timestamp: '2026-08-05T09:00:00Z', version: 4 },
];

function assertEqual(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${label}`);
  if (!pass) {
    console.log('  expected:', expected);
    console.log('  actual:  ', actual);
  }
}

// Test 1: full replay should reach final state
const finalState = reduceShipmentEvents(events);
assertEqual(finalState.status, 'ARRIVED_AT_PORT', 'full replay reaches ARRIVED_AT_PORT status');
assertEqual(finalState.flags.hasTemperatureSpike, true, 'full replay flags temperature spike');
assertEqual(finalState.lastEventVersion, 4, 'full replay tracks correct last version');

// Test 2: partial replay (state as of a mid-point timestamp)
const midState = reduceShipmentEventsUpTo(events, '2026-08-02T12:00:00Z');
assertEqual(midState.status, 'LOADED_ON_SHIP', 'historical replay stops at correct status');
assertEqual(midState.flags.hasTemperatureSpike, false, 'historical replay excludes future temperature spike');

// Test 3: empty events array
const emptyState = reduceShipmentEvents([]);
assertEqual(emptyState, null, 'empty event list returns null state');

console.log('\nDone.');