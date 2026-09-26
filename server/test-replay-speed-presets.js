/**
 * Test Suite: Replay Speed Multipliers & Dynamic Interval Calculator
 */
import assert from 'assert';
import {
  REPLAY_SPEED_PRESETS,
  DEFAULT_SPEED,
  getSpeedPreset,
  calculatePlaybackDelay
} from '../client/src/utils/replay-speed-presets.js';

console.log('====================================================');
console.log('       REPLAY SPEED PRESETS & DELAY TEST SUITE      ');
console.log('====================================================\n');

console.log('[1] Speed Presets Configuration:');
assert.strictEqual(REPLAY_SPEED_PRESETS.length, 5);
assert.strictEqual(DEFAULT_SPEED.value, 1.0);
assert.strictEqual(getSpeedPreset(2.0).delayMs, 600);
assert.strictEqual(getSpeedPreset(99.9).value, 1.0); // falls back to default
console.log('    - Preset lookup and default fallback: PASS');

console.log('[2] Uniform Pacing Delay Calculation:');
const delay1x = calculatePlaybackDelay({}, {}, 1.0);
const delay2x = calculatePlaybackDelay({}, {}, 2.0);
const delay05x = calculatePlaybackDelay({}, {}, 0.5);

assert.strictEqual(delay1x, 1200);
assert.strictEqual(delay2x, 600);
assert.strictEqual(delay05x, 2400);
console.log('    - Linear speed scaling: PASS');

console.log('[3] Proportional Timestamp Delay Scaling:');
const ev1 = { timestamp: '2026-09-20T10:00:00.000Z' };
const ev2 = { timestamp: '2026-09-20T14:00:00.000Z' }; // 4 hours delta

const propDelay = calculatePlaybackDelay(ev1, ev2, 1.0, true);
assert.strictEqual(typeof propDelay, 'number');
assert.strictEqual(propDelay >= 100 && propDelay <= 3000, true);
console.log('    - Dynamic logarithmic timestamp delay clamping: PASS');

console.log('\n====================================================');
console.log('    ALL REPLAY SPEED PRESETS TESTS PASSED! (3/3)    ');
console.log('====================================================\n');
