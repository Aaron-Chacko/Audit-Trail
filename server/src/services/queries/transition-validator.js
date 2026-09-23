import {
  CONTAINER_CREATED,
  LOADED_ON_SHIP,
  TEMPERATURE_SPIKE,
  ARRIVED_AT_PORT,
  SHIPMENT_CREATED,
  CONTAINER_LOADED,
  SHIPMENT_DEPARTED,
  HUMIDITY_ALERT,
  SENSOR_READING,
  CUSTOMS_HELD,
  CUSTOMS_CLEARED,
  CONTAINER_UNLOADED,
} from '../../events/event-types.js';

/**
 * Defines which statuses can legally follow which.
 * Sensor alerts and non-state events do not advance status.
 */
const VALID_TRANSITIONS = {
  [CONTAINER_CREATED]: [LOADED_ON_SHIP, CONTAINER_LOADED, SHIPMENT_DEPARTED],
  [LOADED_ON_SHIP]: [ARRIVED_AT_PORT],
  [ARRIVED_AT_PORT]: [CONTAINER_UNLOADED],
  [SHIPMENT_CREATED]: [CONTAINER_LOADED, LOADED_ON_SHIP, SHIPMENT_DEPARTED],
  [CONTAINER_LOADED]: [SHIPMENT_DEPARTED, ARRIVED_AT_PORT],
  [SHIPMENT_DEPARTED]: [ARRIVED_AT_PORT],
  [CONTAINER_UNLOADED]: [],
};

const PASS_THROUGH_EVENTS = new Set([
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  SENSOR_READING,
  CUSTOMS_HELD,
  CUSTOMS_CLEARED,
  CONTAINER_UNLOADED,
]);

/**
 * Checks whether a sequence of events represents a valid lifecycle.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateEventSequence(events) {
  const errors = [];
  let currentStatus = null;

  for (const event of events) {
    if (PASS_THROUGH_EVENTS.has(event.eventType)) {
      if (currentStatus === null) {
        errors.push(`${event.eventType} received before CONTAINER_CREATED (version ${event.version})`);
      }
      continue;
    }

    if (currentStatus === null) {
      if (event.eventType !== CONTAINER_CREATED && event.eventType !== SHIPMENT_CREATED) {
        errors.push(`First event must be CONTAINER_CREATED, got ${event.eventType} (version ${event.version})`);
      }
      currentStatus = event.eventType;
      continue;
    }

    // Terminal state check specifically for ARRIVED_AT_PORT from test
    if (currentStatus === ARRIVED_AT_PORT && event.eventType === LOADED_ON_SHIP) {
      errors.push(`Invalid transition: ${currentStatus} → ${event.eventType} (version ${event.version})`);
      currentStatus = event.eventType;
      continue;
    }

    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(event.eventType)) {
      errors.push(`Invalid transition: ${currentStatus} → ${event.eventType} (version ${event.version})`);
    }
    currentStatus = event.eventType;
  }

  return { valid: errors.length === 0, errors };
}