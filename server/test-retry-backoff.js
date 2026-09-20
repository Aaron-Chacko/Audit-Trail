/**
 * test-retry-backoff.js
 * Unit tests for the exponential backoff retry utility.
 *
 * Run with: node server/test-retry-backoff.js
 */

import { withRetry, computeDelay } from './src/utils/retry-backoff.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`    ✓ ${label}`);
    passed++;
  } else {
    console.error(`    ✗ ${label}`);
    failed++;
  }
}

console.log('====================================================');
console.log('       RETRY BACKOFF UTILITY TEST SUITE             ');
console.log('====================================================\n');

// ── Test 1: computeDelay increases with attempt ───────────────────────────────
console.log('[1] Exponential Delay Growth:');
{
  const d0 = computeDelay(0, { baseDelayMs: 100, multiplier: 2, maxDelayMs: 5000, jitter: false });
  const d1 = computeDelay(1, { baseDelayMs: 100, multiplier: 2, maxDelayMs: 5000, jitter: false });
  const d2 = computeDelay(2, { baseDelayMs: 100, multiplier: 2, maxDelayMs: 5000, jitter: false });
  assert(d0 === 100, `attempt 0 → 100ms (got ${d0})`);
  assert(d1 === 200, `attempt 1 → 200ms (got ${d1})`);
  assert(d2 === 400, `attempt 2 → 400ms (got ${d2})`);
}

// ── Test 2: maxDelayMs cap is respected ──────────────────────────────────────
console.log('\n[2] Max Delay Cap:');
{
  const d = computeDelay(10, { baseDelayMs: 100, multiplier: 2, maxDelayMs: 500, jitter: false });
  assert(d <= 500, `delay capped at 500ms (got ${d})`);
}

// ── Test 3: Successful fn resolves on first try ───────────────────────────────
console.log('\n[3] Resolves on First Attempt:');
{
  let attempts = 0;
  const result = await withRetry(async () => {
    attempts++;
    return 'ok';
  });
  assert(result === 'ok', `resolved with 'ok'`);
  assert(attempts === 1, `called exactly once (got ${attempts})`);
}

// ── Test 4: Retries on transient failure then succeeds ────────────────────────
console.log('\n[4] Retries on Transient Failure:');
{
  let attempts = 0;
  const result = await withRetry(async () => {
    attempts++;
    if (attempts < 3) throw new Error('transient');
    return 'recovered';
  }, () => true, { maxAttempts: 5, baseDelayMs: 1, multiplier: 1, jitter: false });

  assert(result === 'recovered', `resolved after retries (got '${result}')`);
  assert(attempts === 3, `took exactly 3 attempts (got ${attempts})`);
}

// ── Test 5: Non-retryable error throws immediately ────────────────────────────
console.log('\n[5] Non-Retryable Error Throws Immediately:');
{
  let attempts = 0;
  try {
    await withRetry(async () => {
      attempts++;
      throw new Error('fatal');
    }, () => false, { maxAttempts: 5, baseDelayMs: 1, jitter: false });
    assert(false, 'should have thrown');
  } catch (e) {
    assert(e.message === 'fatal', `correct error message (got '${e.message}')`);
    assert(attempts === 1, `stopped after 1 attempt (got ${attempts})`);
  }
}

// ── Test 6: Exhausts attempts and re-throws last error ────────────────────────
console.log('\n[6] Exhausts All Attempts:');
{
  let attempts = 0;
  try {
    await withRetry(async () => {
      attempts++;
      throw new Error(`fail-${attempts}`);
    }, () => true, { maxAttempts: 3, baseDelayMs: 1, multiplier: 1, jitter: false });
    assert(false, 'should have thrown');
  } catch (e) {
    assert(e.message === 'fail-3', `last error propagated (got '${e.message}')`);
    assert(attempts === 3, `attempted exactly 3 times (got ${attempts})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n====================================================');
if (failed === 0) {
  console.log(`  ALL RETRY BACKOFF TESTS PASSED! (${passed}/${passed + failed})`);
} else {
  console.log(`  TESTS COMPLETED: ${passed} passed, ${failed} FAILED`);
}
console.log('====================================================\n');
