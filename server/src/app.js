/**
 * app.js
 *
 * Express application factory.
 * Keeps app creation separate from server startup (server.js) so the app
 * can be imported by test files without binding to a port.
 *
 * Middleware registration order (MUST NOT change):
 *   1. Security / CORS
 *   2. Body parsers
 *   3. Request logging
 *   4. Routes
 *   5. 404 handler
 *   6. Error handler  ← always last
 */

import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import commandRoutes from './routes/command-routes.js';
import queryRoutes from './routes/query-routes.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// ── 1. CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST'],  // No PUT/PATCH/DELETE — write side uses commands
    credentials: true,
  })
);

// ── 2. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── 3. Request logging (dev only) ─────────────────────────────────────────────
if (env.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ── 4. Routes ─────────────────────────────────────────────────────────────────

/**
 * CQRS split:
 *   /api/commands  → write side (append events, mutate aggregate state via projection)
 *   /api/queries   → read side  (read from ShipmentReadModel, event history)
 *
 * Keeping distinct URL prefixes makes it immediately obvious from a request
 * whether you are on the write or read side — helps during code review and debugging.
 */
app.use('/api/commands', commandRoutes);
app.use('/api/queries', queryRoutes);

// Top-level health check (for load balancers / Docker health checks)
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

// ── 5. 404 — catch-all for unmatched routes ──────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: 'Route not found' },
  });
});

// ── 6. Centralised error handler (MUST be last) ───────────────────────────────
app.use(errorHandler);

export default app;
