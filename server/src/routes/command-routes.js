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

import { Router } from 'express';

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
  res.json({ success: true, data: { side: 'command', status: 'ready' }, error: null });
});

export default router;
