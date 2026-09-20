/**
 * logger.js
 *
 * Structured JSON logger for the Audit Trail server.
 * Wraps console.* calls with consistent metadata (timestamp, level, context)
 * so logs can be ingested by Datadog, Loki, or any JSON-aware log aggregator.
 *
 * Levels (from lowest to highest severity):
 *   debug → info → warn → error → fatal
 *
 * Usage:
 *   import { createLogger } from '../utils/logger.js';
 *   const log = createLogger('event-store-service');
 *   log.info('Event appended', { aggregateId, version });
 *
 * @module utils/logger
 */

/**
 * @typedef {'debug'|'info'|'warn'|'error'|'fatal'} LogLevel
 */

/**
 * Numeric severity values for log-level filtering.
 * @constant {Record<LogLevel, number>}
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };

/**
 * Minimum log level derived from the LOG_LEVEL environment variable.
 * Defaults to 'info' in production and 'debug' in development/test.
 * @constant {number}
 */
const MIN_LEVEL_NUM = (() => {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  return LEVELS[env] ?? (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);
})();

/**
 * Emit a structured log entry to stdout (info/debug) or stderr (warn/error/fatal).
 *
 * @param {LogLevel} level   - Severity level.
 * @param {string}   context - Module or service name (appears in every log line).
 * @param {string}   message - Human-readable description.
 * @param {object}   [meta]  - Arbitrary key→value pairs to include in the JSON output.
 * @returns {void}
 */
function emit(level, context, message, meta = {}) {
  if ((LEVELS[level] ?? 0) < MIN_LEVEL_NUM) return;

  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ctx: context,
    msg: message,
    ...meta,
  });

  if (level === 'warn' || level === 'error' || level === 'fatal') {
    process.stderr.write(entry + '\n');
  } else {
    process.stdout.write(entry + '\n');
  }
}

/**
 * @typedef {object} Logger
 * @property {(msg: string, meta?: object) => void} debug
 * @property {(msg: string, meta?: object) => void} info
 * @property {(msg: string, meta?: object) => void} warn
 * @property {(msg: string, meta?: object) => void} error
 * @property {(msg: string, meta?: object) => void} fatal
 * @property {(childCtx: string) => Logger} child  - Create a child logger with a more specific context.
 */

/**
 * Create a named logger bound to a specific module or service context.
 *
 * @param {string} context - Identifies the source of log lines (e.g. 'event-store-service').
 * @returns {Logger}
 *
 * @example
 * const log = createLogger('shipment-command-handler');
 * log.info('Command received', { commandType: 'MOVE_SHIPMENT', aggregateId });
 * log.error('OCC conflict', { expectedVersion, actualVersion });
 */
export function createLogger(context) {
  return {
    debug: (msg, meta) => emit('debug', context, msg, meta),
    info:  (msg, meta) => emit('info',  context, msg, meta),
    warn:  (msg, meta) => emit('warn',  context, msg, meta),
    error: (msg, meta) => emit('error', context, msg, meta),
    fatal: (msg, meta) => emit('fatal', context, msg, meta),

    /**
     * Derive a child logger that inherits the parent context but appends a
     * sub-context suffix (useful for per-request or per-aggregate logging).
     *
     * @param {string} childCtx - Suffix to append (e.g. aggregateId).
     * @returns {Logger}
     */
    child(childCtx) {
      return createLogger(`${context}:${childCtx}`);
    },
  };
}

/**
 * Module-level root logger for one-off log calls outside a named service.
 * Prefer createLogger() for any reusable module.
 */
export const rootLogger = createLogger('root');

export default { createLogger, rootLogger };
