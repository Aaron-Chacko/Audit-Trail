import ShipmentReadModel from '../../models/ShipmentReadModel.js';
import { getEventsForAggregate } from './event-store-service.js';
import { reduceShipmentEvents } from './shipment-reducer.js';

// Rebuilds the read model for one shipment from its full event history
export async function projectShipment(aggregateId) {
  const events = await getEventsForAggregate(aggregateId);
  if (events.length === 0) return null;

  const state = reduceShipmentEvents(events);

  return ShipmentReadModel.findOneAndUpdate(
    { aggregateId },
    { ...state, projectedAt: new Date() },
    { upsert: true, new: true }
  );
}