import ShipmentReadModel from '../../models/ShipmentReadModel.js';
import { getEventsForAggregate, getEventsUpTo } from './event-store-service.js';
import { reduceShipmentEventsUpTo } from './shipment-reducer.js';

export async function getCurrentState(aggregateId) {
  return ShipmentReadModel.findOne({ aggregateId }).lean();
}

export async function getEventTimeline(aggregateId) {
  return getEventsForAggregate(aggregateId);
}

export async function getHistoricalState(aggregateId, timestamp) {
  const events = await getEventsUpTo(aggregateId, timestamp);
  if (events.length === 0) return null;
  return reduceShipmentEventsUpTo(events, timestamp);
}

export async function listShipments() {
  return ShipmentReadModel.find().lean();
}