// @ts-nocheck
/**
 * Get Assessment History for Authenticated User
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let userId: string;
  try {
    userId = await getUserIdFromToken(req.headers.authorization);
  } catch (e: unknown) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }

  try {
    const result = await dbQuery(
      `SELECT id, user_id, final_score, created_at, analysis
       FROM fusion_outputs
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({ data: result.rows, count: result.rows.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[history] DB error for user ${userId}:`, msg);
    res.status(500).json({ error: 'Internal server error', code: 'ASSESSMENT_HISTORY_FETCH_ERROR' });
  }
}
