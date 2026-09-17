import mongoose from 'mongoose';

const { Schema } = mongoose;

const snapshotSchema = new Schema(
  {
    aggregateId: {
      type: String,
      required: [true, 'aggregateId is required'],
      trim: true,
      index: true,
    },
    version: {
      type: Number,
      required: [true, 'version is required'],
      min: [1, 'version must be >= 1'],
    },
    state: {
      type: Schema.Types.Mixed,
      required: [true, 'state is required'],
      default: {},
    },
    checksum: {
      type: String,
      required: [true, 'checksum is required'],
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      default: Date.now,
      index: true,
    },
    metadata: {
      snapshotReason: {
        type: String,
        default: 'PERIODIC_INTERVAL',
      },
      eventsFolded: {
        type: Number,
        default: 0,
      },
      triggeredBy: {
        type: String,
        default: 'system',
      },
    },
  },
  {
    timestamps: { createdAt: 'storedAt', updatedAt: false },
    versionKey: false,
    collection: 'snapshots',
  }
);

snapshotSchema.index({ aggregateId: 1, version: -1 }, { unique: true });
snapshotSchema.index({ aggregateId: 1, timestamp: -1 });
snapshotSchema.index({ aggregateId: 1, version: 1 });

snapshotSchema.statics.findLatest = function (aggregateId) {
  if (!aggregateId) return null;
  return this.findOne({ aggregateId }).sort({ version: -1 }).lean().exec();
};

snapshotSchema.statics.findAtOrBeforeVersion = function (aggregateId, targetVersion) {
  if (!aggregateId || typeof targetVersion !== 'number') return null;
  return this.findOne({
    aggregateId,
    version: { $lte: targetVersion },
  })
    .sort({ version: -1 })
    .lean()
    .exec();
};

snapshotSchema.statics.findAtOrBeforeTimestamp = function (aggregateId, targetTimestamp) {
  if (!aggregateId || !targetTimestamp) return null;
  const cutoff = new Date(targetTimestamp);
  return this.findOne({
    aggregateId,
    timestamp: { $lte: cutoff },
  })
    .sort({ timestamp: -1, version: -1 })
    .lean()
    .exec();
};

snapshotSchema.statics.findByAggregateId = function (aggregateId, { sort = -1, limit = 10 } = {}) {
  if (!aggregateId) return [];
  let cursor = this.find({ aggregateId }).sort({ version: sort });
  if (typeof limit === 'number' && limit > 0) {
    cursor = cursor.limit(limit);
  }
  return cursor.lean().exec();
};

const Snapshot = mongoose.model('Snapshot', snapshotSchema);

export default Snapshot;
