/**
 * event-validator.test.js
 *
 * Unit tests for the pure event payload validator.
 * No MongoDB or Express required — runs directly with Node ESM.
 *
 * Run:  node server/test-event-validator.js
 */

import assert from 'node:assert/strict';
import { validateEvent, assertValidEvent } from './src/utils/event-validator.js';

console.log('\n====================================================');
console.log('       EVENT PAYLOAD VALIDATOR — UNIT TESTS         ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    → ${err.message}`);
    failed++;
  }
}

// ── Valid event fixture ───────────────────────────────────────────────────────

const VALID_EVENT = {
  aggregateId: 'SHIP-001',
  eventType: 'SHIPMENT_CREATED',
  payload: { origin: 'Mumbai', destination: 'Dubai' },
  version: 1,
  timestamp: new Date(Date.now() - 1000).toISOString(),
};

// ── [1] Valid event ────────────────────────────────────────────────────────────

console.log('[1] Valid event passes all checks');

test('valid event is accepted', () => {
  const { isValid, errors } = validateEvent(VALID_EVENT);
  assert.equal(isValid, true, `Expected valid, got errors: ${errors.join(', ')}`);
  assert.equal(errors.length, 0);
});

// ── [2] aggregateId validation ────────────────────────────────────────────────

console.log('\n[2] aggregateId validation');

test('missing aggregateId is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, aggregateId: undefined });
  assert.equal(isValid, false);
});

test('blank aggregateId is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, aggregateId: '   ' });
  assert.equal(isValid, false);
});

test('aggregateId exceeding max length is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, aggregateId: 'A'.repeat(129) });
  assert.equal(isValid, false);
});

// ── [3] eventType validation ──────────────────────────────────────────────────

console.log('\n[3] eventType validation');

test('missing eventType is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, eventType: undefined });
  assert.equal(isValid, false);
});

test('unknown eventType is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, eventType: 'TOTALLY_FAKE_EVENT' });
  assert.equal(isValid, false);
});

// ── [4] version validation ────────────────────────────────────────────────────

console.log('\n[4] version validation');

test('version 0 is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, version: 0 });
  assert.equal(isValid, false);
});

test('float version is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, version: 1.5 });
  assert.equal(isValid, false);
});

test('string version is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, version: '1' });
  assert.equal(isValid, false);
});

// ── [5] timestamp validation ──────────────────────────────────────────────────

console.log('\n[5] timestamp validation');

test('missing timestamp is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, timestamp: undefined });
  assert.equal(isValid, false);
});

test('invalid date string is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, timestamp: 'not-a-date' });
  assert.equal(isValid, false);
});

test('future timestamp is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, timestamp: new Date(Date.now() + 60_000).toISOString() });
  assert.equal(isValid, false);
});

// ── [6] payload validation ────────────────────────────────────────────────────

console.log('\n[6] payload validation');

test('null payload is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, payload: null });
  assert.equal(isValid, false);
});

test('array payload is rejected', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, payload: [1, 2, 3] });
  assert.equal(isValid, false);
});

test('empty object payload is accepted', () => {
  const { isValid } = validateEvent({ ...VALID_EVENT, payload: {} });
  assert.equal(isValid, true);
});

// ── [7] assertValidEvent ──────────────────────────────────────────────────────

console.log('\n[7] assertValidEvent throws on invalid input');

test('assertValidEvent throws for missing eventType', () => {
  assert.throws(() => assertValidEvent({ ...VALID_EVENT, eventType: undefined }), /invalid/i);
});

test('assertValidEvent does not throw for valid event', () => {
  assert.doesNotThrow(() => assertValidEvent(VALID_EVENT));
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n====================================================');
if (failed === 0) {
  console.log(`  ALL EVENT VALIDATOR TESTS PASSED! (${passed}/${passed + failed})`);
} else {
  console.log(`  RESULT: ${passed} passed, ${failed} FAILED`);
  process.exit(1);
}
console.log('====================================================\n');
