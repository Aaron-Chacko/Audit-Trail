import { sortShipments, paginate } from './query-helpers.js';

function assertEqual(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${label}`);
  if (!pass) {
    console.log('  expected:', expected);
    console.log('  actual:  ', actual);
  }
}

const shipments = [
  { aggregateId: 'A', lastEventVersion: 2 },
  { aggregateId: 'B', lastEventVersion: 5 },
  { aggregateId: 'C', lastEventVersion: 1 },
];

const sortedDesc = sortShipments(shipments);
assertEqual(sortedDesc[0].aggregateId, 'B', 'default sort (desc by lastEventVersion) puts highest first');

const sortedAsc = sortShipments(shipments, 'lastEventVersion', 'asc');
assertEqual(sortedAsc[0].aggregateId, 'C', 'asc sort puts lowest first');

const page1 = paginate(shipments, 1, 2);
assertEqual(page1.data.length, 2, 'paginate returns correct page size');
assertEqual(page1.totalPages, 2, 'paginate calculates total pages correctly');

const page2 = paginate(shipments, 2, 2);
assertEqual(page2.data.length, 1, 'paginate returns remainder on last page');

console.log('\nDone.');