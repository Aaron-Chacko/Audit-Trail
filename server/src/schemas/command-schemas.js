import Joi from 'joi';

export const createShipmentSchema = Joi.object({
  aggregateId: Joi.string().trim().required(),
  destination: Joi.string().trim().allow(null, '').optional(),
  type: Joi.string().trim().optional(),
  maxCapacity: Joi.number().positive().optional(),
});