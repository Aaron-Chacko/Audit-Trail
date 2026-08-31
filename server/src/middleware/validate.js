/**
 * middleware/validate.js
 *
 * Factory that returns Express middleware for Joi schema validation.
 *
 * Usage (in a route file):
 *   import { validate } from '../middleware/validate.js';
 *   import { createShipmentSchema } from '../schemas/shipment-schemas.js';
 *
 *   router.post('/shipments', validate(createShipmentSchema), shipmentCommandController.create);
 *
 * Any validation failure is forwarded to the central error handler as a Joi
 * ValidationError (err.isJoi === true) → handled as HTTP 422.
 *
 * Validate 'body' by default; pass 'query' or 'params' as the second
 * argument to validate other parts of the request.
 */

/**
 * @param {import('joi').Schema} schema  - A compiled Joi schema
 * @param {'body'|'query'|'params'} [source='body'] - Which req property to validate
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // Collect ALL errors, not just the first
      stripUnknown: true,  // Remove extra keys not in schema
    });

    if (error) {
      error.isJoi = true;  // Tag so errorHandler can identify it
      return next(error);
    }

    // Overwrite req[source] with the validated + stripped value
    req[source] = value;
    return next();
  };
}
