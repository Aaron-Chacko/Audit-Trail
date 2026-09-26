/**
 * event-validator.js
 *
 * Pure validation helpers for raw event payloads before they are persisted
 * to the append-only event store.  These functions are intentionally
 * framework-agnostic (no Mongoose, no Express) so they can be unit-tested
 * without a running server.
 *
 * @module utils/event-validator
 */

import { ALL_EVENT_TYPES } from '../events/event-types.js';

/**
 * Maximum allowed length of an aggregateId string.
 * @constant {number}
 */
const MAX_AGGREGATE_ID_LENGTH = 128;

/**
 * Maximum allowed byte size for a serialised payload (1 MiB).
 * Prevents bloated documents from degrading read performance.
 * @constant {number}
 */
const MAX_PAYLOAD_BYTES = 1_048_576;

/**
 * @typedef {object} ValidationResult
 * @property {boolean}  isValid  - True when the event passes all checks.
 * @property {string[]} errors   - List of human-readable error messages.
 */

/**
 * Validate a raw event object before it is handed to the event-store service.
 *
 * @param {object} event - Raw event payload.
 * @param {string} event.aggregateId  - Identifier of the aggregate stream.
 * @param {string} event.eventType    - Discriminator matching ALL_EVENT_TYPES.
 * @param {object} event.payload      - Domain-specific event data.
 * @param {number} event.version      - Monotonically increasing stream version.
 * @param {Date|string} event.timestamp - ISO 8601 or Date representing business time.
 * @returns {ValidationResult}
 */
export function validateEvent(event) {
  const errors = [];

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return { isValid: false, errors: ['event must be a plain object'] };
  }

  // ── aggregateId ────────────────────────────────────────────────────────────
  if (!event.aggregateId || typeof event.aggregateId !== 'string') {
    errors.push('aggregateId is required and must be a non-empty string');
  } else if (event.aggregateId.trim().length === 0) {
    errors.push('aggregateId must not be blank or whitespace-only');
  } else if (event.aggregateId.length > MAX_AGGREGATE_ID_LENGTH) {
    errors.push(`aggregateId must not exceed ${MAX_AGGREGATE_ID_LENGTH} characters`);
  }

  // ── eventType ──────────────────────────────────────────────────────────────
  if (!event.eventType || typeof event.eventType !== 'string') {
    errors.push('eventType is required and must be a string');
  } else if (!ALL_EVENT_TYPES.includes(event.eventType)) {
    errors.push(`eventType "${event.eventType}" is not a recognised event type`);
  }

  // ── version ────────────────────────────────────────────────────────────────
  if (typeof event.version !== 'number' || !Number.isInteger(event.version) || event.version < 1) {
    errors.push('version must be a positive integer >= 1');
  }

  // ── timestamp ──────────────────────────────────────────────────────────────
  if (!event.timestamp) {
    errors.push('timestamp is required');
  } else {
    const ts = new Date(event.timestamp);
    if (isNaN(ts.getTime())) {
      errors.push('timestamp must be a valid ISO 8601 date string or Date object');
    } else if (ts > new Date()) {
      errors.push('timestamp must not be set in the future');
    }
  }

  // ── payload ────────────────────────────────────────────────────────────────
  if (event.payload === undefined || event.payload === null) {
    errors.push('payload is required (use an empty object {} if there is no domain data)');
  } else if (typeof event.payload !== 'object' || Array.isArray(event.payload)) {
    errors.push('payload must be a plain object');
  } else {
    try {
      const serialised = JSON.stringify(event.payload);
      const byteLength = Buffer.byteLength(serialised, 'utf8');
      if (byteLength > MAX_PAYLOAD_BYTES) {
        errors.push(
          `payload exceeds maximum allowed size of ${MAX_PAYLOAD_BYTES / 1024} KiB (got ${Math.ceil(byteLength / 1024)} KiB)`
        );
      }
    } catch {
      errors.push('payload must be JSON-serialisable');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Throws a descriptive Error if validateEvent finds any violations.
 * Convenience wrapper for use inside command handlers.
 *
 * @param {object} event - Raw event payload.
 * @returns {void}
 * @throws {Error} Aggregated validation failure message.
 */
export function assertValidEvent(event) {
  const { isValid, errors } = validateEvent(event);
  if (!isValid) {
    throw new Error(`[EventValidator] Event is invalid:\n  • ${errors.join('\n  • ')}`);
  }
}

export default { validateEvent, assertValidEvent };
