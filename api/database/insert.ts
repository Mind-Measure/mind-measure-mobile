// @ts-nocheck
/**
 * SECURED Generic Database INSERT Endpoint
 * All code inlined — Vercel Vite builder cannot resolve cross-file imports.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

/* ── Inline DB pool ────────────────────────────────────────────── */
let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.AWS_AURORA_HOST || process.env.DB_HOST || 'mindmeasure-aurora.cluster-cz8c8wq4k3ak.eu-west-2.rds.amazonaws.com',
      port: parseInt(process.env.AWS_AURORA_PORT || process.env.DB_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE || process.env.DB_NAME || 'mindmeasure',
      user: process.env.AWS_AURORA_USERNAME || process.env.DB_USERNAME || 'mindmeasure_admin',
      password: process.env.AWS_AURORA_PASSWORD || process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000,
    });
    _pool.on('error', () => { _pool = null; });
  }
  return _pool;
}
async function dbQuery(text: string, params?: unknown[]) { return getPool().query(text, params); }
async function dbGetClient() { return getPool().connect(); }

/* ── Inline Auth ───────────────────────────────────────────────── */
const _idV = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
  tokenUse: 'id',
  clientId: process.env.AWS_COGNITO_CLIENT_ID || '',
});
const _accV = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
  tokenUse: 'access',
});
async function getUserIdFromToken(authHeader: string | undefined): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No authentication token provided');
  const token = authHeader.substring(7);
  try {
    const p = await _idV.verify(token);
    const uid = p.sub || (p['cognito:username'] as string) || '';
    if (uid) return uid;
  } catch {}
  try {
    const p = await _accV.verify(token);
    const uid = p.sub || p.username || '';
    if (uid) return uid;
  } catch {}
  throw new Error('Invalid or expired token');
}

/* ── Config ────────────────────────────────────────────────────── */
const ALLOWED_TABLES = new Set([
  'profiles', 'fusion_outputs', 'assessment_sessions', 'assessment_transcripts',
  'assessment_items', 'weekly_summary', 'buddy_contacts',
]);

interface InsertRequest {
  table: string;
  data: Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let userId: string;
  try {
    userId = await getUserIdFromToken(req.headers.authorization);
  } catch (e: unknown) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }

  try {
    const { table, data }: InsertRequest = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return res.status(403).json({ error: 'Forbidden', message: `Cannot insert into table '${table}'`, code: 'TABLE_NOT_ALLOWED' });
    }

    data.user_id = userId;

    if (table === 'profiles' && data.university_id) {
      const client = await dbGetClient();
      try {
        const uniCheck = await client.query('SELECT id FROM universities WHERE id = $1 OR slug = $1 LIMIT 1', [data.university_id]);
        if (uniCheck.rows.length === 0) {
          const uniName = String(data.university_id).charAt(0).toUpperCase() + String(data.university_id).slice(1) + ' University';
          await client.query(
            `INSERT INTO universities (id, name, slug, short_name, status, total_students, created_at, updated_at)
             VALUES ($1, $2, $1, $3, 'active', 0, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING`,
            [data.university_id, uniName, String(data.university_id).substring(0, 3).toUpperCase()]
          );
        }
      } finally {
        client.release();
      }
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await dbQuery(sql, values);

    return res.status(200).json({ data: result.rows, error: null });
  } catch (error: unknown) {
    const table = req.body?.table || 'unknown';
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DB INSERT] Error inserting into ${table} for user ${userId}:`, errMsg, error);
    return res.status(500).json({ error: 'Database insert failed', message: errMsg, table, data: null });
  }
}
