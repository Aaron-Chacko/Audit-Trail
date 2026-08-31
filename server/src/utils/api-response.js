/**
 * utils/api-response.js
 *
 * Shared helpers for constructing consistent API responses.
 *
 * Every endpoint in this project MUST use these helpers so the
 * response envelope is always:  { success, data, error }
 *
 * Rationale: a predictable shape means the React client can
 * use a single Axios/fetch interceptor to handle success/error
 * without per-route branching logic.
 */

/**
 * Send a successful response.
 *
 * @param {import('express').Response} res
 * @param {*}      data       - The response payload (object, array, null, etc.)
 * @param {number} [status=200] - HTTP status code
 */
export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

/**
 * Send an error response.
 *
 * @param {import('express').Response} res
 * @param {string} message    - Human-readable error message
 * @param {number} [status=500] - HTTP status code
 * @param {*}      [details=null] - Optional extra error context (omitted in production)
 */
export function sendError(res, message, status = 500, details = null) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
    },
  });
}
