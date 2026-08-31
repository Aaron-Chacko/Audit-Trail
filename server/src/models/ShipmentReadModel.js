/**
 * models/ShipmentReadModel.js — Read Model / Projection collection
 *
 * DESIGN RULES:
 *
 *  1. This collection is the ONLY source queries should read from.
 *     Never query the Event Store (events collection) for "current state"
 *     in a query route — that would defeat the purpose of CQRS.
 *
 *  2. This document is DERIVED state, rebuilt by the projection worker
 *     whenever new events are appended to the Event Store.
 *
 *  3. lastEventVersion mirrors the highest event version processed so far.
 *     The projection worker uses this to know where to resume if it falls
 *     behind (avoids reprocessing the full event stream every time).
 *
 *  4. eventHistory is a capped summary of recent events stored alongside
 *     the projection for quick timeline display. It is NOT a replacement
 *     for the Event Store — the Event Store remains the authoritative log.
 *
 *  5. projectedAt records when this document was last updated by the
 *     projection worker. Useful for monitoring projection lag.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Sub-schema: individual event summary stored in the read model ─────────────
// This is a lightweight copy of key event fields — NOT a full event store clone.

const eventSummarySchema = new Schema(
  {
    eventType:   { type: String, required: true },
    version:     { type: Number, required: true },
    timestamp:   { type: Date,   required: true },
    /**
     * summary — human-readable description of the event for UI display
     * (e.g. "Departed from Port of Mumbai"). Populated by the projection worker.
     */
    summary:     { type: String, default: '' },
    /**
     * payload snapshot — kept small; include only the fields the UI
     * timeline actually needs. The full payload lives in the Event Store.
     */
    payloadSnapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false } // No separate _id per event summary — they live inside the parent doc
);

// ─── Sub-schema: last known sensor reading ────────────────────────────────────
const sensorStateSchema = new Schema(
  {
    temperature: { type: Number, default: null }, // °C
    humidity:    { type: Number, default: null }, // %
    recordedAt:  { type: Date,   default: null },
  },
  { _id: false }
);

// ─── Main Read Model Schema ────────────────────────────────────────────────────
const shipmentReadModelSchema = new Schema(
  {
    /**
     * aggregateId — foreign key back to the Event Store aggregate.
     * This is the shipment or container business ID (e.g. "SHIP-10042").
     * Unique so we have exactly one read-model document per aggregate.
     */
    aggregateId: {
      type: String,
      required: [true, 'aggregateId is required'],
      unique: true,
      trim: true,
    },

    // ─── Current state fields (rebuilt by projection worker) ───────────────

    status: {
      type: String,
      enum: ['created', 'loaded', 'in_transit', 'arrived', 'unloaded', 'cancelled'],
      default: 'created',
    },

    origin: {
      port:    { type: String, default: '' },
      country: { type: String, default: '' },
    },

    destination: {
      port:    { type: String, default: '' },
      country: { type: String, default: '' },
    },

    currentLocation: {
      port:    { type: String, default: null },
      country: { type: String, default: null },
    },

    /**
     * vessel — the ship currently carrying this container.
     * Null if not yet loaded or already unloaded.
     */
    vessel: {
      name: { type: String, default: null },
      imo:  { type: String, default: null }, // International Maritime Organization number
    },

    /**
     * cargo — top-level description of what is being shipped.
     */
    cargo: {
      description: { type: String, default: '' },
      weightKg:    { type: Number, default: null },
      hazardous:   { type: Boolean, default: false },
    },

    /**
     * sensorState — the LATEST sensor reading for this shipment.
     * Updated every time a SENSOR_READING or TEMPERATURE_SPIKE event is projected.
     */
    sensorState: {
      type: sensorStateSchema,
      default: () => ({}),
    },

    /**
     * flags — boolean indicators derived from event history.
     * Allows fast dashboard filtering (e.g. "show all shipments with temp spikes").
     */
    flags: {
      hasTemperatureSpike: { type: Boolean, default: false },
      hasHumidityAlert:    { type: Boolean, default: false },
      customsHeld:         { type: Boolean, default: false },
    },

    /**
     * eventHistory — ordered list of event summaries for timeline display.
     * Newest events are appended; the projection worker keeps this in sync.
     * Capped at ~500 entries to keep document size manageable — full history
     * always lives in the Event Store.
     */
    eventHistory: {
      type: [eventSummarySchema],
      default: [],
    },

    /**
     * lastEventVersion — the version number of the last event that has been
     * applied to this read model. The projection worker compares this against
     * the latest event version to determine whether a rebuild is needed.
     * This is CRITICAL for incremental projection — without it, the worker
     * would have to replay the entire event stream from scratch every time.
     */
    lastEventVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * projectedAt — timestamp of the last projection worker update.
     * Monitoring can alert if (now - projectedAt) exceeds an SLA threshold,
     * indicating the projection worker has stalled.
     */
    projectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt (first projection) and updatedAt (last projection)
    versionKey: false,
    collection: 'shipment_read_models',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────

/** Primary lookup — get current state of a single aggregate. O(1). */
shipmentReadModelSchema.index({ aggregateId: 1 }, { unique: true });

/** Dashboard query — filter by shipment status (e.g. "all in_transit"). */
shipmentReadModelSchema.index({ status: 1 });

/** Alert dashboard — quickly find shipments with active temperature issues. */
shipmentReadModelSchema.index({ 'flags.hasTemperatureSpike': 1, status: 1 });

/** Customs dashboard — flag any shipments currently held. */
shipmentReadModelSchema.index({ 'flags.customsHeld': 1 });

/** Port queries — find all shipments currently at a given destination port. */
shipmentReadModelSchema.index({ 'destination.port': 1 });

// ─── Model Export ──────────────────────────────────────────────────────────────

const ShipmentReadModel = mongoose.model('ShipmentReadModel', shipmentReadModelSchema);

export default ShipmentReadModel;
