/**
 * config/db.js
 *
 * Opens a single Mongoose connection to MongoDB.
 * Exported as a function so server.js can await it before
 * accepting traffic — avoids "connected before ready" race conditions.
 */

import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1); // Hard exit — app cannot run without a DB
  }
}
