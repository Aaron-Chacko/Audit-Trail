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
  SHIPMENT_ARRIVED,
} from '../../events/event-types.js';

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
    case SHIPMENT_CREATED: {
      const orig = event.payload?.origin || { port: '', country: '' };
      const dest = event.payload?.destination || (typeof event.payload?.destination === 'string' ? { port: event.payload.destination, country: '' } : { port: '', country: '' });
      return {
        aggregateId: event.aggregateId,
        status: 'CREATED',
        origin: orig,
        destination: dest,
        currentLocation: orig,
        vessel: event.payload?.vessel || null,
        cargo: event.payload?.cargo || null,
        temperature: null,
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
        lastEventVersion: event.version,
        eventHistory: [{ eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case LOADED_ON_SHIP:
    case CONTAINER_LOADED: {
      if (!state) {
        console.warn(`[Reducer] ${event.eventType} received with no prior state (version ${event.version}). Skipping.`);
        return state;
      }
      const vessel = event.payload?.vesselName ? { name: event.payload.vesselName } : state.vessel;
      const port = event.payload?.port;
      return {
        ...state,
        status: 'LOADED_ON_SHIP',
        vessel,
        currentLocation: port ? { port } : state.currentLocation,
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case SHIPMENT_DEPARTED: {
      if (!state) return state;
      return {
        ...state,
        status: 'IN_TRANSIT',
        currentLocation: event.payload?.location || state.currentLocation,
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case TEMPERATURE_SPIKE: {
      if (!state) {
        console.warn(`[Reducer] ${event.eventType} received with no prior state (version ${event.version}). Skipping.`);
        return state;
      }
      const temp = event.payload?.temperature ?? null;
      return {
        ...state,
        temperature: temp,
        sensorState: {
          ...(state.sensorState || {}),
          temperature: temp,
          recordedAt: event.timestamp,
        },
        flags: { ...state.flags, hasTemperatureSpike: true },
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case HUMIDITY_ALERT: {
      if (!state) return state;
      const hum = event.payload?.humidity ?? null;
      return {
        ...state,
        sensorState: {
          ...(state.sensorState || {}),
          humidity: hum,
          recordedAt: event.timestamp,
        },
        flags: { ...state.flags, hasHumidityAlert: true },
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case SENSOR_READING: {
      if (!state) return state;
      return {
        ...state,
        temperature: event.payload?.temperature ?? state.temperature,
        sensorState: {
          ...(state.sensorState || {}),
          temperature: event.payload?.temperature ?? state.sensorState?.temperature,
          humidity: event.payload?.humidity ?? state.sensorState?.humidity,
          recordedAt: event.timestamp,
        },
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case ARRIVED_AT_PORT:
    case SHIPMENT_ARRIVED: {
      if (!state) {
        console.warn(`[Reducer] ${event.eventType} received with no prior state (version ${event.version}). Skipping.`);
        return state;
      }
      const loc = event.payload?.location || (event.payload?.port ? { port: event.payload.port } : state.destination);
      return {
        ...state,
        status: 'ARRIVED_AT_PORT',
        currentLocation: loc,
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case CONTAINER_UNLOADED: {
      if (!state) return state;
      return {
        ...state,
        status: 'UNLOADED',
        currentLocation: event.payload?.location || state.currentLocation,
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case CUSTOMS_HELD: {
      if (!state) return state;
      return {
        ...state,
        flags: { ...state.flags, customsHeld: true },
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

    case CUSTOMS_CLEARED: {
      if (!state) return state;
      return {
        ...state,
        flags: { ...state.flags, customsHeld: false },
        lastEventVersion: event.version,
        eventHistory: [...state.eventHistory, { eventType: event.eventType, timestamp: event.timestamp, version: event.version }],
      };
    }

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