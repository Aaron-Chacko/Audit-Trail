import { summarizeShipments } from './shipment-summary.js';

function assertEqual(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${label}`);
  if (!pass) {
    console.log('  expected:', expected);
    console.log('  actual:  ', actual);
  }
}

const shipments = [
  { status: 'ARRIVED_AT_PORT', flags: { hasTemperatureSpike: true, customsHeld: false } },
  { status: 'LOADED_ON_SHIP', flags: { hasTemperatureSpike: false, customsHeld: true } },
  { status: 'ARRIVED_AT_PORT', flags: { hasTemperatureSpike: false, customsHeld: false } },
  { status: 'CREATED', flags: { hasTemperatureSpike: false, customsHeld: false } },
];

const summary = summarizeShipments(shipments);

assertEqual(summary.total, 4, 'counts total shipments correctly');
assertEqual(summary.byStatus.ARRIVED_AT_PORT, 2, 'groups by status correctly');
assertEqual(summary.byStatus.LOADED_ON_SHIP, 1, 'counts single-status entries');
assertEqual(summary.activeTemperatureAlerts, 1, 'counts temperature alerts correctly');
assertEqual(summary.activeCustomsHolds, 1, 'counts customs holds correctly');

const empty = summarizeShipments([]);
assertEqual(empty.total, 0, 'handles empty list');
assertEqual(empty.byStatus, {}, 'empty list has no status groups');

console.log('\nDone.');