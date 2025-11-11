/**
 * Database client configuration
 * Uses Drizzle ORM with Postgres.js driver for Neon PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
// For serverless environments (Vercel), use max 1 connection
// For long-running servers, you can increase this
const connectionString = process.env.DATABASE_URL;

const client = postgres(connectionString, {
  prepare: false,
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for use in queries
export { schema };
