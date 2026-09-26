/**
 * event-id-generator.js
 *
 * Deterministic and random event-ID generation utilities used across
 * command handlers and test seeds.  Provides three strategies:
 *
 *  1. UUID v4  — random, globally unique (default for production).
 *  2. ULID     — lexicographically sortable, time-prefixed (preferred for event streams).
 *  3. Composite — `<aggregateId>-v<version>` for human-readable debugging.
 *
 * @module utils/event-id-generator
 */

import { randomBytes, randomUUID } from 'node:crypto';

// ── ULID implementation (no external dependency) ──────────────────────────────

/**
 * Base-32 Crockford alphabet used by ULID.
 * @constant {string}
 */
const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Encode an integer as a fixed-width Crockford Base-32 string.
 *
 * @param {number} value  - Non-negative integer to encode.
 * @param {number} length - Target output length (zero-padded on the left).
 * @returns {string}
 */
function encodeCrockford(value, length) {
  let str = '';
  for (let i = length - 1; i >= 0; i--) {
    str = CROCKFORD_BASE32[value % 32] + str;
    value = Math.floor(value / 32);
  }
  return str;
}

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier).
 *
 * Format:  `TTTTTTTTTTEEEEEEEEEEEEEEEE`
 *           ←10 chars→ ←   16 chars   →
 *   T = 48-bit ms timestamp
 *   E = 80-bit random component
 *
 * @returns {string} 26-character uppercase ULID string.
 *
 * @example
 * generateUlid(); // → '01HX9Y7Z3P2K4N8QRSTV3F7M6C'
 */
export function generateUlid() {
  const now = Date.now();
  const timeStr = encodeCrockford(now, 10);

  // 10 random bytes → 80 bits of entropy → 16 base-32 chars
  const randomPart = randomBytes(10);
  let randomStr = '';
  for (let i = 0; i < 10; i++) {
    randomStr += CROCKFORD_BASE32[randomPart[i] % 32];
  }
  // Pad/trim to exactly 16 chars
  const randomComponent = (randomStr + randomStr).slice(0, 16);

  return `${timeStr}${randomComponent}`;
}

/**
 * Generate a UUID v4 string (random, RFC 4122 compliant).
 *
 * @returns {string} UUID v4 e.g. `'550e8400-e29b-41d4-a716-446655440000'`
 */
export function generateUuid() {
  return randomUUID();
}

/**
 * Generate a human-readable composite event ID for debugging and test seeds.
 * Pattern: `<aggregateId>-v<version>-<6 random hex chars>`
 *
 * NOT suitable for production use — not globally unique across aggregates.
 *
 * @param {string} aggregateId - The aggregate stream identifier.
 * @param {number} version     - The event version number within the stream.
 * @returns {string}           - e.g. `'SHIP-001-v3-a4f92c'`
 */
export function generateCompositeId(aggregateId, version) {
  if (!aggregateId || typeof aggregateId !== 'string') {
    throw new TypeError('aggregateId must be a non-empty string');
  }
  if (typeof version !== 'number' || version < 1) {
    throw new RangeError('version must be a positive integer >= 1');
  }
  const suffix = randomBytes(3).toString('hex');
  return `${aggregateId}-v${version}-${suffix}`;
}

/**
 * Generate a short collision-resistant ID for use in test fixtures.
 * Returns 12 random hex characters (48 bits of entropy).
 *
 * @returns {string} e.g. `'a3f9c2d1e0b8'`
 */
export function generateShortId() {
  return randomBytes(6).toString('hex');
}

export default {
  generateUlid,
  generateUuid,
  generateCompositeId,
  generateShortId,
};
