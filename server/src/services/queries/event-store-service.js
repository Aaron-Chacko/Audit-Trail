import Event from '../../models/Event.js';

export async function getEventsForAggregate(aggregateId, options = { sort: 1 }) {
  return Event.findByAggregateId(aggregateId, options);
}

export async function getEventsUpTo(aggregateId, timestamp) {
  return Event.getEventsUntilTimestamp(aggregateId, timestamp);
}

export async function getEventStreamSlice(aggregateId, options = {}) {
  return Event.getEventStreamSlice(aggregateId, options);
}

export async function getEventsInTimeRange(aggregateId, options = {}) {
  return Event.getEventsInTimeRange(aggregateId, options);
}

export async function getEventsByTypes(aggregateId, eventTypes, options = {}) {
  return Event.getEventsByTypes(aggregateId, eventTypes, options);
}

export async function getGlobalStream(options = {}) {
  return Event.getGlobalStream(options);
}