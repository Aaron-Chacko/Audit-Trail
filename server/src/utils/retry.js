/**
 * retry.js
 *
 * Generic exponential-back-off retry wrapper for async operations.
 * Used for transient MongoDB write failures and external API calls.
 *
 * @module utils/retry
 */

/**
 * Default jitter factor (0–1) added to each delay to avoid thundering-herd.
 * @constant {number}
 */
const DEFAULT_JITTER = 0.2;

/**
 * Execute an async function with automatic retries using exponential back-off.
 *
 * @param {() => Promise<*>} fn          - Async function to attempt.
 * @param {object}           [opts]      - Configuration options.
 * @param {number}           [opts.maxAttempts=3]   - Maximum number of attempts (including first try).
 * @param {number}           [opts.baseDelayMs=150] - Base delay in ms before first retry.
 * @param {number}           [opts.maxDelayMs=5000] - Ceiling delay in ms.
 * @param {number}           [opts.jitter=0.2]      - Random jitter fraction applied to each delay.
 * @param {(err: Error, attempt: number) => boolean} [opts.shouldRetry]
 *   Predicate to decide whether a particular error warrants a retry.
 *   Defaults to retrying on all errors.
 * @returns {Promise<*>} Resolves with the first successful result.
 * @throws  {Error}     Re-throws the last error after all attempts are exhausted.
 *
 * @example
 * const result = await withRetry(() => Event.findOne({ aggregateId }), {
 *   maxAttempts: 4,
 *   baseDelayMs: 100,
 * });
 */
export async function withRetry(fn, opts = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 150,
    maxDelayMs = 5000,
    jitter = DEFAULT_JITTER,
    shouldRetry = () => true,
  } = opts;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts || !shouldRetry(err, attempt)) {
        throw err;
      }

      const exponential = baseDelayMs * 2 ** (attempt - 1);
      const capped = Math.min(exponential, maxDelayMs);
      const withJitter = capped * (1 + jitter * (Math.random() * 2 - 1));
      const delay = Math.round(withJitter);

      console.warn(
        `[retry] Attempt ${attempt}/${maxAttempts} failed — retrying in ${delay}ms. Error: ${err.message}`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wraps withRetry but only retries on transient MongoDB errors
 * (network timeouts, replica-set stepdowns, write conflicts).
 *
 * @param {() => Promise<*>} fn   - Async DB operation.
 * @param {object}           opts - Same options as withRetry.
 * @returns {Promise<*>}
 */
export function withDbRetry(fn, opts = {}) {
  return withRetry(fn, {
    maxAttempts: 3,
    baseDelayMs: 200,
    ...opts,
    shouldRetry: (err) => {
      const transientCodes = [6, 7, 89, 91, 189, 262, 10107, 11600, 11602, 13436, 63];
      return transientCodes.includes(err.code) || err.name === 'MongoNetworkError';
    },
  });
}

export default { withRetry, withDbRetry };
