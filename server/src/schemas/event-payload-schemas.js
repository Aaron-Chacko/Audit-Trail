import Joi from 'joi';
import {
  SHIPMENT_CREATED,
  SHIPMENT_DEPARTED,
  SHIPMENT_ARRIVED,
  SHIPMENT_CANCELLED,
  SHIPMENT_STATUS_UPDATED,
  CONTAINER_CREATED,
  CONTAINER_LOADED,
  CONTAINER_UNLOADED,
  LOADED_ON_SHIP,
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  SENSOR_READING,
  ARRIVED_AT_PORT,
  DEPARTED_FROM_PORT,
  CUSTOMS_CLEARED,
  CUSTOMS_HELD,
} from '../events/event-types.js';

const shipmentCreatedSchema = Joi.object({
  origin: Joi.string().trim().required(),
  destination: Joi.string().trim().required(),
  carrier: Joi.string().trim().optional().allow(null, ''),
  estimatedArrival: Joi.date().iso().optional().allow(null, ''),
  initialStatus: Joi.string().trim().optional(),
  temperatureThreshold: Joi.number().optional(),
}).unknown(true);

const shipmentDepartedSchema = Joi.object({
  port: Joi.string().trim().optional(),
  location: Joi.string().trim().optional(),
  departureTime: Joi.date().iso().optional(),
  vesselId: Joi.string().trim().optional().allow(null, ''),
}).or('port', 'location').unknown(true);

const shipmentArrivedSchema = Joi.object({
  port: Joi.string().trim().optional(),
  location: Joi.string().trim().optional(),
  arrivalTime: Joi.date().iso().optional(),
}).or('port', 'location').unknown(true);

const shipmentCancelledSchema = Joi.object({
  reason: Joi.string().trim().required(),
  cancelledBy: Joi.string().trim().optional(),
}).unknown(true);

const shipmentStatusUpdatedSchema = Joi.object({
  status: Joi.string().trim().required(),
  remarks: Joi.string().trim().optional().allow(null, ''),
}).unknown(true);

const containerCreatedSchema = Joi.object({
  destination: Joi.string().trim().optional().allow(null, ''),
  type: Joi.string().trim().optional(),
  maxCapacity: Joi.number().positive().optional(),
}).unknown(true);

const containerLoadedSchema = Joi.object({
  vesselId: Joi.string().trim().optional().allow(null, ''),
  port: Joi.string().trim().optional().allow(null, ''),
  shipName: Joi.string().trim().optional().allow(null, ''),
  bay: Joi.string().trim().optional().allow(null, ''),
}).unknown(true);

const containerUnloadedSchema = Joi.object({
  port: Joi.string().trim().optional().allow(null, ''),
  terminal: Joi.string().trim().optional().allow(null, ''),
}).unknown(true);

const temperatureSpikeSchema = Joi.object({
  temperature: Joi.number().required(),
  threshold: Joi.number().optional(),
  unit: Joi.string().trim().default('C'),
  sensorId: Joi.string().trim().optional(),
}).unknown(true);

const humidityAlertSchema = Joi.object({
  humidity: Joi.number().min(0).max(100).required(),
  threshold: Joi.number().optional(),
  sensorId: Joi.string().trim().optional(),
}).unknown(true);

const sensorReadingSchema = Joi.object({
  sensorId: Joi.string().trim().optional(),
  temperature: Joi.number().optional(),
  humidity: Joi.number().min(0).max(100).optional(),
  batteryLevel: Joi.number().min(0).max(100).optional(),
  gpsCoordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).optional(),
}).unknown(true);

const arrivedAtPortSchema = Joi.object({
  port: Joi.string().trim().required(),
  terminal: Joi.string().trim().optional().allow(null, ''),
  details: Joi.string().trim().optional().allow(null, ''),
}).unknown(true);

const departedFromPortSchema = Joi.object({
  port: Joi.string().trim().required(),
  destinationPort: Joi.string().trim().optional().allow(null, ''),
}).unknown(true);

const customsClearedSchema = Joi.object({
  port: Joi.string().trim().optional().allow(null, ''),
  clearanceCode: Joi.string().trim().optional().allow(null, ''),
  officer: Joi.string().trim().optional().allow(null, ''),
}).unknown(true);

const customsHeldSchema = Joi.object({
  reason: Joi.string().trim().required(),
  port: Joi.string().trim().optional().allow(null, ''),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
}).unknown(true);

export const PAYLOAD_SCHEMAS = Object.freeze({
  [SHIPMENT_CREATED]: shipmentCreatedSchema,
  [SHIPMENT_DEPARTED]: shipmentDepartedSchema,
  [SHIPMENT_ARRIVED]: shipmentArrivedSchema,
  [SHIPMENT_CANCELLED]: shipmentCancelledSchema,
  [SHIPMENT_STATUS_UPDATED]: shipmentStatusUpdatedSchema,
  [CONTAINER_CREATED]: containerCreatedSchema,
  [CONTAINER_LOADED]: containerLoadedSchema,
  [CONTAINER_UNLOADED]: containerUnloadedSchema,
  [LOADED_ON_SHIP]: containerLoadedSchema,
  [TEMPERATURE_SPIKE]: temperatureSpikeSchema,
  [HUMIDITY_ALERT]: humidityAlertSchema,
  [SENSOR_READING]: sensorReadingSchema,
  [ARRIVED_AT_PORT]: arrivedAtPortSchema,
  [DEPARTED_FROM_PORT]: departedFromPortSchema,
  [CUSTOMS_CLEARED]: customsClearedSchema,
  [CUSTOMS_HELD]: customsHeldSchema,
});

export function validateEventPayload(eventType, payload) {
  const schema = PAYLOAD_SCHEMAS[eventType];
  if (!schema) {
    return { error: null, value: payload || {} };
  }

  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: false,
  });

  return { error: error || null, value };
}
