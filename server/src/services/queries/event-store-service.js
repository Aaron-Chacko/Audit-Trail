import Event from '../../models/Event.js';
import Snapshot from '../../models/Snapshot.js';
import {
  getLatestSnapshot,
  getSnapshotAtVersion,
  getSnapshotAtTimestamp,
  getAcceleratedStream,
  verifySnapshotIntegrity,
} from '../commands/snapshot-service.js';

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

export async function getEventsByCorrelationId(correlationId, options = {}) {
  return Event.findByCorrelationId(correlationId, options);
}

export async function getEventsByTriggeredBy(triggeredBy, options = {}) {
  return Event.findByTriggeredBy(triggeredBy, options);
}

import { eventStoreMetrics } from '../../utils/event-store-metrics.js';

export function getEventStoreMetrics() {
  return eventStoreMetrics.getSummary();
}

export {
  getLatestSnapshot,
  getSnapshotAtVersion,
  getSnapshotAtTimestamp,
  getAcceleratedStream,
  verifySnapshotIntegrity,
};

