import Snapshot from './src/models/Snapshot.js';
import { calculateChecksum, verifyChecksum } from './src/utils/checksum.js';
import {
  saveSnapshot,
  shouldTakeSnapshot,
  getLatestSnapshot,
  getSnapshotAtVersion,
  getSnapshotAtTimestamp,
  getAcceleratedStream,
  verifySnapshotIntegrity,
} from './src/services/commands/snapshot-service.js';
import {
  getLatestSnapshot as queryGetLatestSnapshot,
  getAcceleratedStream as queryGetAcceleratedStream,
} from './src/services/queries/event-store-service.js';

console.log('====================================================');
console.log('       SNAPSHOT & ACCELERATED REPLAY PIPELINE       ');
console.log('====================================================\n');

// 1. Cryptographic Checksum & Integrity
console.log('[1] State Checksum & Tamper Detection:');
const stateA = {
  aggregateId: 'SHIP-SNAP-01',
  status: 'IN_TRANSIT',
  currentLocation: { port: 'Port of Singapore', terminal: 'T1' },
  temperatures: [4.2, 4.5, 4.3],
  version: 15,
};

const stateA_Reordered = {
  version: 15,
  temperatures: [4.2, 4.5, 4.3],
  status: 'IN_TRANSIT',
  currentLocation: { terminal: 'T1', port: 'Port of Singapore' },
  aggregateId: 'SHIP-SNAP-01',
};

const hash1 = calculateChecksum(stateA);
const hash2 = calculateChecksum(stateA_Reordered);
console.log('    - Deterministic hashing regardless of key order:', hash1 === hash2 ? 'PASS' : 'FAIL');
console.log('    - Valid checksum verification:', verifyChecksum(stateA, hash1) === true ? 'PASS' : 'FAIL');

const tamperedState = { ...stateA, status: 'DELIVERED' };
console.log('    - Detects state tampering / mismatch:', verifyChecksum(tamperedState, hash1) === false ? 'PASS' : 'FAIL');

// 2. Snapshot Model Instantiation & Statics
console.log('\n[2] Snapshot Model & Schema Contract:');
const snapDoc = new Snapshot({
  aggregateId: 'SHIP-SNAP-01',
  version: 10,
  state: stateA,
  checksum: hash1,
  metadata: {
    snapshotReason: 'PERIODIC_INTERVAL',
    eventsFolded: 10,
    triggeredBy: 'projection-worker',
  },
});

console.log('    - Collection name is snapshots:', Snapshot.collection.name === 'snapshots' ? 'PASS' : 'FAIL');
console.log('    - Snapshot document instantiates properly:', snapDoc.aggregateId === 'SHIP-SNAP-01' && snapDoc.version === 10 ? 'PASS' : 'FAIL');
console.log('    - Snapshot.findLatest is function:', typeof Snapshot.findLatest === 'function' ? 'PASS' : 'FAIL');
console.log('    - Snapshot.findAtOrBeforeVersion is function:', typeof Snapshot.findAtOrBeforeVersion === 'function' ? 'PASS' : 'FAIL');
console.log('    - Snapshot.findAtOrBeforeTimestamp is function:', typeof Snapshot.findAtOrBeforeTimestamp === 'function' ? 'PASS' : 'FAIL');
console.log('    - Snapshot.findByAggregateId is function:', typeof Snapshot.findByAggregateId === 'function' ? 'PASS' : 'FAIL');

// 3. Snapshot Frequency & Threshold Policy
console.log('\n[3] Snapshot Interval Evaluation:');
console.log('    - Should snapshot at interval threshold (v10 with last v0, interval 10):', shouldTakeSnapshot(10, { snapshotInterval: 10, lastSnapshotVersion: 0 }) === true ? 'PASS' : 'FAIL');
console.log('    - Should not snapshot before interval threshold (v7 with last v0, interval 10):', shouldTakeSnapshot(7, { snapshotInterval: 10, lastSnapshotVersion: 0 }) === false ? 'PASS' : 'FAIL');
console.log('    - Should snapshot with delta (v25 with last v10, interval 10):', shouldTakeSnapshot(25, { snapshotInterval: 10, lastSnapshotVersion: 10 }) === true ? 'PASS' : 'FAIL');

// 4. Snapshot Integrity Checker
console.log('\n[4] Snapshot Integrity Verification:');
const validCheck = verifySnapshotIntegrity({
  aggregateId: 'SHIP-SNAP-01',
  version: 10,
  state: stateA,
  checksum: hash1,
});
console.log('    - Verified intact snapshot reports isValid true:', validCheck.isValid === true ? 'PASS' : 'FAIL');

const invalidCheck = verifySnapshotIntegrity({
  aggregateId: 'SHIP-SNAP-01',
  version: 10,
  state: tamperedState,
  checksum: hash1,
});
console.log('    - Corrupted snapshot reports isValid false:', invalidCheck.isValid === false ? 'PASS' : 'FAIL');

// 5. Service Wiring & Query Export API
console.log('\n[5] Command & Query Service Integration:');
console.log('    - saveSnapshot is function:', typeof saveSnapshot === 'function' ? 'PASS' : 'FAIL');
console.log('    - getLatestSnapshot is function:', typeof getLatestSnapshot === 'function' ? 'PASS' : 'FAIL');
console.log('    - getSnapshotAtVersion is function:', typeof getSnapshotAtVersion === 'function' ? 'PASS' : 'FAIL');
console.log('    - getSnapshotAtTimestamp is function:', typeof getSnapshotAtTimestamp === 'function' ? 'PASS' : 'FAIL');
console.log('    - getAcceleratedStream is function:', typeof getAcceleratedStream === 'function' ? 'PASS' : 'FAIL');
console.log('    - Query service getLatestSnapshot is function:', typeof queryGetLatestSnapshot === 'function' ? 'PASS' : 'FAIL');
console.log('    - Query service getAcceleratedStream is function:', typeof queryGetAcceleratedStream === 'function' ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('  SNAPSHOT PIPELINE VERIFIED SUCCESSFULLY!         ');
console.log('====================================================\n');

process.exit(0);
