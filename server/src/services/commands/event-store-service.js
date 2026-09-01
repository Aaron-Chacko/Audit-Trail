/**
 * services/commands/event-store-service.js
 *
 * Core service for interacting with the append-only Event Store.
 *
 * Architecture & Concurrency Rules:
 *  1. Append-Only: All domain state changes must result in a new Event record.
 *  2. Optimistic Concurrency Control (OCC): Every append must verify that the
 *     aggregate's current version matches the expectedVersion provided by the caller.
 *  3. In case of version divergence or database race conditions (E11000),
 *     a ConcurrencyError is thrown to trigger an HTTP 409 Conflict.
 */

import Event from '../../models/Event.js';
import { isValidEventType } from '../../events/event-types.js';
import { ConcurrencyError } from '../../utils/app-errors.js';

/**
 * Appends a new domain event to the Event Store for a given aggregate.
 *
 * @param {Object} params
 * @param {string} params.aggregateId - Unique identifier of the domain aggregate (e.g. "SHIP-10042")
 * @param {string} params.eventType   - Valid domain event type from event-types.js
 * @param {Object} [params.payload={}] - Event-specific payload data
 * @param {number} params.expectedVersion - The version the caller expects the aggregate to be at (0 for new aggregates)
 * @param {Date|string} [params.timestamp] - Business occurrence time (defaults to Date.now())
 * @param {Object} [params.metadata={}] - Optional metadata (correlationId, causationId, triggeredBy)
 * @returns {Promise<Object>} The persisted Event document
 * @throws {ConcurrencyError} If expectedVersion does not match current version or upon duplicate key conflict
 * @throws {Error} If eventType is invalid or required fields are missing
 */
export async function appendEvent({
  aggregateId,
  eventType,
  payload = {},
  expectedVersion,
  timestamp = new Date(),
  metadata = {},
}) {
  if (!aggregateId) {
    throw new Error('aggregateId is required to append an event.');
  }

  if (!eventType || !isValidEventType(eventType)) {
    throw new Error(`Invalid or unrecognized eventType: "${eventType}".`);
  }

  if (typeof expectedVersion !== 'number' || expectedVersion < 0) {
    throw new Error('expectedVersion must be a non-negative integer (0 for initial creation).');
  }

  // Step 1: Read current max version for the aggregate
  const currentVersion = await Event.getMaxVersion(aggregateId);

  // Step 2: Validate expected version against current version (OCC check)
  if (currentVersion !== expectedVersion) {
    throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
  }

  const nextVersion = currentVersion + 1;

  // Step 3: Instantiate and persist the new Event
  try {
    const event = new Event({
      aggregateId,
      eventType,
      payload,
      version: nextVersion,
      timestamp: new Date(timestamp),
      metadata: {
        causationId: metadata.causationId || null,
        correlationId: metadata.correlationId || null,
        triggeredBy: metadata.triggeredBy || null,
      },
    });

    const savedEvent = await event.save();
    return savedEvent.toObject ? savedEvent.toObject() : savedEvent;
  } catch (err) {
    // MongoDB duplicate key error code 11000 indicates a race condition on (aggregateId, version)
    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
    }
    throw err;
  }
}

/**
 * Retrieves the full chronological event stream for an aggregate.
 *
 * @param {string} aggregateId
 * @param {Object} [options]
 * @param {number} [options.sort=1] - 1 for chronological (oldest to newest), -1 for reverse
 * @returns {Promise<Array>}
 */
export async function getEventsForAggregate(aggregateId, options = { sort: 1 }) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }
  return Event.findByAggregateId(aggregateId, options);
}

/**
 * Retrieves the current maximum version for an aggregate.
 *
 * @param {string} aggregateId
 * @returns {Promise<number>}
 */
export async function getAggregateVersion(aggregateId) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }
  return Event.getMaxVersion(aggregateId);
}
