import Joi from 'joi';

export const createShipmentSchema = Joi.object({
  aggregateId: Joi.string().trim().required(),
  destination: Joi.string().trim().allow(null, '').optional(),
  type: Joi.string().trim().optional(),
  maxCapacity: Joi.number().positive().optional(),
});

export const moveShipmentSchema = Joi.object({
  aggregateId: Joi.string().trim().required(),
  toStatus: Joi.string().valid('LOADED_ON_SHIP', 'ARRIVED_AT_PORT').required(),
  vesselId: Joi.string().trim().optional().allow(null, ''),
  port: Joi.string().trim().optional().allow(null, ''),
  shipName: Joi.string().trim().optional().allow(null, ''),
  bay: Joi.string().trim().optional().allow(null, ''),
  terminal: Joi.string().trim().optional().allow(null, ''),
  details: Joi.string().trim().optional().allow(null, ''),
});