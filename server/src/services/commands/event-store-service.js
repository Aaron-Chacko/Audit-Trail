import Event from '../../models/Event.js';
import { isValidEventType } from '../../events/event-types.js';
import { validateEventPayload } from '../../schemas/event-payload-schemas.js';
import { ConcurrencyError } from '../../utils/app-errors.js';

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

  if (metadata.causationId) {
    const existing = await Event.findByCausationId(aggregateId, metadata.causationId);
    if (existing) {
      return { ...existing, isIdempotentReplay: true };
    }
  }

  const { error: payloadError, value: validatedPayload } = validateEventPayload(eventType, payload);
  if (payloadError) {
    throw new Error(`Event payload validation failed for "${eventType}": ${payloadError.message}`);
  }

  const currentVersion = await Event.getMaxVersion(aggregateId);

  if (currentVersion !== expectedVersion) {
    throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
  }

  const nextVersion = currentVersion + 1;

  try {
    const event = new Event({
      aggregateId,
      eventType,
      payload: validatedPayload,
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
    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
    }
    throw err;
  }
}

export async function checkConcurrency(aggregateId, expectedVersion) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }

  const currentVersion = await Event.getMaxVersion(aggregateId);
  const canAppend = currentVersion === expectedVersion;
  const drift = currentVersion - expectedVersion;

  return {
    aggregateId,
    canAppend,
    currentVersion,
    expectedVersion,
    drift,
  };
}

export async function appendWithRetry({
  aggregateId,
  eventType,
  payload = {},
  getPayload = null,
  expectedVersion = null,
  maxRetries = 3,
  retryDelayMs = 50,
  metadata = {},
}) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const versionTarget = expectedVersion !== null && attempt === 0
        ? expectedVersion
        : await Event.getMaxVersion(aggregateId);

      const finalPayload = typeof getPayload === 'function'
        ? await getPayload(versionTarget)
        : payload;

      return await appendEvent({
        aggregateId,
        eventType,
        payload: finalPayload,
        expectedVersion: versionTarget,
        metadata,
      });
    } catch (err) {
      if (err instanceof ConcurrencyError && attempt < maxRetries) {
        attempt += 1;
        const delay = retryDelayMs * Math.pow(2, attempt - 1) + Math.random() * 20;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

export async function appendEventsBatch({
  aggregateId,
  events,
  expectedVersion,
  metadata = {},
}) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }

  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('events must be a non-empty array.');
  }

  if (typeof expectedVersion !== 'number' || expectedVersion < 0) {
    throw new Error('expectedVersion must be a non-negative integer.');
  }

  const preparedEvents = events.map((ev, index) => {
    if (!ev.eventType || !isValidEventType(ev.eventType)) {
      throw new Error(`Invalid eventType at index ${index}: "${ev.eventType}".`);
    }
    const { error, value } = validateEventPayload(ev.eventType, ev.payload || {});
    if (error) {
      throw new Error(`Payload validation failed for event at index ${index} (${ev.eventType}): ${error.message}`);
    }
    return {
      eventType: ev.eventType,
      payload: value,
      timestamp: ev.timestamp ? new Date(ev.timestamp) : new Date(),
    };
  });

  const currentVersion = await Event.getMaxVersion(aggregateId);
  if (currentVersion !== expectedVersion) {
    throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
  }

  const persisted = [];
  let runningVersion = currentVersion;

  try {
    for (const item of preparedEvents) {
      runningVersion += 1;
      const eventDoc = new Event({
        aggregateId,
        eventType: item.eventType,
        payload: item.payload,
        version: runningVersion,
        timestamp: item.timestamp,
        metadata: {
          causationId: metadata.causationId || null,
          correlationId: metadata.correlationId || null,
          triggeredBy: metadata.triggeredBy || null,
        },
      });

      const saved = await eventDoc.save();
      persisted.push(saved.toObject ? saved.toObject() : saved);
    }

    return persisted;
  } catch (err) {
    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
    }
    throw err;
  }
}

export async function getEventsForAggregate(aggregateId, options = { sort: 1 }) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }
  return Event.findByAggregateId(aggregateId, options);
}

export async function getAggregateVersion(aggregateId) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }
  return Event.getMaxVersion(aggregateId);
}

export async function getStreamStats(aggregateId) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }

  const events = await Event.findByAggregateId(aggregateId, { sort: 1 });
  if (!events || events.length === 0) {
    return {
      aggregateId,
      totalEvents: 0,
      currentVersion: 0,
      firstEventAt: null,
      lastEventAt: null,
      distinctEventTypes: [],
    };
  }

  const distinctEventTypes = [...new Set(events.map(e => e.eventType))];

  return {
    aggregateId,
    totalEvents: events.length,
    currentVersion: events[events.length - 1].version,
    firstEventAt: events[0].timestamp,
    lastEventAt: events[events.length - 1].timestamp,
    distinctEventTypes,
  };
}
