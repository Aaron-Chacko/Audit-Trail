import express from 'express';
import { validateHistoricalStateQuery } from '../services/queries/query-validators.js';
import { getCurrentState, getEventTimeline, getHistoricalState, listShipments } from '../services/queries/shipment-query-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      side: 'query',
      status: 'ready',
      description: 'Read-side query endpoints',
      endpoints: {
        health: '/api/queries/health',
        shipments: '/api/queries/shipments',
        shipmentById: '/api/queries/shipments/:id',
        history: '/api/queries/shipments/:id/history',
        stateAt: '/api/queries/shipments/:id/state-at?timestamp=',
      },
    },
    error: null,
  });
});

router.get('/health', (req, res) => sendSuccess(res, { status: 'query service ok' }));

router.get('/shipments', async (req, res) => {
  try {
    const shipments = await listShipments();
    sendSuccess(res, shipments);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/shipments/:id', async (req, res) => {
  try {
    const shipment = await getCurrentState(req.params.id);
    if (!shipment) return sendError(res, { status: 404, message: 'Shipment not found' });
    sendSuccess(res, shipment);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/shipments/:id/history', async (req, res) => {
  try {
    const history = await getEventTimeline(req.params.id);
    sendSuccess(res, history);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/shipments/:id/state-at', async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.query;

    const { valid, errors } = validateHistoricalStateQuery(id, timestamp);
    if (!valid) {
      return sendError(res, { status: 400, message: 'Invalid request', details: errors });
    }

    const state = await getHistoricalState(id, timestamp);
    if (!state) return sendError(res, { status: 404, message: 'No state found before this timestamp' });
    sendSuccess(res, state);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;