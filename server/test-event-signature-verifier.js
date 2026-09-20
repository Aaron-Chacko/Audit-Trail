/**
 * Test Suite: Cryptographic Event Signature & HMAC Validator
 */
import assert from 'assert';
import {
  canonicalizePayload,
  signEvent,
  verifyEventSignature
} from './src/utils/event-signature-verifier.js';

console.log('====================================================');
console.log('       EVENT SIGNATURE & HMAC VALIDATOR TEST        ');
console.log('====================================================\n');

const testSecret = 'secure-hmac-test-key-xyz';

const mockEvent = {
  aggregateId: 'SHP-SIG-2026',
  eventType: 'LOCATION_UPDATED',
  version: 3,
  timestamp: '2026-09-20T12:00:00.000Z',
  payload: {
    location: 'Singapore Hub',
    carrier: 'Pacific Marine',
    coordinates: { lat: 1.3521, lng: 103.8198 }
  }
};

console.log('[1] Canonical Payload Serialization:');
const canon1 = canonicalizePayload({ b: 2, a: 1 });
const canon2 = canonicalizePayload({ a: 1, b: 2 });
assert.strictEqual(canon1, canon2);
console.log('    - Key ordering deterministic canonicalization: PASS');

console.log('[2] Event Signing & Verification:');
const validSig = signEvent(mockEvent, testSecret);
assert.strictEqual(typeof validSig, 'string');
assert.strictEqual(validSig.length, 64); // SHA-256 hex length
const isValid = verifyEventSignature(mockEvent, validSig, testSecret);
assert.strictEqual(isValid, true);
console.log('    - Correct HMAC-SHA256 signature generation and match: PASS');

console.log('[3] Tampering Detection:');
const tamperedEvent = {
  ...mockEvent,
  payload: { ...mockEvent.payload, location: 'Rotterdam Hub' }
};
const isTamperedValid = verifyEventSignature(tamperedEvent, validSig, testSecret);
assert.strictEqual(isTamperedValid, false);
console.log('    - Rejects payload modification tampering: PASS');

console.log('[4] Wrong Secret Key Rejection:');
const wrongKeyValid = verifyEventSignature(mockEvent, validSig, 'wrong-secret-key-123');
assert.strictEqual(wrongKeyValid, false);
console.log('    - Rejects mismatched secret signatures: PASS');

console.log('\n====================================================');
console.log('   ALL EVENT SIGNATURE & HMAC TESTS PASSED! (4/4)   ');
console.log('====================================================\n');
