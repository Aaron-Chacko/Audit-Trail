export const CRITICAL_LIFECYCLE_EVENTS = new Set([
  'SHIPMENT_CREATED',
  'SHIPMENT_DEPARTED',
  'SHIPMENT_ARRIVED',
  'SHIPMENT_CANCELLED',
  'CONTAINER_CREATED',
  'CONTAINER_LOADED',
  'CONTAINER_UNLOADED',
  'CUSTOMS_CLEARED',
  'CUSTOMS_HELD',
]);

export function compactStream(events = [], {
  preserveEventTypes = CRITICAL_LIFECYCLE_EVENTS,
  maxAgeMs = null,
  keepSensorThresholdAlerts = true,
} = {}) {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const preserveSet = new Set(preserveEventTypes);
  const now = Date.now();
  const compacted = [];

  let sensorReadingsCount = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  let sumTemp = 0;

  for (const event of events) {
    const isCritical = preserveSet.has(event.eventType);
    const eventAge = now - new Date(event.timestamp).getTime();
    const isWithinRetention = maxAgeMs === null || eventAge <= maxAgeMs;

    if (isCritical || isWithinRetention) {
      compacted.push(event);
      continue;
    }

    if (event.eventType === 'TEMPERATURE_SPIKE' || event.eventType === 'HUMIDITY_ALERT') {
      if (keepSensorThresholdAlerts) {
        compacted.push(event);
      }
      continue;
    }

    if (event.eventType === 'SENSOR_READING') {
      sensorReadingsCount += 1;
      const temp = event.payload && event.payload.temperature;
      if (typeof temp === 'number') {
        minTemp = Math.min(minTemp, temp);
        maxTemp = Math.max(maxTemp, temp);
        sumTemp += temp;
      }
    }
  }

  if (sensorReadingsCount > 0) {
    compacted.push({
      aggregateId: events[0].aggregateId,
      eventType: 'SENSOR_READINGS_COMPACTED_SUMMARY',
      payload: {
        readingsFolded: sensorReadingsCount,
        minTemperature: minTemp !== Infinity ? minTemp : null,
        maxTemperature: maxTemp !== -Infinity ? maxTemp : null,
        avgTemperature: minTemp !== Infinity ? Number((sumTemp / sensorReadingsCount).toFixed(2)) : null,
      },
      version: events[events.length - 1].version,
      timestamp: new Date(),
      metadata: {
        isCompactedSummary: true,
        originalEventCount: events.length,
        compactedCount: compacted.length,
      },
    });
  }

  return compacted;
}

export default {
  compactStream,
  CRITICAL_LIFECYCLE_EVENTS,
};
