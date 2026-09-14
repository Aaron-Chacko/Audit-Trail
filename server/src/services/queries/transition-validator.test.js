import { validateEventSequence } from './transition-validator.js';
import { CONTAINER_CREATED, LOADED_ON_SHIP, TEMPERATURE_SPIKE, ARRIVED_AT_PORT } from '../../events/event-types.js';

function assertEqual(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${label}`);
  if (!pass) {
    console.log('  expected:', expected);
    console.log('  actual:  ', actual);
  }
}

const validSequence = [
  { eventType: CONTAINER_CREATED, version: 1 },
  { eventType: LOADED_ON_SHIP, version: 2 },
  { eventType: TEMPERATURE_SPIKE, version: 3 },
  { eventType: ARRIVED_AT_PORT, version: 4 },
];
assertEqual(validateEventSequence(validSequence).valid, true, 'accepts a valid full sequence');

const skippedStep = [
  { eventType: CONTAINER_CREATED, version: 1 },
  { eventType: ARRIVED_AT_PORT, version: 2 },
];
const skippedResult = validateEventSequence(skippedStep);
assertEqual(skippedResult.valid, false, 'rejects skipping LOADED_ON_SHIP');
assertEqual(skippedResult.errors.length, 1, 'reports exactly one error for skipped step');

const wrongFirst = [{ eventType: LOADED_ON_SHIP, version: 1 }];
assertEqual(validateEventSequence(wrongFirst).valid, false, 'rejects sequence not starting with CONTAINER_CREATED');

const afterTerminal = [
  { eventType: CONTAINER_CREATED, version: 1 },
  { eventType: LOADED_ON_SHIP, version: 2 },
  { eventType: ARRIVED_AT_PORT, version: 3 },
  { eventType: LOADED_ON_SHIP, version: 4 },
];
assertEqual(validateEventSequence(afterTerminal).valid, false, 'rejects any event after terminal ARRIVED_AT_PORT');

const emptySequence = validateEventSequence([]);
assertEqual(emptySequence.valid, true, 'empty sequence is trivially valid');

console.log('\nDone.');