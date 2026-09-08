/**
 * Pure function — shapes a raw ShipmentReadModel document (or reducer output)
 * into a clean API response shape. No DB calls, no side effects.
 */
export function formatShipmentResponse(shipment) {
  if (!shipment) return null;

  return {
    id: shipment.aggregateId,
    status: shipment.status,
    destination: shipment.destination ?? null,
    temperature: shipment.temperature ?? null,
    flags: {
      hasTemperatureSpike: !!shipment.flags?.hasTemperatureSpike,
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