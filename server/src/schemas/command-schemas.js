import Joi from 'joi';

/**
 * CREATE SHIPMENT
 *
 * Creates the first event for a shipment/container aggregate.
 * Since this is the first event, Event Store automatically
 * expects version 0.
 */
export const createShipmentSchema = Joi.object({
  aggregateId: Joi.string()
    .trim()
    .required(),

  destination: Joi.string()
    .trim()
    .allow(null, '')
    .optional(),

  type: Joi.string()
    .trim()
    .optional(),

  maxCapacity: Joi.number()
    .positive()
    .optional(),
});


/**
 * MOVE SHIPMENT
 *
 * expectedVersion is required for optimistic concurrency control.
 */
export const moveShipmentSchema = Joi.object({
  toStatus: Joi.string()
    .valid('LOADED_ON_SHIP', 'ARRIVED_AT_PORT')
    .required(),

  expectedVersion: Joi.number()
    .integer()
    .min(1)
    .required(),

  vesselId: Joi.string()
    .trim()
    .optional()
    .allow(null, ''),

  port: Joi.string()
    .trim()
    .optional()
    .allow(null, ''),

  shipName: Joi.string()
    .trim()
    .optional()
    .allow(null, ''),

  bay: Joi.string()
    .trim()
    .optional()
    .allow(null, ''),

  terminal: Joi.string()
    .trim()
    .optional()
    .allow(null, ''),

  details: Joi.string()
    .trim()
    .optional()
    .allow(null, ''),
});


/**
 * RECORD TEMPERATURE
 *
 * expectedVersion is required because this command also
 * appends an event to the aggregate stream.
 */
export const recordTemperatureSchema = Joi.object({
  temperature: Joi.number()
    .required(),

  threshold: Joi.number()
    .optional(),

  unit: Joi.string()
    .trim()
    .default('C'),

  sensorId: Joi.string()
    .trim()
    .optional(),

  expectedVersion: Joi.number()
    .integer()
    .min(1)
    .required(),
});


/**
 * CANCEL SHIPMENT
 */
export const cancelShipmentSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .required(),

  cancelledBy: Joi.string()
    .trim()
    .optional(),
});