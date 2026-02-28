// @ts-nocheck
/**
 * SECURED Generic Database UPDATE Endpoint
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
const ALLOWED_TABLES = new Set(['profiles', 'assessment_sessions', 'weekly_summary', 'buddy_contacts']);

interface UpdateRequest {
  table: string;
  filters: Record<string, unknown>;
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
    const { table, filters = {}, data }: UpdateRequest = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return res.status(403).json({ error: 'Forbidden', message: `Cannot update table '${table}'`, code: 'TABLE_NOT_ALLOWED' });
    }

    filters.user_id = userId;

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
    const result = await dbQuery(sql, params);

    return res.status(200).json({ data: result.rows, error: null });
  } catch (error: unknown) {
    console.error(`[DB UPDATE] Error for user ${userId}:`, error);
    return res.status(500).json({
      error: 'Database update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    });
  }
}
