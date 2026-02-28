/**
 * Shared database connection pool for Vercel serverless functions.
 *
 * Module-level Pool is reused across warm invocations within the same
 * Vercel function instance, avoiding the overhead of creating a new
 * TCP connection on every request.
 */

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.AWS_AURORA_HOST || process.env.DB_HOST || 'mindmeasure-aurora.cluster-cz8c8wq4k3ak.eu-west-2.rds.amazonaws.com',
      port: parseInt(process.env.AWS_AURORA_PORT || process.env.DB_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE || process.env.DB_NAME || 'mindmeasure',
      user: process.env.AWS_AURORA_USERNAME || process.env.DB_USERNAME || 'mindmeasure_admin',
      password: process.env.AWS_AURORA_PASSWORD || process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[db-pool] Unexpected pool error:', err.message);
      pool = null;
    });
  }
  return pool;
}

/**
 * Execute a query using the shared pool.
 * Automatically acquires and releases a client.
 */
export async function query(text: string, params?: unknown[]) {
  const p = getPool();
  return p.query(text, params);
}

/**
 * Acquire a client for transaction use.
 * Caller MUST call client.release() when done.
 */
export async function getClient(): Promise<PoolClient> {
  const p = getPool();
  return p.connect();
}
