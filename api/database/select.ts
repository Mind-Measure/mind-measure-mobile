// @ts-nocheck
/**
 * SECURED Generic Database SELECT Endpoint
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
const ALLOWED_TABLES = new Set([
  'profiles', 'fusion_outputs', 'assessment_sessions', 'assessment_transcripts',
  'assessment_items', 'weekly_summary', 'universities', 'help_resources',
  'content_blocks', 'wellbeing_reports', 'buddy_contacts', 'content_articles',
  'content_categories',
]);
const PUBLIC_TABLES = new Set([
  'universities', 'help_resources', 'content_blocks', 'content_articles', 'content_categories',
]);

interface FilterValue { in?: unknown[]; eq?: unknown; gte?: string; }
interface SelectRequest {
  table: string;
  filters?: Record<string, string | number | boolean | FilterValue>;
  columns?: string;
  orderBy?: Array<{ column: string; ascending: boolean }>;
  limit?: number;
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
    const { table, filters = {}, columns = '*', orderBy, limit }: SelectRequest = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return res.status(403).json({ error: 'Forbidden', message: `Table '${table}' is not accessible`, code: 'TABLE_NOT_ALLOWED' });
    }

    if (!PUBLIC_TABLES.has(table)) {
      filters.user_id = userId;
    }

    let sql = `SELECT ${columns} FROM ${table}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters && Object.keys(filters).length > 0) {
      const whereConditions: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'in' in value) {
          const filterVal = value as FilterValue;
          const placeholders = (filterVal.in ?? []).map(() => `$${paramIndex++}`).join(',');
          whereConditions.push(`${key} IN (${placeholders})`);
          params.push(...(filterVal.in ?? []));
        } else if (value && typeof value === 'object' && 'eq' in value) {
          whereConditions.push(`${key} = $${paramIndex++}`);
          params.push((value as FilterValue).eq);
        } else {
          whereConditions.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      });
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    if (orderBy && orderBy.length > 0) {
      const orderClauses = orderBy.map((o) => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`);
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    if (limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const result = await dbQuery(sql, params);
    return res.status(200).json({ data: result.rows, error: null });
  } catch (error: unknown) {
    console.error(`[DB SELECT] Error for user ${userId}:`, error);
    return res.status(500).json({
      error: 'Database query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    });
  }
}
