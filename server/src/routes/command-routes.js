import { Router } from 'express';
import { createShipment, moveShipment, recordTemperature, cancelShipment } from '../services/commands/shipment-command-service.js';
import { createShipmentSchema, moveShipmentSchema, recordTemperatureSchema, cancelShipmentSchema } from '../schemas/command-schemas.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { simulateShipmentScenario } from '../services/commands/simulation-service.js';

/**
 * routes/command-routes.js
 *
 * Write-side route definitions.
 *
 * CQRS rule: this file must NEVER import from services/queries/* or
 * models/ShipmentReadModel.js. All write operations go through:
 *   command routes → command services → Event Store
 */

const router = Router();

// Health check for the command bus
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

router.post('/shipments/:id/cancel', validate(cancelShipmentSchema), async (req, res) => {
  try {
    const event = await cancelShipment({ aggregateId: req.params.id, ...req.body });
    sendSuccess(res, event, 201);
  } catch (err) {
    if (err.name === 'ConcurrencyError') {
      return sendError(res, err.message, 409);
    }
    sendError(res, err.message, 500);
  }
});

router.post('/shipments/:id/temperature', validate(recordTemperatureSchema), async (req, res) => {
  try {
    const event = await recordTemperature({ aggregateId: req.params.id, ...req.body });
    sendSuccess(res, event, 201);
  } catch (err) {
    if (err.name === 'ConcurrencyError') {
      return sendError(res, err.message, 409);
    }
    sendError(res, err.message, 500);
  }
});

export default router;
