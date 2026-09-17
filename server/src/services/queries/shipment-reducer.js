import { CONTAINER_CREATED, LOADED_ON_SHIP, TEMPERATURE_SPIKE, ARRIVED_AT_PORT } from '../../events/event-types.js';

// Pure function — no DB calls. Takes events, returns current state.
export function reduceShipmentEvents(events) {
  let state = null;
  for (const event of events) {
    state = applyEvent(state, event);
  }
  return state;
}

function applyEvent(state, event) {
  switch (event.eventType) {
    case CONTAINER_CREATED:
      return {
        aggregateId: event.aggregateId,
        status: 'CREATED',
        destination: event.payload?.destination || null,
        temperature: null,
        flags: { hasTemperatureSpike: false, customsHeld: false },
        lastEventVersion: event.version,
        eventHistory: [{ eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };

    case LOADED_ON_SHIP:
      // BUG-9 FIX: Guard against null state (e.g. missing CONTAINER_CREATED event)
      if (!state) {
        console.warn(`[Reducer] ${event.eventType} received with no prior state (version ${event.version}). Skipping.`);
        return state;
      }
      return {
        ...state,
        status: 'LOADED_ON_SHIP',
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };

    case TEMPERATURE_SPIKE:
      if (!state) {
        console.warn(`[Reducer] ${event.eventType} received with no prior state (version ${event.version}). Skipping.`);
        return state;
      }
      return {
        ...state,
        temperature: event.payload?.temperature,
        flags: { ...state.flags, hasTemperatureSpike: true },
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };

    case ARRIVED_AT_PORT:
      if (!state) {
        console.warn(`[Reducer] ${event.eventType} received with no prior state (version ${event.version}). Skipping.`);
        return state;
      }
      return {
        ...state,
        status: 'ARRIVED_AT_PORT',
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };

    default:
      console.warn(`Unhandled event type in reducer: ${event.eventType}`);
      return state;
  }
}

// Same as above, but only replays events up to a given timestamp
export function reduceShipmentEventsUpTo(events, timestamp) {
  const filtered = events.filter(e => new Date(e.timestamp) <= new Date(timestamp));
  return reduceShipmentEvents(filtered);
}