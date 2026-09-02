import Event from '../../models/Event.js';

// Fetch all events for one shipment, in order
export async function getEventsForAggregate(aggregateId) {
  return Event.find({ aggregateId }).sort({ version: 1 }).lean();
}

// Fetch only events up to a given timestamp (for historical/time-travel queries)
export async function getEventsUpTo(aggregateId, timestamp) {
  return Event.find({
    aggregateId,
    timestamp: { $lte: new Date(timestamp) },
  }).sort({ version: 1 }).lean();
}