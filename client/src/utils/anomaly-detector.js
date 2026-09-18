import { TEMPERATURE_SPIKE, CUSTOMS_HELD, CUSTOMS_CLEARED } from '../constants/event-types.js';

/**
 * utils/anomaly-detector.js
 *
 * Automated diagnostic engine to scan an event stream for integrity risks,
 * rapid sensor rate-of-change, and compliance holds.
 */

/**
 * Analyze an event stream for chronological anomalies and threshold breaches.
 *
 * @param {Array} events - Array of event objects
 * @returns {object} Diagnostic audit results
 */
export function analyzeEventStreamHealth(events = []) {
  if (!events || events.length === 0) {
    return {
      isHealthy: true,
      anomaliesCount: 0,
      issues: [],
      score: 100,
    };
  }

  const issues = [];
  let previousTimestamp = 0;
  let previousTemp = null;
  let customsHeldAt = null;

  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    const expectedVersion = i + 1;
    const currentTimestamp = new Date(evt.timestamp).getTime();

    // 1. Version sequence check
    if (evt.version !== expectedVersion) {
      issues.push({
        severity: 'high',
        type: 'VERSION_SEQUENCE_MISMATCH',
        message: `Event at index ${i} has version ${evt.version}, expected ${expectedVersion}.`,
        version: evt.version,
      });
    }

    // 2. Timestamp monotonicity check
    if (i > 0 && currentTimestamp < previousTimestamp) {
      issues.push({
        severity: 'high',
        type: 'TEMPORAL_REVERSAL',
        message: `Event v${evt.version} timestamp is earlier than previous event.`,
        version: evt.version,
      });
    }

    // 3. Sensor rapid delta check (> 4°C rise in single event step)
    const currentTemp = evt.payload?.temperature;
    if (currentTemp != null) {
      if (previousTemp != null) {
        const delta = Math.abs(currentTemp - previousTemp);
        if (delta >= 4.0) {
          issues.push({
            severity: 'medium',
            type: 'RAPID_THERMAL_DELTA',
            message: `Rapid temperature fluctuation detected (Δ ${delta.toFixed(1)}°C) at version v${evt.version}.`,
            version: evt.version,
          });
        }
      }
      previousTemp = currentTemp;
    }

    // 4. Customs hold tracking
    if (evt.eventType === CUSTOMS_HELD) {
      customsHeldAt = currentTimestamp;
    } else if (evt.eventType === CUSTOMS_CLEARED) {
      customsHeldAt = null;
    }

    previousTimestamp = currentTimestamp;
  }

  // If stream ended with unresolved customs hold
  if (customsHeldAt !== null) {
    issues.push({
      severity: 'medium',
      type: 'UNRESOLVED_CUSTOMS_HOLD',
      message: 'Shipment event stream terminated with an unresolved customs hold.',
      version: events[events.length - 1].version,
    });
  }

  const highCount = issues.filter((iss) => iss.severity === 'high').length;
  const medCount = issues.filter((iss) => iss.severity === 'medium').length;
  const score = Math.max(0, 100 - highCount * 30 - medCount * 15);

  return {
    isHealthy: issues.length === 0,
    anomaliesCount: issues.length,
    issues,
    score,
  };
}
