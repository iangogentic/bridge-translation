/**
 * Database client configuration
 * Uses Drizzle ORM with Postgres.js driver for Neon PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy database connection for build-time safety
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDatabase() {
  if (!process.env.DATABASE_URL) {
    // During build, return a dummy client if no DATABASE_URL
    if (process.env.NODE_ENV !== 'production' && !dbInstance) {
      console.warn('DATABASE_URL not set - using placeholder for build');
      const client = postgres('postgres://localhost/placeholder', {
        prepare: false,
        max: 1,
      });
      return drizzle(client, { schema });
    }
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!dbInstance) {
    const client = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: process.env.NODE_ENV === 'production' ? 1 : 10,
    });
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance;
}

export const db = getDatabase();

// Export schema for use in queries
export { schema };
