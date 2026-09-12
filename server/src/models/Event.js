import mongoose from 'mongoose';
import { ALL_EVENT_TYPES } from '../events/event-types.js';
import { ImmutabilityViolation } from '../utils/app-errors.js';

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    aggregateId: {
      type: String,
      required: [true, 'aggregateId is required'],
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      enum: {
        values: ALL_EVENT_TYPES,
        message: '"{VALUE}" is not a recognised event type',
      },
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: [true, 'payload is required'],
      default: {},
    },
    version: {
      type: Number,
      required: [true, 'version is required'],
      min: [1, 'version must be >= 1'],
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      index: true,
    },
    metadata: {
      causationId: { type: String, default: null },
      correlationId: { type: String, default: null },
      triggeredBy: { type: String, default: null },
      clientIp: { type: String, default: null },
      userAgent: { type: String, default: null },
      originTimestamp: { type: Date, default: null },
      schemaVersion: { type: Number, default: 1 },
    },
  },
  {
    timestamps: { createdAt: 'storedAt', updatedAt: false },
    versionKey: false,
    collection: 'events',
  }
);

eventSchema.index({ aggregateId: 1, version: 1 }, { unique: true });
eventSchema.index({ aggregateId: 1, timestamp: 1 });
eventSchema.index({ aggregateId: 1, storedAt: 1 });
eventSchema.index({ eventType: 1, timestamp: -1 });
eventSchema.index({ aggregateId: 1, eventType: 1, version: 1 });
eventSchema.index({ timestamp: 1, eventType: 1 });
eventSchema.index({ aggregateId: 1, 'metadata.causationId': 1 }, { sparse: true });
eventSchema.index({ 'metadata.correlationId': 1 }, { sparse: true });
eventSchema.index({ 'metadata.triggeredBy': 1 }, { sparse: true });

eventSchema.pre('save', function (next) {
  if (!this.isNew) {
    throw new ImmutabilityViolation(
      '[EventStore] Modifying an existing event document is forbidden. The event store is strictly append-only.'
    );
  }
  next();
});

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
    throw new ImmutabilityViolation(
      `[EventStore] Operation "${op}" is forbidden. The event store is strictly append-only.`
    );
  });
}

eventSchema.statics.findByAggregateId = function (aggregateId, { sort = 1 } = {}) {
  return this.find({ aggregateId }).sort({ version: sort }).lean().exec();
};

eventSchema.statics.getMaxVersion = async function (aggregateId) {
  const latestEvent = await this.findOne({ aggregateId })
    .sort({ version: -1 })
    .select({ version: 1 })
    .lean()
    .exec();

  return latestEvent ? latestEvent.version : 0;
};

eventSchema.statics.getEventsSince = function (aggregateId, sinceVersion) {
  return this.find({
    aggregateId,
    version: { $gt: sinceVersion },
  })
    .sort({ version: 1 })
    .lean()
    .exec();
};

eventSchema.statics.getEventsUntilTimestamp = function (aggregateId, targetTimestamp) {
  const cutoff = new Date(targetTimestamp);
  return this.find({
    aggregateId,
    timestamp: { $lte: cutoff },
  })
    .sort({ timestamp: 1, version: 1 })
    .lean()
    .exec();
};

eventSchema.statics.findByCausationId = function (aggregateId, causationId) {
  if (!causationId) return null;
  return this.findOne({ aggregateId, 'metadata.causationId': causationId }).lean().exec();
};

eventSchema.statics.getEventStreamSlice = function (aggregateId, { fromVersion = 1, toVersion, sort = 1, limit } = {}) {
  const safeFromVersion = Math.max(1, parseInt(fromVersion, 10) || 1);
  const safeSort = sort === -1 ? -1 : 1;
  const query = { aggregateId, version: { $gte: safeFromVersion } };

  if (typeof toVersion === 'number' && !isNaN(toVersion)) {
    query.version.$lte = Math.max(safeFromVersion, parseInt(toVersion, 10));
  }

  let cursor = this.find(query).sort({ version: safeSort });
  if (typeof limit === 'number' && limit > 0) {
    const safeLimit = Math.min(1000, parseInt(limit, 10) || 100);
    cursor = cursor.limit(safeLimit);
  }
  return cursor.lean().exec();
};

eventSchema.statics.getEventsInTimeRange = function (aggregateId, { fromTimestamp, toTimestamp, sort = 1, limit } = {}) {
  const safeSort = sort === -1 ? -1 : 1;
  const query = { aggregateId, timestamp: {} };

  if (fromTimestamp && !isNaN(new Date(fromTimestamp).getTime())) {
    query.timestamp.$gte = new Date(fromTimestamp);
  }
  if (toTimestamp && !isNaN(new Date(toTimestamp).getTime())) {
    query.timestamp.$lte = new Date(toTimestamp);
  }
  if (Object.keys(query.timestamp).length === 0) {
    delete query.timestamp;
  }

  let cursor = this.find(query).sort({ timestamp: safeSort, version: safeSort });
  if (typeof limit === 'number' && limit > 0) {
    const safeLimit = Math.min(1000, parseInt(limit, 10) || 100);
    cursor = cursor.limit(safeLimit);
  }
  return cursor.lean().exec();
};

eventSchema.statics.getEventsByTypes = function (aggregateId, eventTypes = [], { sort = 1, limit } = {}) {
  const query = { aggregateId };
  if (Array.isArray(eventTypes) && eventTypes.length > 0) {
    query.eventType = { $in: eventTypes };
  }
  let cursor = this.find(query).sort({ version: sort });
  if (typeof limit === 'number' && limit > 0) {
    cursor = cursor.limit(limit);
  }
  return cursor.lean().exec();
};

eventSchema.statics.getGlobalStream = function ({ sinceStoredAt, limit = 100, eventTypes = [] } = {}) {
  const query = {};
  if (sinceStoredAt) {
    query.storedAt = { $gt: new Date(sinceStoredAt) };
  }
  if (Array.isArray(eventTypes) && eventTypes.length > 0) {
    query.eventType = { $in: eventTypes };
  }
  return this.find(query).sort({ storedAt: 1, _id: 1 }).limit(limit).lean().exec();
};

eventSchema.statics.findByCorrelationId = function (correlationId, { sort = 1, limit } = {}) {
  if (!correlationId) return Promise.resolve([]);
  let cursor = this.find({ 'metadata.correlationId': correlationId }).sort({ storedAt: sort, _id: sort });
  if (typeof limit === 'number' && limit > 0) {
    cursor = cursor.limit(limit);
  }
  return cursor.lean().exec();
};

eventSchema.statics.findByTriggeredBy = function (triggeredBy, { sort = -1, limit = 50 } = {}) {
  if (!triggeredBy) return Promise.resolve([]);
  let cursor = this.find({ 'metadata.triggeredBy': triggeredBy }).sort({ storedAt: sort, _id: sort });
  if (typeof limit === 'number' && limit > 0) {
    cursor = cursor.limit(limit);
  }
  return cursor.lean().exec();
};

const Event = mongoose.model('Event', eventSchema);

export default Event;
