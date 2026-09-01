/**
 * api/client.js
 *
 * The single Axios instance used by every API module in this project.
 *
 * RULE: Nothing outside of /api should ever call axios directly.
 *       Components, hooks, and pages import from /api/shipments.js etc.
 *
 * What this instance provides:
 *   1. baseURL from VITE_API_BASE_URL env var (never hardcoded)
 *   2. JSON content-type header on every request
 *   3. Response interceptor that unwraps { success, data, error } so
 *      callers always receive `data` on success and a thrown Error on failure.
 *      This means no page or hook ever has to check `response.success` manually.
 */

import axios from 'axios';

// Vite exposes env vars prefixed with VITE_ to the browser bundle.
// Falls back to empty string so the Vite dev proxy picks up /api calls.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 10-second timeout — prevents requests hanging forever on a stalled backend
  timeout: 10_000,
});

// ── Response Interceptor ────────────────────────────────────────────────────────
//
// Every backend response looks like: { success: boolean, data: any, error: any }
// This interceptor unwraps the envelope so the caller just gets `data`.
//
// Success path:  response.data.success === true  → resolve with response.data.data
// Failure path:  response.data.success === false → reject with an Error
//                (HTTP 4xx/5xx)                 → reject with an Error

apiClient.interceptors.response.use(
  // ── Fulfilled (HTTP 2xx) ─────────────────────────────────────────────────────
  (response) => {
    const envelope = response.data;

    // Guard: the backend always sends { success, data, error }.
    // If the shape is missing (e.g. a raw Express error leaked through),
    // treat it as a server error rather than silently returning undefined.
    if (typeof envelope.success === 'undefined') {
      return Promise.reject(
        new Error('Unexpected response shape from server — missing "success" field.')
      );
    }

    if (envelope.success) {
      // Return the unwrapped payload so callers do: const data = await getShipmentById(id)
      return envelope.data;
    }

    // Backend returned HTTP 2xx but with success: false (shouldn't normally happen,
    // but handle it defensively)
    const message = envelope.error?.message ?? 'An unknown error occurred.';
    return Promise.reject(new Error(message));
  },

  // ── Rejected (HTTP 4xx / 5xx / network error) ────────────────────────────────
  (error) => {
    // Axios populates error.response when the server replied with an error status.
    // If error.response is undefined it's a network/timeout error.
    const serverError = error.response?.data?.error;
    const message =
      serverError?.message ??
      error.message ??
      'Network error — please check your connection.';

    // Attach the HTTP status to the error for callers that need to differentiate
    // (e.g. 409 Conflict for OCC retries vs 404 Not Found for missing shipments)
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status ?? null;
    enhancedError.details = serverError?.details ?? null;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
