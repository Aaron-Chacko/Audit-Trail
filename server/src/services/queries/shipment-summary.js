/**
 * Pure aggregation helper — summarizes a list of formatted shipments
 * into dashboard-friendly stats. No DB calls.
 */

export function summarizeShipments(shipments) {
  const summary = {
    total: shipments.length,
    byStatus: {},
    activeTemperatureAlerts: 0,
    activeCustomsHolds: 0,
  };

  for (const shipment of shipments) {
    const status = shipment.status || 'UNKNOWN';
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

    if (shipment.flags?.hasTemperatureSpike) {
      summary.activeTemperatureAlerts += 1;
    }
    if (shipment.flags?.customsHeld) {
      summary.activeCustomsHolds += 1;
    }
  }

  return summary;
}