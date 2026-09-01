/**
 * events/event-types.js
 *
 * Single source of truth for every event type string used across
 * the system. Import from here — never use raw string literals.
 *
 * Naming convention: DOMAIN_VERB (screaming snake-case).
 * Grouping by domain makes it easy to see which aggregates produce which events.
 */

// ─── Shipment lifecycle ────────────────────────────────────────────────────────
export const SHIPMENT_CREATED      = 'SHIPMENT_CREATED';
export const SHIPMENT_DEPARTED     = 'SHIPMENT_DEPARTED';
export const SHIPMENT_ARRIVED      = 'SHIPMENT_ARRIVED';
export const SHIPMENT_CANCELLED    = 'SHIPMENT_CANCELLED';
export const SHIPMENT_STATUS_UPDATED = 'SHIPMENT_STATUS_UPDATED';

// ─── Container operations ──────────────────────────────────────────────────────
export const CONTAINER_CREATED     = 'CONTAINER_CREATED';
export const CONTAINER_LOADED      = 'CONTAINER_LOADED';       // Container loaded onto a vessel
export const CONTAINER_UNLOADED    = 'CONTAINER_UNLOADED';     // Container offloaded at port
export const LOADED_ON_SHIP        = 'LOADED_ON_SHIP';         // Alias kept for backward compat with spec

// ─── Sensor / condition events ────────────────────────────────────────────────
export const TEMPERATURE_SPIKE     = 'TEMPERATURE_SPIKE';      // Temp exceeded threshold
export const HUMIDITY_ALERT        = 'HUMIDITY_ALERT';         // Humidity out of safe range
export const SENSOR_READING        = 'SENSOR_READING';         // Routine sensor data point

// ─── Port / logistics ─────────────────────────────────────────────────────────
export const ARRIVED_AT_PORT       = 'ARRIVED_AT_PORT';
export const DEPARTED_FROM_PORT    = 'DEPARTED_FROM_PORT';
export const CUSTOMS_CLEARED       = 'CUSTOMS_CLEARED';
export const CUSTOMS_HELD          = 'CUSTOMS_HELD';

// ─── Grouped Category Arrays ──────────────────────────────────────────────────
export const SHIPMENT_EVENT_TYPES = Object.freeze([
  SHIPMENT_CREATED,
  SHIPMENT_DEPARTED,
  SHIPMENT_ARRIVED,
  SHIPMENT_CANCELLED,
  SHIPMENT_STATUS_UPDATED,
]);

export const CONTAINER_EVENT_TYPES = Object.freeze([
  CONTAINER_CREATED,
  CONTAINER_LOADED,
  CONTAINER_UNLOADED,
  LOADED_ON_SHIP,
]);

export const SENSOR_EVENT_TYPES = Object.freeze([
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  SENSOR_READING,
]);

export const PORT_EVENT_TYPES = Object.freeze([
  ARRIVED_AT_PORT,
  DEPARTED_FROM_PORT,
  CUSTOMS_CLEARED,
  CUSTOMS_HELD,
]);

// ─── Convenience set (useful for validation in Joi/Zod schemas) ────────────────
export const ALL_EVENT_TYPES = Object.freeze([
  ...SHIPMENT_EVENT_TYPES,
  ...CONTAINER_EVENT_TYPES,
  ...SENSOR_EVENT_TYPES,
  ...PORT_EVENT_TYPES,
]);

/**
 * Validates whether a given string is a recognised event type.
 * @param {string} eventType
 * @returns {boolean}
 */
export function isValidEventType(eventType) {
  return ALL_EVENT_TYPES.includes(eventType);
}
