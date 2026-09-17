import { calculateChecksum, verifyChecksum } from './checksum.js';
import { generateStreamProofManifest } from './hash-chain.js';

export function serializeToNDJSON(events = []) {
  if (!Array.isArray(events)) {
    return '';
  }
  return events.map(e => JSON.stringify(e)).join('\n');
}

export function generateArchivalBundle(aggregateId, events = [], { exportedBy = 'system' } = {}) {
  if (!aggregateId) {
    throw new Error('aggregateId is required to generate archival bundle.');
  }

  const safeEvents = Array.isArray(events) ? events : [];
  const eventsChecksum = calculateChecksum(safeEvents);
  const proofManifest = generateStreamProofManifest(aggregateId, safeEvents);

  return {
    manifestVersion: '1.0.0',
    aggregateId,
    exportedAt: new Date(),
    exportedBy,
    eventCount: safeEvents.length,
    fromVersion: safeEvents.length > 0 ? safeEvents[0].version : 0,
    toVersion: safeEvents.length > 0 ? safeEvents[safeEvents.length - 1].version : 0,
    eventsChecksum,
    proofManifest,
    events: safeEvents,
  };
}

export function validateArchivalBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    return { isValid: false, errors: ['Invalid bundle object'] };
  }

  const errors = [];

  if (!bundle.aggregateId) {
    errors.push('Missing aggregateId in bundle manifest');
  }

  if (!Array.isArray(bundle.events)) {
    errors.push('Missing or invalid events array in bundle');
    return { isValid: false, errors };
  }

  if (bundle.events.length !== bundle.eventCount) {
    errors.push(`Event count mismatch: manifest declares ${bundle.eventCount}, found ${bundle.events.length}`);
  }

  const isChecksumValid = verifyChecksum(bundle.events, bundle.eventsChecksum);
  if (!isChecksumValid) {
    errors.push('Events payload checksum mismatch (bundle may be corrupted or modified)');
  }

  for (let i = 0; i < bundle.events.length; i++) {
    const ev = bundle.events[i];
    const expectedVersion = (bundle.fromVersion || 1) + i;
    if (ev.version !== expectedVersion) {
      errors.push(`Version sequence break at index ${i}: expected ${expectedVersion}, got ${ev.version}`);
    }
  }

  return {
    isValid: errors.length === 0,
    aggregateId: bundle.aggregateId,
    eventCount: bundle.events.length,
    errors,
  };
}

export default {
  serializeToNDJSON,
  generateArchivalBundle,
  validateArchivalBundle,
};
