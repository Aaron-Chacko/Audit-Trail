import { isValidAggregateId, isValidTimestamp, validateHistoricalStateQuery } from './query-validators.js';

function assertEqual(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${label}`);
  if (!pass) {
    console.log('  expected:', expected);
    console.log('  actual:  ', actual);
  }
}

assertEqual(isValidAggregateId('SHIP-001'), true, 'valid aggregateId string');
assertEqual(isValidAggregateId(''), false, 'empty string is invalid');
assertEqual(isValidAggregateId(null), false, 'null is invalid');
assertEqual(isValidAggregateId(undefined), false, 'undefined is invalid');

assertEqual(isValidTimestamp('2026-08-01T08:00:00Z'), true, 'valid ISO timestamp');
assertEqual(isValidTimestamp('not-a-date'), false, 'garbage string is invalid');
assertEqual(isValidTimestamp(''), false, 'empty timestamp is invalid');
assertEqual(isValidTimestamp(undefined), false, 'undefined timestamp is invalid');

const validResult = validateHistoricalStateQuery('SHIP-001', '2026-08-01T08:00:00Z');
assertEqual(validResult.valid, true, 'combined validation passes for good input');

const invalidResult = validateHistoricalStateQuery('', 'garbage');
assertEqual(invalidResult.valid, false, 'combined validation fails for bad input');
assertEqual(invalidResult.errors.length, 2, 'combined validation reports both errors');

console.log('\nDone.');