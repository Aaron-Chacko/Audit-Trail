import crypto from 'crypto';
import { calculateChecksum } from './checksum.js';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export function computeEventHash(event, previousHash = GENESIS_HASH) {
  if (!event || typeof event !== 'object') {
    throw new Error('Event object is required to compute hash.');
  }

  const payloadHash = calculateChecksum(event.payload || {});
  const serialized = [
    String(event.aggregateId || ''),
    String(event.version || 0),
    String(event.eventType || ''),
    payloadHash,
    event.timestamp instanceof Date ? event.timestamp.toISOString() : String(event.timestamp || ''),
    String(previousHash),
  ].join('|');

  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export function verifyStreamHashChain(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      isValid: true,
      eventCount: 0,
      rootHash: GENESIS_HASH,
      errors: [],
    };
  }

  const errors = [];
  let previousHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const currentEvent = events[i];
    const computedHash = computeEventHash(currentEvent, previousHash);

    if (currentEvent.hash && currentEvent.hash !== computedHash) {
      errors.push(`Hash mismatch at index ${i} (v${currentEvent.version}): expected ${computedHash}, got ${currentEvent.hash}`);
    }

    previousHash = computedHash;
  }

  return {
    isValid: errors.length === 0,
    eventCount: events.length,
    rootHash: previousHash,
    errors,
  };
}

export function generateStreamProofManifest(aggregateId, events = []) {
  const chainResult = verifyStreamHashChain(events);

  return {
    aggregateId,
    eventCount: events.length,
    fromVersion: events.length > 0 ? events[0].version : 0,
    toVersion: events.length > 0 ? events[events.length - 1].version : 0,
    rootHash: chainResult.rootHash,
    isValid: chainResult.isValid,
    generatedAt: new Date(),
  };
}

export default {
  computeEventHash,
  verifyStreamHashChain,
  generateStreamProofManifest,
};
