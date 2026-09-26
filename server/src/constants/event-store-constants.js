/**
 * event-store-constants.js
 *
 * Centralised constants used across the event-store subsystem.
 * Keeping them here (rather than scattered in individual files) ensures a
 * single source of truth and makes tuning easier in different environments.
 *
 * @module constants/event-store-constants
 */

// ── Concurrency Control ───────────────────────────────────────────────────────

/**
 * Maximum number of OCC (Optimistic Concurrency Control) retry attempts
 * before a command is permanently rejected with a 409 Conflict response.
 * @constant {number}
 */
export const OCC_MAX_RETRIES = 3;

/**
 * Base delay in milliseconds between OCC retry attempts.
 * Actual delay is randomised with ±30 % jitter to spread burst retries.
 * @constant {number}
 */
export const OCC_RETRY_BASE_DELAY_MS = 50;

// ── Event Stream Limits ───────────────────────────────────────────────────────

/**
 * Hard upper bound on the number of events returned by a single stream query.
 * Prevents runaway reads on long-lived aggregates.
 * @constant {number}
 */
export const STREAM_MAX_FETCH_LIMIT = 1_000;

/**
 * Default page size for paginated event stream queries.
 * @constant {number}
 */
export const STREAM_DEFAULT_PAGE_SIZE = 100;

/**
 * Minimum version accepted in slice queries (always 1 — events are 1-indexed).
 * @constant {number}
 */
export const STREAM_MIN_VERSION = 1;

// ── Snapshot Policy ───────────────────────────────────────────────────────────

/**
 * Number of events between automatic snapshot captures.
 * Lower values reduce replay cost at the expense of more frequent writes.
 * @constant {number}
 */
export const SNAPSHOT_INTERVAL = 10;

/**
 * Maximum number of snapshots retained per aggregate stream.
 * Older snapshots beyond this limit are eligible for archival.
 * @constant {number}
 */
export const SNAPSHOT_RETENTION_COUNT = 5;

// ── Payload Constraints ───────────────────────────────────────────────────────

/**
 * Maximum byte size of a serialised event payload (1 MiB).
 * @constant {number}
 */
export const PAYLOAD_MAX_BYTES = 1_048_576;

/**
 * Maximum length of an aggregateId string (characters).
 * @constant {number}
 */
export const AGGREGATE_ID_MAX_LENGTH = 128;

// ── Archive / Compaction ──────────────────────────────────────────────────────

/**
 * Number of days after which events in a completed aggregate stream are
 * eligible to be moved to cold storage (archival tier).
 * @constant {number}
 */
export const ARCHIVE_AFTER_DAYS = 365;

/**
 * Minimum number of events in a stream before compaction is considered.
 * @constant {number}
 */
export const COMPACTION_MIN_EVENTS = 20;

// ── Global Stream Subscription ────────────────────────────────────────────────

/**
 * Polling interval for the global event subscription bus (milliseconds).
 * Keeps subscription latency low without hammering MongoDB.
 * @constant {number}
 */
export const SUBSCRIPTION_POLL_INTERVAL_MS = 500;

/**
 * Maximum number of events fetched per subscription poll tick.
 * @constant {number}
 */
export const SUBSCRIPTION_BATCH_SIZE = 50;

// ── Hash Chain ────────────────────────────────────────────────────────────────

/**
 * HMAC algorithm used for hash-chain event fingerprinting.
 * @constant {string}
 */
export const HASH_CHAIN_ALGORITHM = 'sha256';

/**
 * Sentinel hash used as the prev-hash of the very first event in a stream.
 * Must be deterministic so any node can verify chain integrity from genesis.
 * @constant {string}
 */
export const HASH_CHAIN_GENESIS_PREV = '0000000000000000000000000000000000000000000000000000000000000000';

export default {
  OCC_MAX_RETRIES,
  OCC_RETRY_BASE_DELAY_MS,
  STREAM_MAX_FETCH_LIMIT,
  STREAM_DEFAULT_PAGE_SIZE,
  STREAM_MIN_VERSION,
  SNAPSHOT_INTERVAL,
  SNAPSHOT_RETENTION_COUNT,
  PAYLOAD_MAX_BYTES,
  AGGREGATE_ID_MAX_LENGTH,
  ARCHIVE_AFTER_DAYS,
  COMPACTION_MIN_EVENTS,
  SUBSCRIPTION_POLL_INTERVAL_MS,
  SUBSCRIPTION_BATCH_SIZE,
  HASH_CHAIN_ALGORITHM,
  HASH_CHAIN_GENESIS_PREV,
};
