/**
 * routes/query-routes.js
 *
 * Read-side route definitions ONLY.
 *
 * CQRS rule: this file must NEVER import from services/commands/* or
 * models/Event.js for "current state" reads. All read operations must
 * hit the Read Model (ShipmentReadModel) via query controllers.
 *
 * Exception: query services MAY read from the Event Store for
 * explicit "event history" or "historical state" queries — but only
 * through the query service layer, never directly from a route/controller.
 */

import { Router } from 'express';

// Controllers are added here as they are built in later sprints.
// e.g.: import * as shipmentQueryController from '../controllers/queries/shipment-query-controller.js';

const router = Router();

// ── Placeholder — replace with real routes in Week 1 ────────────────────────
// router.get('/shipments',              shipmentQueryController.list);
// router.get('/shipments/:id',          shipmentQueryController.getById);
// router.get('/shipments/:id/events',   shipmentQueryController.getEventHistory);
// router.get('/shipments/:id/history',  shipmentQueryController.getHistoricalState); // ?asOf=<ISO timestamp>

// Health check for the query bus
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { side: 'query', status: 'ready' }, error: null });
});

export default router;
