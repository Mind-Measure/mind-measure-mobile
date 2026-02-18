// @ts-nocheck
/**
 * SECURED Generic Database INSERT Endpoint
 *
 * Security: JWT decode auth, table allowlist, automatic user_id injection.
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

const ALLOWED_TABLES = new Set([
  'profiles',
  'fusion_outputs',
  'assessment_sessions',
  'assessment_transcripts',
  'assessment_items',
  'weekly_summary',
  'buddy_contacts',
]);

interface InsertRequest {
  table: string;
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
    const { table, data }: InsertRequest = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: `Cannot insert into table '${table}'`, code: 'TABLE_NOT_ALLOWED' });
    }

    // Force user_id to authenticated user
    data.user_id = userId;

    const client = new Client({
      host: process.env.AWS_AURORA_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE,
      user: process.env.AWS_AURORA_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Auto-seed university if inserting a profile with a university_id that doesn't exist
    if (table === 'profiles' && data.university_id) {
      const uniCheck = await client.query('SELECT id FROM universities WHERE id = $1 OR slug = $1 LIMIT 1', [
        data.university_id,
      ]);
      if (uniCheck.rows.length === 0) {
        const uniName =
          String(data.university_id).charAt(0).toUpperCase() + String(data.university_id).slice(1) + ' University';
        await client.query(
          `INSERT INTO universities (id, name, slug, short_name, status, total_students, created_at, updated_at)
           VALUES ($1, $2, $1, $3, 'active', 0, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [data.university_id, uniName, String(data.university_id).substring(0, 3).toUpperCase()]
        );
      }
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const result = await client.query(sql, values);
    await client.end();

    return res.status(200).json({ data: result.rows, error: null });
  } catch (error: unknown) {
    const table = req.body?.table || 'unknown';
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DB INSERT] Error inserting into ${table} for user ${userId}:`, errMsg, error);
    return res.status(500).json({
      error: 'Database insert failed',
      message: errMsg,
      table,
      data: null,
    });
  }
}
