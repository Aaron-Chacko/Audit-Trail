/**
 * api/shipments.js
 *
 * All backend calls related to shipments — both query (read) side.
 *
 * CQRS note:
 *   - GET calls → /api/queries/*   (read model, event history, historical state)
 *   - POST calls → /api/commands/* (commands — append events to the store)
 *
 * Every function returns the unwrapped `data` value from the server envelope,
 * because api/client.js interceptor handles the { success, data, error } unwrap.
 *
 * Usage:
 *   import { getShipmentById, getShipmentHistory } from '@/api/shipments';
 *   const shipment = await getShipmentById('SHIP-10042');
 */

import apiClient from './client.js';

// ── Query side (read) ──────────────────────────────────────────────────────────

/**
 * Get the current projected state of a shipment.
 * Reads from the Read Model — never the Event Store.
 *
 * @param {string} aggregateId - e.g. "SHIP-10042"
 * @returns {Promise<import('../types').ShipmentReadModel>}
 */
export async function getShipmentById(aggregateId) {
  return apiClient.get(`/api/queries/shipments/${aggregateId}`);
}

/**
 * Get the full chronological event history for a shipment.
 * Returns events in ascending timestamp order (oldest → newest).
 *
 * @param {string} aggregateId
 * @returns {Promise<import('../types').ShipmentEvent[]>}
 */
export async function getShipmentHistory(aggregateId) {
  return apiClient.get(`/api/queries/shipments/${aggregateId}/events`);
}

/**
 * Reconstruct the historical state of a shipment as of a given point in time.
 * Used by the Timeline scrubber — pass the timestamp from the slider position.
 *
 * @param {string} aggregateId
 * @param {string|Date} asOf - ISO 8601 timestamp string or Date object
 * @returns {Promise<import('../types').ShipmentReadModel>}
 */
export async function getShipmentStateAt(aggregateId, asOf) {
  const timestamp = asOf instanceof Date ? asOf.toISOString() : asOf;
  return apiClient.get(`/api/queries/shipments/${aggregateId}/history`, {
    params: { asOf: timestamp },
  });
}

/**
 * List all shipments (with optional filters).
 *
 * @param {{ status?: string, page?: number, limit?: number }} [params]
 * @returns {Promise<{ shipments: import('../types').ShipmentReadModel[], total: number }>}
 */
export async function listShipments(params = {}) {
  return apiClient.get('/api/queries/shipments', { params });
}

// ── Command side (write) ───────────────────────────────────────────────────────

/**
 * Issue a "Create Shipment" command to the write side.
 * On success, the backend appends a SHIPMENT_CREATED event and the
 * projection worker updates the Read Model.
 *
 * @param {{ aggregateId: string, origin: object, destination: object, cargo: object }} payload
 * @returns {Promise<{ aggregateId: string, version: number }>}
 */
export async function createShipment(payload) {
  return apiClient.post('/api/commands/shipments', payload);
}

/**
 * Issue a "Record Temperature" command.
 * Appends a TEMPERATURE_SPIKE or SENSOR_READING event depending on server logic.
 *
 * @param {string} aggregateId
 * @param {{ temperature: number, threshold: number, expectedVersion: number }} payload
 * @returns {Promise<{ aggregateId: string, version: number }>}
 */
export async function recordTemperature(aggregateId, payload) {
  return apiClient.post(`/api/commands/shipments/${aggregateId}/temperature`, payload);
}

/**
 * Issue a "Move Shipment" command.
 * Appends a SHIPMENT_DEPARTED or ARRIVED_AT_PORT event.
 *
 * @param {string} aggregateId
 * @param {{ location: object, expectedVersion: number }} payload
 * @returns {Promise<{ aggregateId: string, version: number }>}
 */
export async function moveShipment(aggregateId, payload) {
  return apiClient.post(`/api/commands/shipments/${aggregateId}/move`, payload);
}
