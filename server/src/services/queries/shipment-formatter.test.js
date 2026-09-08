import { formatShipmentResponse, formatShipmentList } from './shipment-formatter.js';

function assertEqual(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${label}`);
  if (!pass) {
    console.log('  expected:', expected);
    console.log('  actual:  ', actual);
  }
}

const rawShipment = {
  _id: '507f1f77bcf86cd799439011',
  __v: 0,
  aggregateId: 'SHIP-001',
  status: 'ARRIVED_AT_PORT',
  destination: 'Rotterdam',
  temperature: 8.5,
  flags: { hasTemperatureSpike: true, customsHeld: false },
  lastEventVersion: 4,
  eventHistory: [
    { eventType: 'CONTAINER_CREATED', timestamp: '2026-08-01T08:00:00Z', version: 1 },
  ],
  projectedAt: '2026-08-05T09:00:01Z',
};

const formatted = formatShipmentResponse(rawShipment);

assertEqual(formatted.id, 'SHIP-001', 'maps aggregateId to id');
assertEqual(formatted._id, undefined, 'strips internal _id field');
assertEqual(formatted.__v, undefined, 'strips internal __v field');
assertEqual(formatted.projectedAt, undefined, 'strips internal projectedAt field');
assertEqual(formatted.flags.hasTemperatureSpike, true, 'preserves flags correctly');
assertEqual(formatted.eventHistory.length, 1, 'formats event history array');

assertEqual(formatShipmentResponse(null), null, 'null input returns null');

const list = formatShipmentList([rawShipment, rawShipment]);
assertEqual(list.length, 2, 'formats a list of shipments');
assertEqual(list[0].id, 'SHIP-001', 'list items are properly formatted');

console.log('\nDone.');