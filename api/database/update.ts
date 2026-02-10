/**
 * SECURED Generic Database UPDATE Endpoint
 *
 * Security measures:
 * - Cognito access-token authentication (via GetUserCommand)
 * - Table allowlist
 * - User scoping (can only update own records)
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../_lib/cognito-auth';
import { Client } from 'pg';

const ALLOWED_TABLES = new Set([
  'profiles',
  'assessment_sessions',
  'weekly_summary',
  'buddy_contacts', // User's emergency support contacts
]);

interface UpdateRequest {
  table: string;
  filters: Record<string, any>;
  data: Record<string, any>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Inline CORS
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Authenticate (accepts access token OR ID token) ─────────
  let userId: string;
  try {
    const auth = await authenticateRequest(req.headers.authorization);
    userId = auth.userId;
  } catch (authError: unknown) {
    const errMsg = authError instanceof Error ? authError.message : String(authError);
    console.error('❌ Auth failed in update:', errMsg);
    return res.status(401).json({ error: errMsg });
  }

  try {
    const { table, filters = {}, data }: UpdateRequest = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      console.warn(`[SECURITY] User ${userId} attempted to update non-allowed table: ${table}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `Cannot update table '${table}'`,
        code: 'TABLE_NOT_ALLOWED',
      });
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
    const params: any[] = [];
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

    return res.status(200).json({
      data: result.rows,
      error: null,
    });
  } catch (error: any) {
    console.error(`[DB UPDATE] Error for user ${userId}:`, error);
    return res.status(500).json({
      error: 'Database update failed',
      message: error.message,
      data: null,
    });
  }
}
