/**
 * constants/event-types.js
 *
 * Frontend mirror of server/src/events/event-types.js.
 *
 * ⚠️  SYNC RULE: This file must stay exactly in step with the backend list.
 *     Whenever a new event type is added to server/src/events/event-types.js,
 *     it must be added here too — in the same section, same name.
 *
 * Why duplicate at all? The frontend is a separate build (Vite bundle).
 * It cannot import directly from the server package. This is the accepted
 * tradeoff in a monorepo without a shared-packages layer.
 *
 * Future option: extract both into a shared /packages/event-types package
 * and import from there on both sides.
 */

// ─── Shipment lifecycle ────────────────────────────────────────────────────────
export const SHIPMENT_CREATED        = 'SHIPMENT_CREATED';
export const SHIPMENT_DEPARTED       = 'SHIPMENT_DEPARTED';
export const SHIPMENT_ARRIVED        = 'SHIPMENT_ARRIVED';
export const SHIPMENT_CANCELLED      = 'SHIPMENT_CANCELLED';
export const SHIPMENT_STATUS_UPDATED = 'SHIPMENT_STATUS_UPDATED';

// ─── Container operations ──────────────────────────────────────────────────────
export const CONTAINER_CREATED  = 'CONTAINER_CREATED';
export const CONTAINER_LOADED   = 'CONTAINER_LOADED';   // Container loaded onto a vessel
export const CONTAINER_UNLOADED = 'CONTAINER_UNLOADED'; // Container offloaded at port
export const LOADED_ON_SHIP     = 'LOADED_ON_SHIP';     // Alias — kept for spec compat

// ─── Sensor / condition events ────────────────────────────────────────────────
export const TEMPERATURE_SPIKE = 'TEMPERATURE_SPIKE'; // Temp exceeded threshold
export const HUMIDITY_ALERT    = 'HUMIDITY_ALERT';    // Humidity out of safe range
export const SENSOR_READING    = 'SENSOR_READING';    // Routine sensor data point

// ─── Port / logistics ─────────────────────────────────────────────────────────
export const ARRIVED_AT_PORT    = 'ARRIVED_AT_PORT';
export const DEPARTED_FROM_PORT = 'DEPARTED_FROM_PORT';
export const CUSTOMS_CLEARED    = 'CUSTOMS_CLEARED';
export const CUSTOMS_HELD       = 'CUSTOMS_HELD';

// ─── Convenience set ──────────────────────────────────────────────────────────
export const ALL_EVENT_TYPES = Object.freeze([
  SHIPMENT_CREATED,
  SHIPMENT_DEPARTED,
  SHIPMENT_ARRIVED,
  SHIPMENT_CANCELLED,
  SHIPMENT_STATUS_UPDATED,
  CONTAINER_CREATED,
  CONTAINER_LOADED,
  CONTAINER_UNLOADED,
  LOADED_ON_SHIP,
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  SENSOR_READING,
  ARRIVED_AT_PORT,
  DEPARTED_FROM_PORT,
  CUSTOMS_CLEARED,
  CUSTOMS_HELD,
]);

/**
 * Human-readable labels for each event type.
 * Used by the Timeline component to display friendly text instead of
 * screaming-snake-case strings.
 *
 * Add a label entry every time you add a new event type constant above.
 */
export const EVENT_TYPE_LABELS = Object.freeze({
  [SHIPMENT_CREATED]:        'Shipment Created',
  [SHIPMENT_DEPARTED]:       'Shipment Departed',
  [SHIPMENT_ARRIVED]:        'Shipment Arrived',
  [SHIPMENT_CANCELLED]:      'Shipment Cancelled',
  [SHIPMENT_STATUS_UPDATED]: 'Status Updated',
  [CONTAINER_CREATED]:       'Container Created',
  [CONTAINER_LOADED]:        'Container Loaded',
  [CONTAINER_UNLOADED]:      'Container Unloaded',
  [LOADED_ON_SHIP]:          'Loaded on Ship',
  [TEMPERATURE_SPIKE]:       'Temperature Spike ⚠️',
  [HUMIDITY_ALERT]:          'Humidity Alert ⚠️',
  [SENSOR_READING]:          'Sensor Reading',
  [ARRIVED_AT_PORT]:         'Arrived at Port',
  [DEPARTED_FROM_PORT]:      'Departed from Port',
  [CUSTOMS_CLEARED]:         'Customs Cleared',
  [CUSTOMS_HELD]:            'Customs Hold 🔴',
});

/**
 * Events that indicate a warning/alert condition.
 * Used by the UI to apply red/amber styling to affected timeline entries.
 */
export const ALERT_EVENT_TYPES = Object.freeze([
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  CUSTOMS_HELD,
]);
