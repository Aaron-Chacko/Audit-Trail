import { Router } from 'express';

import {
  createShipment,
  moveShipment,
  recordTemperature,
  cancelShipment,
} from '../services/commands/shipment-command-service.js';

import {
  createShipmentSchema,
  moveShipmentSchema,
  recordTemperatureSchema,
  cancelShipmentSchema,
} from '../schemas/command-schemas.js';

import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { simulateShipmentScenario } from '../services/commands/simulation-service.js';

/**
 * routes/command-routes.js
 *
 * Write-side route definitions.
 *
 * CQRS rule: this file must NEVER import from services/queries/*
 * or models/ShipmentReadModel.js.
 *
 * All write operations go through:
 * command routes → command services → Event Store
 */

const router = Router();

/**
 * ---------------------------------------------------------
 * HEALTH CHECK
 * ---------------------------------------------------------
 */
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


/**
 * ---------------------------------------------------------
 * CREATE SHIPMENT
 * ---------------------------------------------------------
 *
 * POST /api/commands/shipments
 *
 * Body:
 * {
 *   "aggregateId": "SHIP001",
 *   "destination": "Delhi",
 *   "type": "REFRIGERATED",
 *   "maxCapacity": 1000
 * }
 */
router.post(
  '/shipments',
  validate(createShipmentSchema),
  async (req, res) => {
    try {
      const event = await createShipment(req.body);

      return sendSuccess(res, event, 201);
    } catch (err) {
      if (err.name === 'ConcurrencyError') {
        return sendError(res, err.message, 409);
      }

      console.error('[Command] Create shipment failed:', err);

      return sendError(res, err.message, 500);
    }
  }
);


/**
 * ---------------------------------------------------------
 * MOVE SHIPMENT
 * ---------------------------------------------------------
 *
 * POST /api/commands/shipments/:id/move
 *
 * Example:
 *
 * /api/commands/shipments/SHIP001/move
 *
 * Body:
 * {
 *   "toStatus": "LOADED_ON_SHIP",
 *   "vesselId": "VESSEL01",
 *   "port": "Mumbai",
 *   "shipName": "Ocean Star",
 *   "bay": "B12",
 *   "expectedVersion": 1
 * }
 */
router.post(
  '/shipments/:id/move',
  validate(moveShipmentSchema),
  async (req, res) => {
    try {
      const event = await moveShipment({
        aggregateId: req.params.id,
        ...req.body,
      });

      return sendSuccess(res, event, 201);
    } catch (err) {
      if (err.name === 'ConcurrencyError') {
        return sendError(res, err.message, 409);
      }

      console.error('[Command] Move shipment failed:', err);

      return sendError(res, err.message, 500);
    }
  }
);


/**
 * ---------------------------------------------------------
 * SIMULATE SHIPMENT SCENARIO
 * ---------------------------------------------------------
 */
router.post('/simulate', async (req, res) => {
  try {
    const {
      aggregateId,
      scenario,
      customPayload,
    } = req.body;

    if (!aggregateId || !scenario) {
      return sendError(
        res,
        'aggregateId and scenario are required',
        400
      );
    }

    const event = await simulateShipmentScenario({
      aggregateId,
      scenario,
      customPayload,
    });

    return sendSuccess(res, event, 201);
  } catch (err) {
    if (err.name === 'ConcurrencyError') {
      return sendError(res, err.message, 409);
    }

    console.error('[Command] Simulation failed:', err);

    return sendError(res, err.message, 500);
  }
});


/**
 * ---------------------------------------------------------
 * CANCEL SHIPMENT
 * ---------------------------------------------------------
 *
 * POST /api/commands/shipments/:id/cancel
 */
router.post(
  '/shipments/:id/cancel',
  validate(cancelShipmentSchema),
  async (req, res) => {
    try {
      const event = await cancelShipment({
        aggregateId: req.params.id,
        ...req.body,
      });

      return sendSuccess(res, event, 201);
    } catch (err) {
      if (err.name === 'ConcurrencyError') {
        return sendError(res, err.message, 409);
      }

      console.error('[Command] Cancel shipment failed:', err);

      return sendError(res, err.message, 500);
    }
  }
);


/**
 * ---------------------------------------------------------
 * RECORD TEMPERATURE
 * ---------------------------------------------------------
 *
 * POST /api/commands/shipments/:id/temperature
 *
 * Example:
 *
 * /api/commands/shipments/SHIP001/temperature
 *
 * Body:
 * {
 *   "temperature": 12.5,
 *   "threshold": 8,
 *   "unit": "C",
 *   "sensorId": "SENSOR01",
 *   "expectedVersion": 2
 * }
 */
router.post(
  '/shipments/:id/temperature',
  validate(recordTemperatureSchema),
  async (req, res) => {
    try {
      const event = await recordTemperature({
        aggregateId: req.params.id,
        ...req.body,
      });

      return sendSuccess(res, event, 201);
    } catch (err) {
      if (err.name === 'ConcurrencyError') {
        return sendError(res, err.message, 409);
      }

      console.error('[Command] Record temperature failed:', err);

      return sendError(res, err.message, 500);
    }
  }
);


export default router;