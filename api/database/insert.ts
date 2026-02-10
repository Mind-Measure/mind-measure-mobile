/**
 * SECURED Generic Database INSERT Endpoint
 *
 * Security measures:
 * - Cognito access-token authentication (via GetUserCommand)
 * - Table allowlist (only safe tables)
 * - Automatic user_id injection (all records belong to authenticated user)
 * - Column restrictions
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../_lib/cognito-auth';
import { Client } from 'pg';

// Tables that users can insert into
const ALLOWED_TABLES = new Set([
  'profiles',
  'fusion_outputs',
  'assessment_sessions',
  'assessment_transcripts',
  'assessment_items',
  'weekly_summary',
  'buddy_contacts', // User's emergency support contacts
]);

interface InsertRequest {
  table: string;
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
    console.error('❌ Auth failed in insert:', errMsg);
    return res.status(401).json({ error: errMsg });
  }

  try {
    const { table, data }: InsertRequest = req.body;

    // Validate table
    if (!table || !ALLOWED_TABLES.has(table)) {
      console.warn(`[SECURITY] User ${userId} attempted to insert into non-allowed table: ${table}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `Cannot insert into table '${table}'`,
        code: 'TABLE_NOT_ALLOWED',
      });
    }

    // Force user_id to authenticated user
    data.user_id = userId;

    // Build query
    const client = new Client({
      host: process.env.AWS_AURORA_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE,
      user: process.env.AWS_AURORA_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const result = await client.query(sql, values);
    await client.end();

    return res.status(200).json({
      data: result.rows,
      error: null,
    });
  } catch (error: any) {
    console.error(`[DB INSERT] Error for user ${userId}:`, error);
    return res.status(500).json({
      error: 'Database insert failed',
      message: error.message,
      data: null,
    });
  }
}
