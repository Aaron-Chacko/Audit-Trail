/**
 * utils/date-helpers.js
 *
 * Date formatting utilities for event timestamps and the timeline scrubber.
 * All functions are pure — no side effects, easy to test.
 *
 * Uses Intl.DateTimeFormat (built-in) — no external date library needed yet.
 * If moment.js or date-fns is added later, migrate this file only.
 */

/**
 * Format an ISO timestamp for display in the event timeline.
 * Output: "25 Aug 2026, 10:30 AM"
 *
 * @param {string|Date} timestamp
 * @returns {string}
 */
export function formatEventTimestamp(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format a timestamp as a relative time string.
 * Output: "3 hours ago", "2 days ago"
 *
 * @param {string|Date} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffMs = date - Date.now();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSecs) < 60)  return rtf.format(diffSecs, 'second');
  if (Math.abs(diffMins) < 60)  return rtf.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(diffDays, 'day');
}

/**
 * Convert a Date to an ISO 8601 string suitable for the ?asOf= query param.
 *
 * @param {Date} date
 * @returns {string}
 */
export function toIsoString(date) {
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

/**
 * Parse an event timestamp safely. Returns null instead of throwing on bad input.
 *
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export function parseTimestamp(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
