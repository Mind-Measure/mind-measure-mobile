// @ts-nocheck
/**
 * SECURED Generic Database UPDATE Endpoint
 *
 * Security: JWT decode auth, table allowlist, user scoping.
 * No _lib/ imports — all code inlined to avoid Vercel bundling issues.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

/** Decode a JWT payload without signature verification. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

/** Extract user ID from Bearer token (ID token or access token). */
function getUserIdFromToken(authHeader: string | undefined): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }
  const token = authHeader.substring(7);
  const payload = decodeJwtPayload(token);
  if (!payload) throw new Error('Invalid token');

  const exp = payload.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) throw new Error('Token has expired');

  const userId = (payload.sub as string) || (payload['cognito:username'] as string) || '';
  if (!userId) throw new Error('Could not determine user identity');
  return userId;
}

const ALLOWED_TABLES = new Set(['profiles', 'assessment_sessions', 'weekly_summary', 'buddy_contacts']);

interface UpdateRequest {
  table: string;
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth ────────────────────────────────────────────────────────
  let userId: string;
  try {
    userId = getUserIdFromToken(req.headers.authorization);
  } catch (e: unknown) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }

  try {
    const { table, filters = {}, data }: UpdateRequest = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: `Cannot update table '${table}'`, code: 'TABLE_NOT_ALLOWED' });
    }

    // Force user_id in WHERE clause
    filters.user_id = userId;

    const client = new Client({
      host: process.env.AWS_AURORA_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE,
      user: process.env.AWS_AURORA_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      setClauses.push(`${key} = $${paramIndex++}`);
      params.push(value);
    });

    const whereClauses: string[] = [];
    Object.entries(filters).forEach(([key, value]) => {
      whereClauses.push(`${key} = $${paramIndex++}`);
      params.push(value);
    });

    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;

    const result = await client.query(sql, params);
    await client.end();

    return res.status(200).json({ data: result.rows, error: null });
  } catch (error: unknown) {
    console.error(`[DB UPDATE] Error for user ${userId}:`, error);
    return res
      .status(500)
      .json({
        error: 'Database update failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      });
  }
}
