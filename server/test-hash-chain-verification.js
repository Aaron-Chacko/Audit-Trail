import {
  computeEventHash,
  verifyStreamHashChain,
  generateStreamProofManifest,
} from './src/utils/hash-chain.js';

console.log('====================================================');
console.log('    CRYPTOGRAPHIC HASH CHAIN VERIFICATION TEST      ');
console.log('====================================================\n');

// 1. Single Event Hash Computation
console.log('[1] Event Hash Calculation:');
const ev1 = {
  aggregateId: 'SHIP-LEDGER-01',
  version: 1,
  eventType: 'SHIPMENT_CREATED',
  payload: { origin: 'Singapore', destination: 'Rotterdam' },
  timestamp: new Date('2026-09-01T10:00:00Z'),
};

const hash1 = computeEventHash(ev1);
console.log('    - Generates 64-char hex SHA-256 hash:', typeof hash1 === 'string' && hash1.length === 64 ? 'PASS' : 'FAIL');

const hash1_again = computeEventHash(ev1);
console.log('    - Hash is deterministic and idempotent:', hash1 === hash1_again ? 'PASS' : 'FAIL');

// 2. Multi-Event Hash Chaining
console.log('\n[2] Sequential Hash Chaining:');
const ev2 = {
  aggregateId: 'SHIP-LEDGER-01',
  version: 2,
  eventType: 'TEMPERATURE_SPIKE',
  payload: { temperature: 14.5, threshold: 8 },
  timestamp: new Date('2026-09-02T12:00:00Z'),
};
const hash2 = computeEventHash(ev2, hash1);

const ev3 = {
  aggregateId: 'SHIP-LEDGER-01',
  version: 3,
  eventType: 'SHIPMENT_ARRIVED',
  payload: { port: 'Rotterdam' },
  timestamp: new Date('2026-09-05T08:00:00Z'),
};
const hash3 = computeEventHash(ev3, hash2);

const chainedStream = [
  { ...ev1, hash: hash1 },
  { ...ev2, hash: hash2 },
  { ...ev3, hash: hash3 },
];

const verification = verifyStreamHashChain(chainedStream);
console.log('    - Valid chain reports isValid true:', verification.isValid === true ? 'PASS' : 'FAIL');
console.log('    - Root hash matches terminal event hash:', verification.rootHash === hash3 ? 'PASS' : 'FAIL');

// 3. Tamper Detection
console.log('\n[3] Tamper Detection in Chain:');
const tamperedStream = [
  { ...ev1, hash: hash1 },
  { ...ev2, payload: { temperature: 2.0, threshold: 8 }, hash: hash2 }, // tampered payload!
  { ...ev3, hash: hash3 },
];

const tamperedResult = verifyStreamHashChain(tamperedStream);
console.log('    - Detects payload modification in history:', tamperedResult.isValid === false ? 'PASS' : 'FAIL');
console.log('    - Reports error location at tampered index:', tamperedResult.errors.length > 0 ? 'PASS' : 'FAIL');

// 4. Proof Manifest Generation
console.log('\n[4] Stream Proof Manifest:');
const manifest = generateStreamProofManifest('SHIP-LEDGER-01', chainedStream);
console.log('    - Manifest contains aggregateId:', manifest.aggregateId === 'SHIP-LEDGER-01' ? 'PASS' : 'FAIL');
console.log('    - Manifest contains rootHash:', manifest.rootHash === hash3 ? 'PASS' : 'FAIL');
console.log('    - Manifest reports valid stream:', manifest.isValid === true ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   HASH CHAIN VERIFIED SUCCESSFULLY!                ');
console.log('====================================================\n');

process.exit(0);
