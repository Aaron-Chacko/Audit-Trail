import { appendEvent, getAggregateVersion } from './event-store-service.js';
import { CONTAINER_CREATED, LOADED_ON_SHIP, ARRIVED_AT_PORT } from '../../events/event-types.js';

export async function createShipment({ aggregateId, destination, type, maxCapacity }) {
  const event = await appendEvent({
    aggregateId,
    eventType: CONTAINER_CREATED,
    payload: { destination, type, maxCapacity },
    expectedVersion: 0,
  });

  return event;
}

export async function moveShipment({ aggregateId, toStatus, vesselId, port, shipName, bay, terminal, details }) {
  const eventType = toStatus === 'LOADED_ON_SHIP' ? LOADED_ON_SHIP : ARRIVED_AT_PORT;
  const currentVersion = await getAggregateVersion(aggregateId);

  const payload =
    eventType === LOADED_ON_SHIP
      ? { vesselId, port, shipName, bay }
      : { port, terminal, details };

  const event = await appendEvent({
    aggregateId,
    eventType,
    payload,
    expectedVersion: currentVersion,
  });

  return event;
}

export async function recordTemperature({ aggregateId, temperature, threshold, unit, sensorId }) {
  const currentVersion = await getAggregateVersion(aggregateId);

  const event = await appendEvent({
    aggregateId,
    eventType: TEMPERATURE_SPIKE,
    payload: { temperature, threshold, unit, sensorId },
    expectedVersion: currentVersion,
  });

  return event;
}