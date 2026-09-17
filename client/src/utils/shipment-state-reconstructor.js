import {
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
} from '../constants/event-types.js';

/**
 * Pure function that applies a single immutable event to derive the next state snapshot.
 *
 * @param {object|null} state - Previous reconstructed aggregate state
 * @param {object} event - Event object
 * @returns {object} Next reconstructed state
 */
export function applyEventToShipmentState(state, event) {
  if (!event) return state;

  const payload = event.payload || {};
  const current = state || {
    aggregateId: event.aggregateId,
    status: 'created',
    origin: null,
    destination: null,
    currentLocation: null,
    vessel: null,
    cargo: null,
    sensorState: {
      temperature: null,
      humidity: null,
      recordedAt: null,
    },
    flags: {
      hasTemperatureSpike: false,
      hasHumidityAlert: false,
      customsHeld: false,
    },
    version: 0,
    lastEvent: null,
    eventsReplayed: 0,
  };

  const next = {
    ...current,
    version: event.version,
    lastEvent: event,
    eventsReplayed: current.eventsReplayed + 1,
  };

  switch (event.eventType) {
    case SHIPMENT_CREATED:
    case CONTAINER_CREATED:
      return {
        ...next,
        status: 'created',
        origin: payload.origin || current.origin,
        destination: payload.destination || current.destination,
        currentLocation: payload.origin || payload.currentLocation || current.currentLocation,
        vessel: payload.vessel || current.vessel,
        cargo: payload.cargo || current.cargo,
      };

    case SHIPMENT_DEPARTED:
    case DEPARTED_FROM_PORT:
      return {
        ...next,
        status: 'in_transit',
        currentLocation: payload.location || payload.origin || current.currentLocation,
      };

    case CONTAINER_LOADED:
    case LOADED_ON_SHIP:
      return {
        ...next,
        status: 'loaded',
        vessel: payload.vessel || (payload.vesselName ? { name: payload.vesselName } : current.vessel),
        currentLocation: payload.location || payload.port ? { port: payload.port } : current.currentLocation,
      };

    case ARRIVED_AT_PORT:
    case SHIPMENT_ARRIVED:
      return {
        ...next,
        status: 'arrived',
        currentLocation: payload.location || (payload.port ? { port: payload.port } : current.destination),
      };

    case CONTAINER_UNLOADED:
      return {
        ...next,
        status: 'unloaded',
        currentLocation: payload.location || current.currentLocation,
      };

    case SHIPMENT_CANCELLED:
      return {
        ...next,
        status: 'cancelled',
      };

    case SHIPMENT_STATUS_UPDATED:
      return {
        ...next,
        status: payload.status || current.status,
      };

    case TEMPERATURE_SPIKE:
      return {
        ...next,
        sensorState: {
          ...current.sensorState,
          temperature: payload.temperature,
          recordedAt: event.timestamp,
        },
        flags: {
          ...current.flags,
          hasTemperatureSpike: true,
        },
      };

    case HUMIDITY_ALERT:
      return {
        ...next,
        sensorState: {
          ...current.sensorState,
          humidity: payload.humidity,
          recordedAt: event.timestamp,
        },
        flags: {
          ...current.flags,
          hasHumidityAlert: true,
        },
      };

    case SENSOR_READING:
      return {
        ...next,
        sensorState: {
          ...current.sensorState,
          temperature: payload.temperature ?? current.sensorState.temperature,
          humidity: payload.humidity ?? current.sensorState.humidity,
          recordedAt: event.timestamp,
        },
      };

    case CUSTOMS_HELD:
      return {
        ...next,
        flags: {
          ...current.flags,
          customsHeld: true,
        },
      };

    case CUSTOMS_CLEARED:
      return {
        ...next,
        flags: {
          ...current.flags,
          customsHeld: false,
        },
      };

    default:
      return next;
  }
}

/**
 * Reconstructs the aggregate state by replaying all events up to a given version.
 *
 * @param {Array} events - Sorted events array
 * @param {number} targetVersion - The aggregate version to reconstruct up to
 * @returns {object|null} Reconstructed aggregate state
 */
export function reconstructStateAtVersion(events, targetVersion) {
  if (!events || events.length === 0) return null;

  const validEvents = [...events]
    .filter((e) => (e.version ?? 0) <= targetVersion)
    .sort((a, b) => (a.version ?? 0) - (b.version ?? 0));

  if (validEvents.length === 0) return null;

  let state = null;
  for (const event of validEvents) {
    state = applyEventToShipmentState(state, event);
  }

  return state;
}

/**
 * Reconstructs the aggregate state by replaying all events up to a given timestamp.
 *
 * @param {Array} events - Sorted events array
 * @param {string|Date} timestamp - The point-in-time timestamp
 * @returns {object|null} Reconstructed aggregate state
 */
export function reconstructStateAtTimestamp(events, timestamp) {
  if (!events || events.length === 0 || !timestamp) return null;
  const cutoff = new Date(timestamp).getTime();

  const validEvents = [...events]
    .filter((e) => new Date(e.timestamp).getTime() <= cutoff)
    .sort((a, b) => (a.version ?? 0) - (b.version ?? 0));

  if (validEvents.length === 0) return null;

  let state = null;
  for (const event of validEvents) {
    state = applyEventToShipmentState(state, event);
  }

  return state;
}
