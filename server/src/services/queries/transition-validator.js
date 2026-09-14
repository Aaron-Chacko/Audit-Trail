import { CONTAINER_CREATED, LOADED_ON_SHIP, TEMPERATURE_SPIKE, ARRIVED_AT_PORT } from '../../events/event-types.js';

/**
 * Defines which statuses can legally follow which.
 * TEMPERATURE_SPIKE doesn't change status, so it's allowed from any active state.
 */
const VALID_TRANSITIONS = {
  [CONTAINER_CREATED]: [LOADED_ON_SHIP],
  [LOADED_ON_SHIP]: [ARRIVED_AT_PORT],
  [ARRIVED_AT_PORT]: [], // terminal state — nothing should follow
};

/**
 * Checks whether a sequence of events represents a valid lifecycle.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateEventSequence(events) {
  const errors = [];
  let currentStatus = null;

  for (const event of events) {
    if (event.eventType === TEMPERATURE_SPIKE) {
      // Sensor events don't affect the status machine — always allowed once created
      if (currentStatus === null) {
        errors.push(`TEMPERATURE_SPIKE received before CONTAINER_CREATED (version ${event.version})`);
      }
      continue;
    }

    if (currentStatus === null) {
      if (event.eventType !== CONTAINER_CREATED) {
        errors.push(`First event must be CONTAINER_CREATED, got ${event.eventType} (version ${event.version})`);
      }
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