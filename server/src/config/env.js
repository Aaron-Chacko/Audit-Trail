/**
 * config/env.js
 *
 * Loads and validates environment variables at startup.
 * All other modules should import their config values from here —
 * never read process.env directly outside this file.
 */

import 'dotenv/config';

const required = ['MONGO_URI'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
};
