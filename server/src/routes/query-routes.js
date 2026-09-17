import express from 'express';
import { sortShipments, paginate } from '../services/queries/query-helpers.js';
import { summarizeShipments } from '../services/queries/shipment-summary.js';
import { formatShipmentResponse, formatShipmentList } from '../services/queries/shipment-formatter.js';
import { validateHistoricalStateQuery } from '../services/queries/query-validators.js';
import { getCurrentState, getEventTimeline, getHistoricalState, listShipments } from '../services/queries/shipment-query-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

const router = express.Router();

router.get('/health', (_req, res) => sendSuccess(res, { status: 'query service ok' }));

router.get('/shipments', async (req, res) => {
  try {
    const { sortBy = 'lastEventVersion', order = 'desc', page = 1, limit = 20 } = req.query;

    const shipments = await listShipments();
    const formatted = formatShipmentList(shipments);
    const sorted = sortShipments(formatted, sortBy, order);
    const paginated = paginate(sorted, Number(page), Number(limit));

    sendSuccess(res, paginated);
  } catch (err) {
    sendError(res, err.message || 'Failed to list shipments', 500);
  }
});

router.get('/shipments/summary', async (req, res) => {
  try {
    const shipments = await listShipments();
    const formatted = formatShipmentList(shipments);
    const summary = summarizeShipments(formatted);
    sendSuccess(res, summary);
  } catch (err) {
    sendError(res, err.message || 'Failed to fetch summary', 500);
  }
});

router.get('/shipments/:id', async (req, res) => {
  try {
    const shipment = await getCurrentState(req.params.id);
    if (!shipment) return sendError(res, 'Shipment not found', 404);
    sendSuccess(res, formatShipmentResponse(shipment));
  } catch (err) {
    sendError(res, err.message || 'Failed to fetch shipment', 500);
  }
});

router.get('/shipments/:id/history', async (req, res) => {
  try {
    const history = await getEventTimeline(req.params.id);
    sendSuccess(res, history);
  } catch (err) {
    sendError(res, err.message || 'Failed to fetch event history', 500);
  }
});

router.get('/shipments/:id/state-at', async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.query;

    const { valid, errors } = validateHistoricalStateQuery(id, timestamp);
    if (!valid) {
      return sendError(res, 'Invalid request', 400, errors);
    }

    const state = await getHistoricalState(id, timestamp);
    if (!state) return sendError(res, 'No state found before this timestamp', 404);
    sendSuccess(res, state);
  } catch (err) {
    sendError(res, err.message || 'Failed to reconstruct historical state', 500);
  }
});

export default router;