/**
 * middleware/error-handler.js
 *
 * Centralised Express error-handling middleware.
 *
 * MUST be registered LAST in app.js (after all routes) so Express
 * routes errors through here via next(err).
 *
 * Covers:
 *  - Mongoose ValidationError   → 400
 *  - Mongoose CastError         → 400 (bad ObjectId, etc.)
 *  - Duplicate key (E11000)     → 409  (used for OCC conflicts)
 *  - ImmutabilityViolation      → 403
 *  - Joi / Zod ValidationError  → 422
 *  - Everything else            → 500
 */

import mongoose from 'mongoose';

export function errorHandler(err, req, res, next) {
  // ── Mongoose Validation (schema-level) ──────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        message: 'Validation failed',
        details: Object.values(err.errors).map((e) => e.message),
      },
    });
  }

  // ── Mongoose CastError (bad ID format, etc.) ────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { message: `Invalid value for field "${err.path}": ${err.value}` },
    });
  }

  // ── MongoDB Duplicate Key (E11000) — OCC conflict or unique violation ────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      data: null,
      error: {
        message: 'Conflict: a duplicate key violation occurred.',
        details: `Duplicate value for "${field}". If this is a version conflict, retry your command.`,
      },
    });
  }

  // ── Immutability Violation (thrown by Event schema hooks) ───────────────────
  if (err.name === 'ImmutabilityViolation') {
    return res.status(403).json({
      success: false,
      data: null,
      error: { message: err.message },
    });
  }

  // ── Joi Validation Error (thrown by validate middleware) ────────────────────
  if (err.name === 'ValidationError' && err.isJoi) {
    return res.status(422).json({
      success: false,
      data: null,
      error: {
        message: 'Input validation failed',
        details: err.details.map((d) => d.message),
      },
    });
  }

  // ── ConcurrencyError (thrown by command services for OCC) ───────────────────
  if (err.name === 'ConcurrencyError') {
    return res.status(409).json({
      success: false,
      data: null,
      error: { message: err.message },
    });
  }

  // ── NotFoundError ───────────────────────────────────────────────────────────
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      data: null,
      error: { message: err.message },
    });
  }

  // ── Fallback: unexpected error ──────────────────────────────────────────────
  console.error('[ErrorHandler]', err);

  return res.status(err.status || 500).json({
    success: false,
    data: null,
    error: {
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    },
  });
}
