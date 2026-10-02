import { appendEvent, getAggregateVersion } from './event-store-service.js';

import {
  CONTAINER_CREATED,
  LOADED_ON_SHIP,
  ARRIVED_AT_PORT,
  TEMPERATURE_SPIKE,
  SHIPMENT_CANCELLED,
} from '../../events/event-types.js';


export async function createShipment({
  aggregateId,
  destination,
  type,
  maxCapacity,
}) {
  const event = await appendEvent({
    aggregateId,
    eventType: CONTAINER_CREATED,
    payload: {
      destination,
      type,
      maxCapacity,
    },
    expectedVersion: 0,
  });

  return event;
}


export async function moveShipment({
  aggregateId,
  toStatus,
  vesselId,
  port,
  shipName,
  bay,
  terminal,
  details,
  expectedVersion,
}) {
  const eventType =
    toStatus === 'LOADED_ON_SHIP'
      ? LOADED_ON_SHIP
      : ARRIVED_AT_PORT;

  const payload =
    eventType === LOADED_ON_SHIP
      ? {
        vesselId,
        port,
        shipName,
        bay,
      }
      : {
        port,
        terminal,
        details,
      };

  const event = await appendEvent({
    aggregateId,
    eventType,
    payload,
    expectedVersion,
  });

  return event;
}


export async function recordTemperature({
  aggregateId,
  temperature,
  threshold,
  unit,
  sensorId,
  expectedVersion,
}) {
  const event = await appendEvent({
    aggregateId,
    eventType: TEMPERATURE_SPIKE,
    payload: {
      temperature,
      threshold,
      unit,
      sensorId,
    },
    expectedVersion,
  });

  return event;
}


export async function cancelShipment({
  aggregateId,
  reason,
  cancelledBy,
}) {
  const currentVersion = await getAggregateVersion(aggregateId);

  const event = await appendEvent({
    aggregateId,
    eventType: SHIPMENT_CANCELLED,
    payload: {
      reason,
      cancelledBy,
    },
    expectedVersion: currentVersion,
  });

  return event;
}