/**
 * Pure function — shapes a raw ShipmentReadModel document (or reducer output)
 * into a clean API response shape. No DB calls, no side effects.
 */
export function formatShipmentResponse(shipment) {
  if (!shipment) return null;

  const aggId = shipment.aggregateId || shipment.id;

  return {
    id: aggId,
    aggregateId: aggId,
    status: shipment.status,
    origin: shipment.origin ?? null,
    destination: shipment.destination ?? null,
    currentLocation: shipment.currentLocation ?? null,
    vessel: shipment.vessel ?? null,
    cargo: shipment.cargo ?? null,
    sensorState: shipment.sensorState ?? {
      temperature: shipment.temperature ?? null,
      humidity: null,
      recordedAt: null,
    },
    temperature: shipment.temperature ?? shipment.sensorState?.temperature ?? null,
    flags: {
      hasTemperatureSpike: !!shipment.flags?.hasTemperatureSpike,
      hasHumidityAlert: !!shipment.flags?.hasHumidityAlert,
      customsHeld: !!shipment.flags?.customsHeld,
    },
    lastEventVersion: shipment.lastEventVersion ?? 0,
    eventHistory: (shipment.eventHistory || []).map(formatEventSummary),
  };
}

export function formatEventSummary(event) {
  return {
    eventType: event.eventType,
    timestamp: event.timestamp,
    version: event.version,
  };
}

export function formatShipmentList(shipments) {
  return (shipments || []).map(formatShipmentResponse);
}