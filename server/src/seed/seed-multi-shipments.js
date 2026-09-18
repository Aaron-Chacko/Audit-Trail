import mongoose from 'mongoose';
import Event from '../models/Event.js';
import {
  SHIPMENT_CREATED,
  CONTAINER_LOADED,
  SHIPMENT_DEPARTED,
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  CUSTOMS_HELD,
  CUSTOMS_CLEARED,
  ARRIVED_AT_PORT,
  CONTAINER_UNLOADED,
} from '../events/event-types.js';
import { projectShipment } from '../services/queries/projection-service.js';
import { connectDB } from '../config/db.js';

const shipments = [
  {
    id: 'SHIP-10042',
    events: [
      {
        eventType: SHIPMENT_CREATED,
        version: 1,
        timestamp: new Date('2026-08-20T08:00:00Z'),
        payload: {
          origin: { port: 'Port of Chennai', country: 'India' },
          destination: { port: 'Port of Rotterdam', country: 'Netherlands' },
          cargo: { description: 'Pharmaceutical Vaccines', weightKg: 12500, hazardous: false },
          vessel: { name: 'MSC Oscar', imo: '9703291' },
        },
      },
      {
        eventType: CONTAINER_LOADED,
        version: 2,
        timestamp: new Date('2026-08-20T14:30:00Z'),
        payload: { port: 'Port of Chennai', vesselName: 'MSC Oscar' },
      },
      {
        eventType: SHIPMENT_DEPARTED,
        version: 3,
        timestamp: new Date('2026-08-21T06:00:00Z'),
        payload: { location: { port: 'Bay of Bengal Transit Zone' } },
      },
      {
        eventType: TEMPERATURE_SPIKE,
        version: 4,
        timestamp: new Date('2026-08-23T11:15:00Z'),
        payload: { temperature: 14.8, threshold: 8.0, durationMins: 45 },
      },
      {
        eventType: ARRIVED_AT_PORT,
        version: 5,
        timestamp: new Date('2026-08-28T16:00:00Z'),
        payload: { port: 'Port of Rotterdam', location: { port: 'Rotterdam Gateway Terminal' } },
      },
      {
        eventType: CONTAINER_UNLOADED,
        version: 6,
        timestamp: new Date('2026-08-29T09:30:00Z'),
        payload: { location: { port: 'Rotterdam Cold Storage Unit B' } },
      },
    ],
  },
  {
    id: 'SHIP-10043',
    events: [
      {
        eventType: SHIPMENT_CREATED,
        version: 1,
        timestamp: new Date('2026-08-22T09:00:00Z'),
        payload: {
          origin: { port: 'Port of Singapore', country: 'Singapore' },
          destination: { port: 'Port of Los Angeles', country: 'USA' },
          cargo: { description: 'Precision Electronics', weightKg: 24000, hazardous: false },
          vessel: { name: 'Ever Given', imo: '9811000' },
        },
      },
      {
        eventType: SHIPMENT_DEPARTED,
        version: 2,
        timestamp: new Date('2026-08-23T04:00:00Z'),
        payload: { location: { port: 'Pacific Route East' } },
      },
      {
        eventType: HUMIDITY_ALERT,
        version: 3,
        timestamp: new Date('2026-08-26T18:00:00Z'),
        payload: { humidity: 88, threshold: 70 },
      },
      {
        eventType: ARRIVED_AT_PORT,
        version: 4,
        timestamp: new Date('2026-09-02T12:00:00Z'),
        payload: { port: 'Port of Los Angeles' },
      },
      {
        eventType: CUSTOMS_HELD,
        version: 5,
        timestamp: new Date('2026-09-02T15:00:00Z'),
        payload: { reason: 'Documentation inspection hold' },
      },
      {
        eventType: CUSTOMS_CLEARED,
        version: 6,
        timestamp: new Date('2026-09-04T10:00:00Z'),
        payload: { clearanceCode: 'US-CBP-88192' },
      },
    ],
  },
  {
    id: 'SHIP-10044',
    events: [
      {
        eventType: SHIPMENT_CREATED,
        version: 1,
        timestamp: new Date('2026-08-25T10:00:00Z'),
        payload: {
          origin: { port: 'Port of Mumbai', country: 'India' },
          destination: { port: 'Port of Hamburg', country: 'Germany' },
          cargo: { description: 'Organic Spices & Tea', weightKg: 18000, hazardous: false },
          vessel: { name: 'CMA CGM Antoine de Saint Exupery', imo: '9776418' },
        },
      },
      {
        eventType: SHIPMENT_DEPARTED,
        version: 2,
        timestamp: new Date('2026-08-26T12:00:00Z'),
        payload: { location: { port: 'Arabian Sea Transit' } },
      },
    ],
  },
];

async function seedAll() {
  await connectDB();
  console.log('Seeding demo audit trail ledger shipments...\n');

  for (const item of shipments) {
    const aggregateId = item.id;
    await mongoose.connection.db.collection('events').deleteMany({ aggregateId });

    const formattedEvents = item.events.map((e) => ({
      aggregateId,
      eventType: e.eventType,
      payload: e.payload,
      timestamp: e.timestamp,
      version: e.version,
      metadata: {
        correlationId: `corr-seed-${aggregateId}`,
        triggeredBy: 'system:demo-seeder',
      },
    }));

    await Event.insertMany(formattedEvents);
    console.log(`✓ Seeded ${formattedEvents.length} events for aggregate ${aggregateId}`);

    const projected = await projectShipment(aggregateId);
    console.log(`  ➔ Projected read model status: ${projected.status}`);
  }

  console.log('\nAll demo shipments seeded and projected successfully!');
  await mongoose.connection.close();
}

seedAll().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
