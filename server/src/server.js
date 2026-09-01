/**
 * server.js
 *
 * Entry point — connects to MongoDB, then starts the HTTP server.
 *
 * The DB connection is awaited before app.listen() so the server
 * never accepts traffic while the DB is still initialising.
 */

import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';

async function startServer() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`[Server] Running on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[Server] Command API: http://localhost:${env.port}/api/commands`);
    console.log(`[Server] Query   API: http://localhost:${env.port}/api/queries`);
  });
}

startServer();
