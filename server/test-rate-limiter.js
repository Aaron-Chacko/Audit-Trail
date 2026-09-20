/**
 * rate-limiter.test.js
 *
 * Unit tests for the in-memory sliding-window rate limiter.
 * No network required — pure in-process logic.
 *
 * Run:  node server/test-rate-limiter.js
 */

import assert from 'node:assert/strict';
import { checkRateLimit, resetRateLimit, evictExpired } from './src/utils/rate-limiter.js';

console.log('\n====================================================');
console.log('       RATE LIMITER — UNIT TESTS                    ');
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

// ── [1] Basic allowance ───────────────────────────────────────────────────────

console.log('[1] Basic allowance within limit');

test('first hit is allowed', () => {
  const result = checkRateLimit('test-basic', { windowMs: 60_000, maxHits: 5, prefix: 't1' });
  assert.equal(result.allowed, true);
  assert.equal(result.totalHits, 1);
  assert.equal(result.remaining, 4);
});

test('hits up to maxHits are allowed', () => {
  for (let i = 2; i <= 5; i++) {
    const result = checkRateLimit('test-basic', { windowMs: 60_000, maxHits: 5, prefix: 't1' });
    assert.equal(result.allowed, true, `Hit ${i} should be allowed`);
  }
});

test('hit beyond maxHits is rejected', () => {
  const result = checkRateLimit('test-basic', { windowMs: 60_000, maxHits: 5, prefix: 't1' });
  assert.equal(result.allowed, false);
  assert.equal(result.remaining, 0);
});

// ── [2] Key isolation ─────────────────────────────────────────────────────────

console.log('\n[2] Key isolation');

test('different keys do not share hit counts', () => {
  const a = checkRateLimit('user-A', { windowMs: 60_000, maxHits: 3, prefix: 't2' });
  const b = checkRateLimit('user-B', { windowMs: 60_000, maxHits: 3, prefix: 't2' });
  assert.equal(a.totalHits, 1);
  assert.equal(b.totalHits, 1);
});

// ── [3] resetRateLimit ────────────────────────────────────────────────────────

console.log('\n[3] resetRateLimit clears counter');

test('after reset, counter starts from zero again', () => {
  // Exhaust the limit
  for (let i = 0; i < 5; i++) {
    checkRateLimit('reset-test', { windowMs: 60_000, maxHits: 5, prefix: 't3' });
  }
  const beforeReset = checkRateLimit('reset-test', { windowMs: 60_000, maxHits: 5, prefix: 't3' });
  assert.equal(beforeReset.allowed, false);

  resetRateLimit('reset-test', 't3');

  const afterReset = checkRateLimit('reset-test', { windowMs: 60_000, maxHits: 5, prefix: 't3' });
  assert.equal(afterReset.allowed, true);
  assert.equal(afterReset.totalHits, 1);
});

// ── [4] evictExpired ──────────────────────────────────────────────────────────

console.log('\n[4] evictExpired removes stale entries');

test('evictExpired returns non-negative eviction count', () => {
  checkRateLimit('evict-me', { windowMs: 60_000, maxHits: 10, prefix: 't4' });
  const evicted = evictExpired(0); // maxAgeMs=0 means "evict everything"
  assert.ok(typeof evicted === 'number' && evicted >= 0);
});

// ── [5] resetAfterMs is positive ─────────────────────────────────────────────

console.log('\n[5] resetAfterMs is always a positive number');

test('resetAfterMs > 0 on a fresh key', () => {
  const result = checkRateLimit('fresh-key-xyz', { windowMs: 10_000, maxHits: 10, prefix: 't5' });
  assert.ok(result.resetAfterMs > 0, `Expected resetAfterMs > 0, got ${result.resetAfterMs}`);
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n====================================================');
if (failed === 0) {
  console.log(`  ALL RATE LIMITER TESTS PASSED! (${passed}/${passed + failed})`);
} else {
  console.log(`  RESULT: ${passed} passed, ${failed} FAILED`);
  process.exit(1);
}
console.log('====================================================\n');
