import { Router } from 'express';
import { createShipment, moveShipment, recordTemperature } from '../services/commands/shipment-command-service.js';
import { createShipmentSchema, moveShipmentSchema, recordTemperatureSchema } from '../schemas/command-schemas.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

/**
 * routes/command-routes.js
 *
 * Write-side route definitions ONLY.
 *
 * CQRS rule: this file must NEVER import from services/queries/* or
 * models/ShipmentReadModel.js. All write operations must go through
 * the command controllers → command services → Event Store pipeline.
 *
 * Route handlers must not contain business logic — just:
 *   1. Attach validation middleware
 *   2. Delegate to the appropriate command controller
 */

// Controllers are added here as they are built in later sprints.
// e.g.: import * as shipmentCommandController from '../controllers/commands/shipment-command-controller.js';

// Schemas for Joi validation are added here.
// e.g.: import { createShipmentSchema, recordTemperatureSchema } from '../schemas/shipment-schemas.js';

// import { validate } from '../middleware/validate.js';

const router = Router();

// ── Placeholder — replace with real routes in Week 1 ────────────────────────
// router.post('/shipments',              validate(createShipmentSchema),      shipmentCommandController.create);
// router.post('/shipments/:id/move',     validate(moveShipmentSchema),         shipmentCommandController.move);
// router.post('/shipments/:id/temperature', validate(recordTemperatureSchema), shipmentCommandController.recordTemperature);

// Health check for the command bus (useful during local development)
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      side: 'command',
      status: 'ready',
      message: 'Command API is ready to accept write operations',
    },
    error: null,
  });
});



router.post('/shipments', validate(createShipmentSchema), async (req, res) => {
  try {
    const event = await createShipment(req.body);
    sendSuccess(res, event, 201);
  } catch (err) {
    if (err.name === 'ConcurrencyError') {
      return sendError(res, err.message, 409);
    }
    sendError(res, err.message, 500);
  }
});

router.post('/shipments/:id/move', validate(moveShipmentSchema), async (req, res) => {
  try {
    const event = await moveShipment({ aggregateId: req.params.id, ...req.body });
    sendSuccess(res, event, 201);
  } catch (err) {
    if (err.name === 'ConcurrencyError') {
      return sendError(res, err.message, 409);
    }
    sendError(res, err.message, 500);
  }
});

import { simulateShipmentScenario } from '../services/commands/simulation-service.js';

router.post('/simulate', async (req, res) => {
  try {
    const { aggregateId, scenario, customPayload } = req.body;
    if (!aggregateId || !scenario) {
      return sendError(res, 'aggregateId and scenario are required', 400);
    }
    const event = await simulateShipmentScenario({ aggregateId, scenario, customPayload });
    sendSuccess(res, event, 201);
  } catch (err) {
    if (err.name === 'ConcurrencyError') {
      return sendError(res, err.message, 409);
    }
    sendError(res, err.message, 500);
  }
});

export default router;
