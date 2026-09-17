import mongoose from 'mongoose';
import Event from '../models/Event.js';
import { CONTAINER_CREATED, LOADED_ON_SHIP, TEMPERATURE_SPIKE, ARRIVED_AT_PORT } from '../events/event-types.js';
import { projectShipment } from '../services/queries/projection-service.js';
import { connectDB } from '../config/db.js';

async function seed() {
  await connectDB();

  const aggregateId = 'SHIP-TEST-001';
  // NOTE: Use native driver directly to bypass the Mongoose pre-hook immutability
  // guard on the Event model. deleteMany on the model would throw ImmutabilityViolation.
  // This is ONLY acceptable in a dev seed script — never do this in application code.
  await mongoose.connection.db.collection('events').deleteMany({ aggregateId });

  const events = [
    {
      aggregateId,
      eventType: CONTAINER_CREATED,
      payload: { destination: 'Rotterdam' },
      timestamp: new Date('2026-08-01T08:00:00Z'),
      version: 1,
    },
    {
      aggregateId,
      eventType: LOADED_ON_SHIP,
      payload: {},
      timestamp: new Date('2026-08-02T10:00:00Z'),
      version: 2,
    },
    {
      aggregateId,
      eventType: TEMPERATURE_SPIKE,
      payload: { temperature: 8.5 },
      timestamp: new Date('2026-08-03T14:00:00Z'),
      version: 3,
    },
    {
      aggregateId,
      eventType: ARRIVED_AT_PORT,
      payload: {},
      timestamp: new Date('2026-08-05T09:00:00Z'),
      version: 4,
    },
  ];

  await Event.insertMany(events);
  console.log(`Seeded ${events.length} events for ${aggregateId}`);

  const projected = await projectShipment(aggregateId);
  console.log('Projected read model:', projected);

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});