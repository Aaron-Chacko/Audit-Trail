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

const Event = mongoose.model('Event', eventSchema);

export default Event;
