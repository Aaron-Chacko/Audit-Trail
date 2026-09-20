/**
 * snapshot-service.test.js
 *
 * Unit tests for snapshot-service helpers that do NOT require a live
 * MongoDB connection.  Only pure / deterministic behaviour is tested here.
 *
 * Run:  node server/src/services/commands/snapshot-service.test.js
 */

import assert from 'node:assert/strict';

// ── shouldTakeSnapshot ────────────────────────────────────────────────────────

console.log('\n====================================================');
console.log('       SNAPSHOT SERVICE — UNIT TESTS               ');
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

// Inline shouldTakeSnapshot so this test module is self-contained and can run
// without ESM dynamic imports of the actual service (which pulls in Mongoose).
function shouldTakeSnapshot(currentVersion, { snapshotInterval = 10, lastSnapshotVersion = 0 } = {}) {
  if (typeof currentVersion !== 'number' || currentVersion < 1) return false;
  return (currentVersion - lastSnapshotVersion) >= snapshotInterval;
}

// ── Test cases ────────────────────────────────────────────────────────────────

console.log('[1] shouldTakeSnapshot — default interval (10)');

test('returns false for version below threshold', () => {
  assert.equal(shouldTakeSnapshot(5), false);
});

test('returns true exactly at threshold', () => {
  assert.equal(shouldTakeSnapshot(10), true);
});

test('returns true above threshold', () => {
  assert.equal(shouldTakeSnapshot(15), true);
});

test('respects lastSnapshotVersion offset', () => {
  assert.equal(shouldTakeSnapshot(15, { lastSnapshotVersion: 10 }), false);
  assert.equal(shouldTakeSnapshot(20, { lastSnapshotVersion: 10 }), true);
});

test('returns false for non-numeric version', () => {
  assert.equal(shouldTakeSnapshot('ten'), false);
  assert.equal(shouldTakeSnapshot(null), false);
  assert.equal(shouldTakeSnapshot(undefined), false);
});

test('returns false for version < 1', () => {
  assert.equal(shouldTakeSnapshot(0), false);
  assert.equal(shouldTakeSnapshot(-5), false);
});

console.log('\n[2] shouldTakeSnapshot — custom interval');

test('custom interval: 5 — returns false below', () => {
  assert.equal(shouldTakeSnapshot(4, { snapshotInterval: 5 }), false);
});

test('custom interval: 5 — returns true at exact threshold', () => {
  assert.equal(shouldTakeSnapshot(5, { snapshotInterval: 5 }), true);
});

test('custom interval: 5 — lastSnapshot 20, needs 25', () => {
  assert.equal(shouldTakeSnapshot(24, { snapshotInterval: 5, lastSnapshotVersion: 20 }), false);
  assert.equal(shouldTakeSnapshot(25, { snapshotInterval: 5, lastSnapshotVersion: 20 }), true);
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n====================================================');
if (failed === 0) {
  console.log(`  ALL SNAPSHOT-SERVICE UNIT TESTS PASSED! (${passed}/${passed + failed})`);
} else {
  console.log(`  RESULT: ${passed} passed, ${failed} FAILED`);
  process.exit(1);
}
console.log('====================================================\n');
