/**
 * utils/formatters.js
 *
 * Domain-specific formatting helpers for shipment and sensor data.
 * Pure functions — no React imports, no side effects.
 */

import { EVENT_TYPE_LABELS } from '@/constants/event-types.js';

/**
 * Map an event type constant to a human-readable label.
 * Falls back to the raw constant if no label is registered.
 *
 * @param {string} eventType
 * @returns {string}
 */
export function formatEventType(eventType) {
  return EVENT_TYPE_LABELS[eventType] ?? eventType;
}

/**
 * Format a temperature value with unit.
 * Output: "12.8°C"
 *
 * @param {number|null} value
 * @returns {string}
 */
export function formatTemperature(value) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(1)}°C`;
}

/**
 * Format a humidity value with unit.
 * Output: "72%"
 *
 * @param {number|null} value
 * @returns {string}
 */
export function formatHumidity(value) {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}%`;
}

/**
 * Format a weight value in kg, with thousands separator.
 * Output: "12,500 kg"
 *
 * @param {number|null} weightKg
 * @returns {string}
 */
export function formatWeight(weightKg) {
  if (weightKg === null || weightKg === undefined) return '—';
  return `${Number(weightKg).toLocaleString('en-GB')} kg`;
}

/**
 * Map a shipment status string to a display-friendly badge label and colour key.
 *
 * @param {string} status
 * @returns {{ label: string, variant: 'neutral'|'info'|'success'|'warning'|'danger' }}
 */
export function formatShipmentStatus(status) {
  const map = {
    created:    { label: 'Created',    variant: 'neutral' },
    loaded:     { label: 'Loaded',     variant: 'info' },
    in_transit: { label: 'In Transit', variant: 'info' },
    arrived:    { label: 'Arrived',    variant: 'success' },
    unloaded:   { label: 'Unloaded',   variant: 'success' },
    cancelled:  { label: 'Cancelled',  variant: 'danger' },
  };
  return map[status] ?? { label: status, variant: 'neutral' };
}

/**
 * Truncate a long aggregate ID for compact display in tables/cards.
 * "SHIP-10042" stays as-is; a UUID is shortened to "a1b2c3d4…".
 *
 * @param {string} id
 * @param {number} [maxLength=12]
 * @returns {string}
 */
export function truncateId(id, maxLength = 12) {
  if (!id) return '';
  return id.length <= maxLength ? id : `${id.slice(0, maxLength)}…`;
}
