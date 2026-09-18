import { appendEvent } from './event-store-service.js';
import { CONTAINER_CREATED } from '../../events/event-types.js';

export async function createShipment({ aggregateId, destination, type, maxCapacity }) {
  const event = await appendEvent({
    aggregateId,
    eventType: CONTAINER_CREATED,
    payload: { destination, type, maxCapacity },
    expectedVersion: 0,
  });

  return event;
}