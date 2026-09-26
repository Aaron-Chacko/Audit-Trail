import { appendEvent, getAggregateVersion } from './event-store-service.js';
import {
  SENSOR_READING,
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  DEPARTED_FROM_PORT,
  ARRIVED_AT_PORT,
  CUSTOMS_HELD,
  CUSTOMS_CLEARED,
} from '../../events/event-types.js';

/**
 * services/commands/simulation-service.js
 *
 * Provides live scenario execution and simulated IoT telemetry generation
 * for testing and real-time demonstration.
 */
export async function simulateShipmentScenario({ aggregateId, scenario, customPayload = {} }) {
  if (!aggregateId) {
    throw new Error('aggregateId is required for scenario simulation');
  }

  const currentVersion = await getAggregateVersion(aggregateId);

  let eventType = SENSOR_READING;
  let payload = {};

  switch (scenario) {
    case 'TEMPERATURE_TICK': {
      eventType = SENSOR_READING;
      const baseTemp = 4.0;
      const jitter = (Math.random() * 0.8 - 0.4).toFixed(1);
      const temperature = parseFloat((baseTemp + parseFloat(jitter)).toFixed(1));
      const humidity = Math.floor(60 + Math.random() * 10);
      payload = {
        temperature,
        humidity,
        threshold: 8.0,
        unit: 'CELSIUS',
        sensorId: 'SENSOR-IOT-LIVE',
        status: 'NORMAL',
        batteryLevel: 94,
        ...customPayload,
      };
      break;
    }

    case 'TEMPERATURE_SPIKE': {
      eventType = TEMPERATURE_SPIKE;
      const temperature = customPayload.temperature || parseFloat((13.5 + Math.random() * 2.5).toFixed(1));
      payload = {
        temperature,
        threshold: 8.0,
        unit: 'CELSIUS',
        sensorId: 'SENSOR-IOT-LIVE',
        reason: customPayload.reason || 'Cooling compressor power surge detected',
        severity: 'HIGH',
        durationMinutes: 45,
        ...customPayload,
      };
      break;
    }

    case 'HUMIDITY_ALERT': {
      eventType = HUMIDITY_ALERT;
      payload = {
        humidity: customPayload.humidity || Math.floor(90 + Math.random() * 6),
        threshold: 75,
        unit: 'PERCENT_RH',
        sensorId: 'SENSOR-IOT-HUMIDITY',
        reason: 'Cargo bay condensation threshold exceeded',
        severity: 'MEDIUM',
        ...customPayload,
      };
      break;
    }

    case 'PORT_DEPARTURE': {
      eventType = DEPARTED_FROM_PORT;
      payload = {
        port: customPayload.port || 'Port of Rotterdam',
        terminal: 'Terminal Bravo-2',
        vessel: {
          name: 'MV Arctic Pioneer',
          imo: 'IMO-9824190',
        },
        departureTimestamp: new Date().toISOString(),
        ...customPayload,
      };
      break;
    }

    case 'PORT_ARRIVAL': {
      eventType = ARRIVED_AT_PORT;
      payload = {
        port: customPayload.port || 'Port of Hamburg',
        terminal: 'Container Gate 4',
        berth: 'Berth 12',
        arrivalTimestamp: new Date().toISOString(),
        ...customPayload,
      };
      break;
    }

    case 'CUSTOMS_HELD': {
      eventType = CUSTOMS_HELD;
      payload = {
        port: customPayload.port || 'Port of Hamburg',
        reason: customPayload.reason || 'Physical seal inspection & phytosanitary audit required',
        heldBy: 'Federal Customs Inspection Authority',
        estimatedDelayHours: 24,
        ...customPayload,
      };
      break;
    }

    case 'CUSTOMS_CLEARED': {
      eventType = CUSTOMS_CLEARED;
      payload = {
        port: customPayload.port || 'Port of Hamburg',
        clearanceCode: `CC-${Math.floor(100000 + Math.random() * 900000)}`,
        inspectedBy: 'Customs Officer #402',
        sealIntact: true,
        status: 'CLEARED_FOR_RELEASE',
        ...customPayload,
      };
      break;
    }

    default:
      throw new Error(`Unknown simulation scenario: ${scenario}`);
  }

  const event = await appendEvent({
    aggregateId,
    eventType,
    payload,
    expectedVersion: currentVersion,
  });

  return event;
}
