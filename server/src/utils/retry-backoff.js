/**
 * retry-backoff.js
 * Exponential backoff retry utility for transient event-store failures.
 *
 * Supports:
 * - Configurable base delay, multiplier and max attempts
 * - Optional jitter to spread load during thundering-herd scenarios
 * - Per-attempt error predicate so only retryable errors are retried
 */

const DEFAULT_OPTIONS = {
  maxAttempts: 4,
  baseDelayMs: 50,
  multiplier: 2,
  maxDelayMs: 2000,
  jitter: true,
};

/**
 * Sleep for `ms` milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compute the delay for a given attempt index using exponential backoff.
 * @param {number} attempt  0-indexed attempt number
 * @param {object} opts
 * @returns {number} delay in milliseconds
 */
export function computeDelay(attempt, opts = {}) {
  const { baseDelayMs, multiplier, maxDelayMs, jitter } = { ...DEFAULT_OPTIONS, ...opts };
  let delay = baseDelayMs * Math.pow(multiplier, attempt);
  delay = Math.min(delay, maxDelayMs);
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  return Math.round(delay);
}

/**
 * Execute `fn` with exponential backoff retry on failure.
 *
 * @param {Function} fn                   Async function to execute
 * @param {Function} [isRetryable]        Predicate deciding if the error is retryable. Defaults to always retry.
 * @param {object}   [opts]               Override default backoff options
 * @returns {Promise<*>}                  Resolves with fn's return value
 * @throws  {Error}                       Re-throws last error after exhausting attempts
 */
export async function withRetry(fn, isRetryable = () => true, opts = {}) {
  const config = { ...DEFAULT_OPTIONS, ...opts };
  let lastError;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;

      const shouldRetry = isRetryable(err, attempt);
      const isLastAttempt = attempt === config.maxAttempts - 1;

      if (!shouldRetry || isLastAttempt) {
        throw err;
      }

      const delay = computeDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError;
}

export default { withRetry, computeDelay };
