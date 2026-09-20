/**
 * rate-limiter.js
 *
 * Lightweight in-memory sliding-window rate limiter for command endpoints.
 * Designed for single-process use (no Redis dependency) — suitable for
 * development, staging, and low-traffic production deployments.
 *
 * For multi-instance deployments swap the WindowStore implementation with a
 * Redis-backed store while keeping the same public interface.
 *
 * @module utils/rate-limiter
 */

/**
 * @typedef {Map<string, number[]>} WindowStore
 * A map of key → sorted array of hit timestamps (ms).
 */

/** @type {WindowStore} */
const _store = new Map();

/**
 * Sliding-window rate limiter configuration.
 *
 * @typedef {object} RateLimitConfig
 * @property {number} windowMs  - Duration of the sliding window in milliseconds.
 * @property {number} maxHits   - Maximum allowed hits within the window.
 * @property {string} [prefix]  - Optional key prefix for namespace isolation.
 */

/**
 * @typedef {object} RateLimitResult
 * @property {boolean} allowed       - True if the request is within limits.
 * @property {number}  remaining     - Hits remaining in the current window.
 * @property {number}  resetAfterMs  - Milliseconds until the oldest hit expires.
 * @property {number}  totalHits     - Total hits in the current window (including this one).
 */

/**
 * Record a hit for the given key and return the rate-limit decision.
 *
 * @param {string}          key    - Unique identifier (e.g. IP address, userId, aggregateId).
 * @param {RateLimitConfig} config - Sliding-window parameters.
 * @returns {RateLimitResult}
 *
 * @example
 * const result = checkRateLimit(`cmd:${req.ip}`, { windowMs: 60_000, maxHits: 30 });
 * if (!result.allowed) {
 *   return res.status(429).json({ error: 'Too many requests', retryAfter: result.resetAfterMs });
 * }
 */
export function checkRateLimit(key, config) {
  const { windowMs, maxHits, prefix = 'rl' } = config;
  const storeKey = `${prefix}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Retrieve existing hits and prune those outside the window
  const hits = (_store.get(storeKey) || []).filter((ts) => ts > windowStart);
  hits.push(now);
  _store.set(storeKey, hits);

  const totalHits = hits.length;
  const allowed = totalHits <= maxHits;
  const remaining = Math.max(0, maxHits - totalHits);
  const resetAfterMs = hits.length > 0 ? hits[0] + windowMs - now : windowMs;

  return { allowed, remaining, resetAfterMs, totalHits };
}

/**
 * Remove all recorded hits for a key (e.g. after a successful auth).
 *
 * @param {string} key    - The same key passed to checkRateLimit.
 * @param {string} prefix - Must match the prefix used in checkRateLimit.
 * @returns {void}
 */
export function resetRateLimit(key, prefix = 'rl') {
  _store.delete(`${prefix}:${key}`);
}

/**
 * Purge all keys whose window has fully expired.
 * Call periodically (e.g. via setInterval) to prevent memory growth.
 *
 * @param {number} maxAgeMs - Entries older than this value are removed.
 * @returns {number} Number of keys evicted.
 */
export function evictExpired(maxAgeMs) {
  const cutoff = Date.now() - maxAgeMs;
  let evicted = 0;

  for (const [key, hits] of _store.entries()) {
    const fresh = hits.filter((ts) => ts > cutoff);
    if (fresh.length === 0) {
      _store.delete(key);
      evicted++;
    } else {
      _store.set(key, fresh);
    }
  }

  return evicted;
}

/**
 * Express middleware factory that applies rate-limiting to a route.
 *
 * @param {RateLimitConfig} config - Sliding-window parameters.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * app.use('/api/commands', rateLimitMiddleware({ windowMs: 60_000, maxHits: 60 }));
 */
export function rateLimitMiddleware(config) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const result = checkRateLimit(key, config);

    res.setHeader('X-RateLimit-Limit', config.maxHits);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAfterMs / 1000));

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        data: null,
        error: {
          message: 'Too many requests — please slow down',
          retryAfterMs: result.resetAfterMs,
        },
      });
    }

    next();
  };
}

export default { checkRateLimit, resetRateLimit, evictExpired, rateLimitMiddleware };
