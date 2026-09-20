/**
 * Cryptographic Event Signature & HMAC Validator
 * Generates and validates cryptographic HMAC-SHA256 signatures for event payloads
 * to guarantee non-repudiation, tamper detection, and cross-node authentication.
 */

import crypto from 'crypto';

const DEFAULT_SECRET = process.env.EVENT_SIGNING_SECRET || 'audit-trail-hmac-secret-key-2026';

/**
 * Deterministically serialize payload into stable string
 * @param {Object} payload
 * @returns {string}
 */
export function canonicalizePayload(payload) {
  if (payload === null || payload === undefined) return '';
  if (typeof payload !== 'object') return String(payload);

  const keys = Object.keys(payload).sort();
  const obj = {};
  for (const k of keys) {
    const val = payload[k];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      obj[k] = JSON.parse(canonicalizePayload(val));
    } else {
      obj[k] = val;
    }
  }
  return JSON.stringify(obj);
}

/**
 * Sign an event with HMAC-SHA256
 * @param {Object} event
 * @param {string} [secret=DEFAULT_SECRET]
 * @returns {string} Hex signature
 */
export function signEvent(event, secret = DEFAULT_SECRET) {
  if (!event) throw new Error('Event object is required for signing');
  const canonical = canonicalizePayload(event.payload);
  const dataToSign = `${event.aggregateId}|${event.eventType}|${event.version}|${event.timestamp}|${canonical}`;

  return crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');
}

/**
 * Verify event signature matches expected HMAC
 * @param {Object} event - Event containing metadata.signature or signature
 * @param {string} signature - Hex signature to verify against
 * @param {string} [secret=DEFAULT_SECRET]
 * @returns {boolean} True if signature is valid, false otherwise
 */
export function verifyEventSignature(event, signature, secret = DEFAULT_SECRET) {
  if (!event || !signature) return false;
  try {
    const expected = signEvent(event, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}
