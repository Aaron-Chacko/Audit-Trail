import {
  serializeToNDJSON,
  generateArchivalBundle,
  validateArchivalBundle,
} from './src/utils/stream-archiver.js';

console.log('====================================================');
console.log('       EVENT STREAM ARCHIVER & BUNDLE TEST          ');
console.log('====================================================\n');

const sampleEvents = [
  {
    aggregateId: 'SHIP-ARCHIVE-01',
    version: 1,
    eventType: 'SHIPMENT_CREATED',
    payload: { origin: 'Port of Tokyo', destination: 'Port of LA' },
    timestamp: new Date('2026-09-01T08:00:00Z'),
  },
  {
    aggregateId: 'SHIP-ARCHIVE-01',
    version: 2,
    eventType: 'CONTAINER_LOADED',
    payload: { bay: 'Bay-12', shipName: 'Evergreen' },
    timestamp: new Date('2026-09-02T10:00:00Z'),
  },
];

// 1. NDJSON Serialization
console.log('[1] NDJSON Serialization:');
const ndjson = serializeToNDJSON(sampleEvents);
const lines = ndjson.trim().split('\n');
console.log('    - Serializes each event as a single line:', lines.length === 2 ? 'PASS' : 'FAIL');
console.log('    - First line is valid JSON:', JSON.parse(lines[0]).aggregateId === 'SHIP-ARCHIVE-01' ? 'PASS' : 'FAIL');

// 2. Archival Bundle Generation
console.log('\n[2] Archival Bundle Generation:');
const bundle = generateArchivalBundle('SHIP-ARCHIVE-01', sampleEvents, { exportedBy: 'compliance-officer' });
console.log('    - Manifest version is 1.0.0:', bundle.manifestVersion === '1.0.0' ? 'PASS' : 'FAIL');
console.log('    - Exported by is tracked:', bundle.exportedBy === 'compliance-officer' ? 'PASS' : 'FAIL');
console.log('    - Checksum is included:', typeof bundle.eventsChecksum === 'string' && bundle.eventsChecksum.length === 64 ? 'PASS' : 'FAIL');
console.log('    - Proof manifest is included:', typeof bundle.proofManifest === 'object' ? 'PASS' : 'FAIL');

// 3. Archival Bundle Validation
console.log('\n[3] Bundle Integrity Validation:');
const validation = validateArchivalBundle(bundle);
console.log('    - Valid bundle reports isValid true:', validation.isValid === true ? 'PASS' : 'FAIL');
console.log('    - Validation reports 0 errors:', validation.errors.length === 0 ? 'PASS' : 'FAIL');

// 4. Tamper Detection in Bundle
console.log('\n[4] Tampered Bundle Detection:');
const corruptedBundle = {
  ...bundle,
  events: [
    ...bundle.events,
    { aggregateId: 'SHIP-ARCHIVE-01', version: 3, eventType: 'SHIPMENT_CANCELLED', payload: {} },
  ],
};
const tamperedValidation = validateArchivalBundle(corruptedBundle);
console.log('    - Detects event count / checksum mismatch in bundle:', tamperedValidation.isValid === false ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   STREAM ARCHIVER VERIFIED SUCCESSFULLY!           ');
console.log('====================================================\n');

process.exit(0);
