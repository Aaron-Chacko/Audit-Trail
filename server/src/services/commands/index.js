export {
  appendEvent,
  appendEventsBatch,
  appendWithRetry,
  appendEventWithContext,
  checkConcurrency,
  getEventsForAggregate,
  getAggregateVersion,
  getEventStreamSlice,
  getEventsInTimeRange,
  getEventsByTypes,
  getGlobalStream,
  getStreamStats,
  verifyStreamIntegrity,
  getEventStoreHealth,
  getEventsByCorrelationId,
  getEventsByTriggeredBy,
  getEventStoreMetrics,
  resetEventStoreMetrics,
  saveSnapshot,
  shouldTakeSnapshot,
  getLatestSnapshot,
  getSnapshotAtVersion,
  getSnapshotAtTimestamp,
  getAcceleratedStream,
  verifySnapshotIntegrity,
} from './event-store-service.js';

export {
  compactStream,
  CRITICAL_LIFECYCLE_EVENTS,
} from '../../utils/stream-compactor.js';

export {
  encryptPayloadFields,
  decryptPayloadFields,
  encryptValue,
  decryptValue,
} from '../../utils/payload-encryptor.js';

export { eventBus } from '../../events/event-subscription-bus.js';
