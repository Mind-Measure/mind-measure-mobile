/**
 * SECURED Generic Database SELECT Endpoint
 *
 * Security: JWT decode auth, table allowlist, automatic user scoping.
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

// STRICT TABLE ALLOWLIST
const ALLOWED_TABLES = new Set([
  'profiles',
  'fusion_outputs',
  'assessment_sessions',
  'assessment_transcripts',
  'assessment_items',
  'weekly_summary',
  'universities',
  'help_resources',
  'content_blocks',
  'wellbeing_reports',
  'buddy_contacts',
  'content_articles',
  'content_categories',
]);

const PUBLIC_TABLES = new Set([
  'universities',
  'help_resources',
  'content_blocks',
  'content_articles',
  'content_categories',
]);

interface SelectRequest {
  table: string;
  filters?: Record<string, any>;
  columns?: string;
  orderBy?: Array<{ column: string; ascending: boolean }>;
  limit?: number;
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
    const { table, filters = {}, columns = '*', orderBy, limit }: SelectRequest = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: `Table '${table}' is not accessible`, code: 'TABLE_NOT_ALLOWED' });
    }

    // Auto-scope to authenticated user (unless public table)
    if (!PUBLIC_TABLES.has(table)) {
      filters.user_id = userId;
    }

    const client = new Client({
      host: process.env.AWS_AURORA_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE,
      user: process.env.AWS_AURORA_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    let sql = `SELECT ${columns} FROM ${table}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters && Object.keys(filters).length > 0) {
      const whereConditions: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'in' in value) {
          const placeholders = value.in.map((_: any) => `$${paramIndex++}`).join(',');
          whereConditions.push(`${key} IN (${placeholders})`);
          params.push(...value.in);
        } else if (value && typeof value === 'object' && 'eq' in value) {
          whereConditions.push(`${key} = $${paramIndex++}`);
          params.push(value.eq);
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

    const result = await client.query(sql, params);
    await client.end();

    return res.status(200).json({ data: result.rows, error: null });
  } catch (error: any) {
    console.error(`[DB SELECT] Error for user ${userId}:`, error);
    return res.status(500).json({ error: 'Database query failed', message: error.message, data: null });
  }
}
