/**
 * models/Event.js  — The Event Store schema
 *
 * DESIGN RULES (enforced here so all contributors stay honest):
 *
 *  1. APPEND-ONLY: pre('updateOne'), pre('updateMany'), pre('findOneAndUpdate'),
 *     pre('deleteOne'), pre('deleteMany'), and pre('findOneAndDelete') all throw.
 *     If you see a ConcurrencyError instead, your version check failed upstream.
 *
 *  2. OPTIMISTIC CONCURRENCY: the compound unique index on
 *     { aggregateId, version } guarantees that two simultaneous commands for
 *     the same aggregate cannot both persist — one will receive a duplicate-key
 *     error (E11000). The command layer must catch this and surface a 409.
 *
 *  3. VERSION starts at 1 for the first event on an aggregate and increments
 *     monotonically. The command layer is responsible for reading the current
 *     max version and incrementing before appending.
 *
 *  4. PAYLOAD is intentionally untyped (Mixed) at the Mongoose level because
 *     each eventType has its own structure. Validation happens upstream in the
 *     command service via Joi/Zod before the document reaches this model.
 */

import mongoose from 'mongoose';
import { ALL_EVENT_TYPES } from '../events/event-types.js';

const { Schema } = mongoose;

// ─── Schema Definition ─────────────────────────────────────────────────────────

const eventSchema = new Schema(
  {
    /**
     * aggregateId — the business identity of the entity this event belongs to.
     * For logistics, this is typically a shipment ID or container ID (e.g. "SHIP-10042").
     * Indexed with version to support efficient event stream lookups per aggregate.
     */
    aggregateId: {
      type: String,
      required: [true, 'aggregateId is required'],
      trim: true,
      index: true,
    },

    /**
     * eventType — discriminator that tells consumers how to interpret payload.
     * Must be one of the values defined in events/event-types.js.
     */
    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      enum: {
        values: ALL_EVENT_TYPES,
        message: '"{VALUE}" is not a recognised event type',
      },
      index: true,
    },

    /**
     * payload — event-specific data. Structure varies per eventType.
     * Kept as Mixed so we don't fight Mongoose when new event types are added.
     * All structural validation is done upstream (Joi/Zod in command services).
     */
    payload: {
      type: Schema.Types.Mixed,
      required: [true, 'payload is required (use {} for events with no data)'],
      default: {},
    },

    /**
     * version — monotonically increasing integer per aggregate.
     * First event for an aggregate is version 1.
     * Used for Optimistic Concurrency Control: the command layer reads
     * the current version, increments it, and includes it in the new event.
     * The unique compound index { aggregateId, version } rejects duplicates
     * at the DB level as a last line of defence.
     */
    version: {
      type: Number,
      required: [true, 'version is required'],
      min: [1, 'version must be >= 1'],
    },

    /**
     * timestamp — when the business event OCCURRED (not when it was stored).
     * Callers should provide this; Mongoose createdAt covers DB insertion time.
     * Required separately so historical-state queries can filter by event time.
     */
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      index: true,
    },

    /**
     * metadata — optional bag of infrastructure context: who triggered the
     * command, correlation/causation IDs for distributed tracing, source IP, etc.
     * Kept separate from payload so domain logic never mixes with infra concerns.
     */
    metadata: {
      causationId:   { type: String, default: null },  // ID of the command that caused this event
      correlationId: { type: String, default: null },  // ID linking a chain of related events
      triggeredBy:   { type: String, default: null },  // userId or service name
    },
  },
  {
    // createdAt = DB insertion time (different from timestamp = business event time)
    timestamps: { createdAt: 'storedAt', updatedAt: false },

    // Disable Mongoose's version key (__v) — we manage versioning ourselves
    versionKey: false,

    // Tells Mongoose this collection is append-only — disables buffering updates
    collection: 'events',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────

/**
 * PRIMARY — supports OCC: guarantees no two events share the same
 * (aggregateId, version) pair. A duplicate-key error here means a concurrent
 * command raced and won; the loser must retry or surface a 409.
 */
eventSchema.index({ aggregateId: 1, version: 1 }, { unique: true });

/**
 * REPLAY INDEX — used when replaying all events for an aggregate
 * in chronological order (the most common read pattern in the write side).
 */
eventSchema.index({ aggregateId: 1, timestamp: 1 });

/**
 * HISTORICAL STATE INDEX — supports "state as of <timestamp>" queries
 * by filtering storedAt alongside aggregateId.
 */
eventSchema.index({ aggregateId: 1, storedAt: 1 });

/**
 * ANALYTICS INDEX — supports queries like "all TEMPERATURE_SPIKE events
 * in the last 24 h" without a full collection scan.
 */
eventSchema.index({ eventType: 1, timestamp: -1 });

// ─── Immutability Guards ───────────────────────────────────────────────────────

/**
 * Block any mutation or deletion at the Mongoose middleware level.
 * These hooks fire BEFORE the DB operation so they prevent accidents
 * even when someone bypasses the service layer.
 */

const MUTATION_ERROR = new Error(
  '[EventStore] The event store is append-only. Updates and deletes are forbidden.'
);
MUTATION_ERROR.name = 'ImmutabilityViolation';

const BLOCKED_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
  'findOneAndReplace',
];

for (const op of BLOCKED_OPS) {
  eventSchema.pre(op, function () {
    throw MUTATION_ERROR;
  });
}

// ─── Model Export ──────────────────────────────────────────────────────────────

const Event = mongoose.model('Event', eventSchema);

export default Event;
