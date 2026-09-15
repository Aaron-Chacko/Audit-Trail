import ShipmentReadModel from '../../models/ShipmentReadModel.js';
import { getEventsForAggregate } from './event-store-service.js';
import { reduceShipmentEvents } from './shipment-reducer.js';
import { validateEventSequence } from './transition-validator.js';

export async function projectShipment(aggregateId) {
  const events = await getEventsForAggregate(aggregateId);
  if (events.length === 0) return null;

  const { valid, errors } = validateEventSequence(events);
  if (!valid) {
    console.error(`Invalid event sequence for ${aggregateId}:`, errors);
    // Still project the state, but flag it so it's visible instead of silently wrong
  }

  const state = reduceShipmentEvents(events);

  return ShipmentReadModel.findOneAndUpdate(
    { aggregateId },
    { ...state, projectedAt: new Date(), sequenceValid: valid },
    { upsert: true, new: true }
  );
}