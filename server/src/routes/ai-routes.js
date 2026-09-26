import { Router } from 'express';
import { queryAuditAssistant } from '../services/ai/audit-assistant-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

const router = Router();

/**
 * POST /api/ai/audit
 * Query the AI audit assistant for a specific shipment aggregate.
 */
router.post('/audit', async (req, res) => {
  try {
    const { aggregateId, query, userContext } = req.body;
    if (!aggregateId) {
      return sendError(res, 'aggregateId is required in request body', 400);
    }

    const result = await queryAuditAssistant({ aggregateId, query, userContext });
    sendSuccess(res, result);
  } catch (err) {
    console.error('[AI Audit Route Error]:', err);
    sendError(res, err.message || 'AI assistant evaluation failed', 500);
  }
});

export default router;
