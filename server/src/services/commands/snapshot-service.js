import Snapshot from '../../models/Snapshot.js';
import Event from '../../models/Event.js';
import { calculateChecksum, verifyChecksum } from '../../utils/checksum.js';

export async function saveSnapshot({
  aggregateId,
  version,
  state,
  metadata = {},
}) {
  if (!aggregateId) {
    throw new Error('aggregateId is required to create a snapshot.');
  }

  if (typeof version !== 'number' || version < 1) {
    throw new Error('version must be an integer >= 1.');
  }

  if (!state || typeof state !== 'object') {
    throw new Error('state object is required to create a snapshot.');
  }

  const checksum = calculateChecksum(state);

  const snapshotDoc = new Snapshot({
    aggregateId,
    version,
    state,
    checksum,
    metadata: {
      snapshotReason: metadata.snapshotReason || 'PERIODIC_INTERVAL',
      eventsFolded: typeof metadata.eventsFolded === 'number' ? metadata.eventsFolded : version,
      triggeredBy: metadata.triggeredBy || 'system',
    },
  });

  const saved = await snapshotDoc.save();
  return saved.toObject ? saved.toObject() : saved;
}

export function shouldTakeSnapshot(currentVersion, { snapshotInterval = 10, lastSnapshotVersion = 0 } = {}) {
  if (typeof currentVersion !== 'number' || currentVersion < 1) {
    return false;
  }
  return (currentVersion - lastSnapshotVersion) >= snapshotInterval;
}

export async function getLatestSnapshot(aggregateId) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }
  return Snapshot.findLatest(aggregateId);
}

export async function getSnapshotAtVersion(aggregateId, targetVersion) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }
  return Snapshot.findAtOrBeforeVersion(aggregateId, targetVersion);
}

export async function getSnapshotAtTimestamp(aggregateId, targetTimestamp) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }
  return Snapshot.findAtOrBeforeTimestamp(aggregateId, targetTimestamp);
}

export async function getAcceleratedStream(aggregateId, { toVersion } = {}) {
  if (!aggregateId) {
    throw new Error('aggregateId is required.');
  }

  const snapshot = typeof toVersion === 'number'
    ? await Snapshot.findAtOrBeforeVersion(aggregateId, toVersion)
    : await Snapshot.findLatest(aggregateId);

  if (snapshot) {
    const deltaEvents = await Event.getEventStreamSlice(aggregateId, {
      fromVersion: snapshot.version + 1,
      toVersion,
      sort: 1,
    });

    return {
      aggregateId,
      snapshot,
      events: deltaEvents,
      fromVersion: snapshot.version + 1,
      isAccelerated: true,
    };
  }

  const allEvents = await Event.getEventStreamSlice(aggregateId, {
    fromVersion: 1,
    toVersion,
    sort: 1,
  });

  return {
    aggregateId,
    snapshot: null,
    events: allEvents,
    fromVersion: 1,
    isAccelerated: false,
  };
}

export function verifySnapshotIntegrity(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return {
      isValid: false,
      error: 'Invalid snapshot document',
    };
  }

  const computedChecksum = calculateChecksum(snapshot.state);
  const isValid = verifyChecksum(snapshot.state, snapshot.checksum);

  return {
    isValid,
    aggregateId: snapshot.aggregateId,
    version: snapshot.version,
    storedChecksum: snapshot.checksum,
    computedChecksum,
  };
}

export default {
  saveSnapshot,
  shouldTakeSnapshot,
  getLatestSnapshot,
  getSnapshotAtVersion,
  getSnapshotAtTimestamp,
  getAcceleratedStream,
  verifySnapshotIntegrity,
};
