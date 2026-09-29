import Joi from 'joi';

// aggregateId is NOT included in per-shipment schemas — it is extracted from
// req.params.id by the route layer, not the request body. Only createShipment
// needs it in the body because there is no :id URL param for that route.

export const createShipmentSchema = Joi.object({
  aggregateId: Joi.string().trim().required(),
  destination: Joi.string().trim().allow(null, '').optional(),
  type: Joi.string().trim().optional(),
  maxCapacity: Joi.number().positive().optional(),
});

export const moveShipmentSchema = Joi.object({
  toStatus: Joi.string().valid('LOADED_ON_SHIP', 'ARRIVED_AT_PORT').required(),
  vesselId: Joi.string().trim().optional().allow(null, ''),
  port: Joi.string().trim().optional().allow(null, ''),
  shipName: Joi.string().trim().optional().allow(null, ''),
  bay: Joi.string().trim().optional().allow(null, ''),
  terminal: Joi.string().trim().optional().allow(null, ''),
  details: Joi.string().trim().optional().allow(null, ''),
});

export const recordTemperatureSchema = Joi.object({
  temperature: Joi.number().required(),
  threshold: Joi.number().optional(),
  unit: Joi.string().trim().default('C'),
  sensorId: Joi.string().trim().optional(),
});

export const cancelShipmentSchema = Joi.object({
  reason: Joi.string().trim().required(),
  cancelledBy: Joi.string().trim().optional(),
});