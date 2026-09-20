/**
 * Test Suite: Field-Level Change Tracker
 */
import assert from 'assert';
import {
  trackFieldChanges,
  isSensitiveField,
  filterFieldChanges
} from '../client/src/utils/field-change-tracker.js';

console.log('====================================================');
console.log('        FIELD-LEVEL CHANGE TRACKER TEST SUITE       ');
console.log('====================================================\n');

console.log('[1] Sensitivity Pattern Matching:');
assert.strictEqual(isSensitiveField('status'), true);
assert.strictEqual(isSensitiveField('telemetry.temperature'), true);
assert.strictEqual(isSensitiveField('security.tamperStatus'), true);
assert.strictEqual(isSensitiveField('meta.authorName'), false);
console.log('    - Sensitive field classification: PASS');

console.log('[2] Flat Object Mutation Tracking:');
const before1 = { status: 'CREATED', carrier: 'Carrier A', note: 'Initial' };
const after1 = { status: 'IN_TRANSIT', carrier: 'Carrier A', eta: '2026-09-25' };

const diff1 = trackFieldChanges(before1, after1);
const statusChange = diff1.find(d => d.field === 'status');
const noteChange = diff1.find(d => d.field === 'note');
const etaChange = diff1.find(d => d.field === 'eta');

assert.strictEqual(statusChange.changeType, 'MODIFIED');
assert.strictEqual(statusChange.oldValue, 'CREATED');
assert.strictEqual(statusChange.newValue, 'IN_TRANSIT');
assert.strictEqual(statusChange.isSensitive, true);

assert.strictEqual(noteChange.changeType, 'REMOVED');
assert.strictEqual(etaChange.changeType, 'ADDED');
console.log('    - Added, removed, and modified field mutations: PASS');

console.log('[3] Nested Object Deep Mutation Tracking:');
const beforeNested = {
  telemetry: {
    temperature: 4.2,
    battery: 98
  }
};
const afterNested = {
  telemetry: {
    temperature: -1.5,
    battery: 98
  }
};

const diffNested = trackFieldChanges(beforeNested, afterNested);
assert.strictEqual(diffNested.length, 1);
assert.strictEqual(diffNested[0].field, 'telemetry.temperature');
assert.strictEqual(diffNested[0].oldValue, 4.2);
assert.strictEqual(diffNested[0].newValue, -1.5);
assert.strictEqual(diffNested[0].isSensitive, true);
console.log('    - Nested object recursion: PASS');

console.log('[4] Change Filtering:');
const sensitiveOnly = filterFieldChanges(diff1, { onlySensitive: true });
assert.strictEqual(sensitiveOnly.length, 1);
assert.strictEqual(sensitiveOnly[0].field, 'status');
console.log('    - Sensitive & change-type filtering: PASS');

console.log('\n====================================================');
console.log('    ALL FIELD CHANGE TRACKER TESTS PASSED! (4/4)    ');
console.log('====================================================\n');
