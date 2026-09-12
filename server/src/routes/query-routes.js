import express from 'express';
import { sortShipments, paginate } from '../services/queries/query-helpers.js';
import { summarizeShipments } from '../services/queries/shipment-summary.js';
import { formatShipmentResponse, formatShipmentList } from '../services/queries/shipment-formatter.js';
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
    const { sortBy = 'lastEventVersion', order = 'desc', page = 1, limit = 20 } = req.query;

    const shipments = await listShipments();
    const formatted = formatShipmentList(shipments);
    const sorted = sortShipments(formatted, sortBy, order);
    const paginated = paginate(sorted, Number(page), Number(limit));

    sendSuccess(res, paginated);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/shipments/summary', async (req, res) => {
  try {
    const shipments = await listShipments();
    const formatted = formatShipmentList(shipments);
    const summary = summarizeShipments(formatted);
    sendSuccess(res, summary);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/shipments/:id', async (req, res) => {
  try {
    const shipment = await getCurrentState(req.params.id);
    if (!shipment) return sendError(res, { status: 404, message: 'Shipment not found' });
    sendSuccess(res, formatShipmentResponse(shipment));
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