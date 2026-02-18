// @ts-nocheck
/**
 * Get Assessment History for Authenticated User
 *
 * Auth: Decodes JWT payload from Bearer token (works with both ID and access tokens).
 * No _lib/ imports — all code is inlined to avoid Vercel bundling issues.
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth ────────────────────────────────────────────────────────
  let userId: string;
  try {
    userId = getUserIdFromToken(req.headers.authorization);
  } catch (e: unknown) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }

  // ── Database ────────────────────────────────────────────────────
  try {
    const pgClient = new Client({
      host: process.env.AWS_AURORA_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE,
      user: process.env.AWS_AURORA_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await pgClient.connect();

    const result = await pgClient.query(
      `SELECT id, user_id, final_score, created_at, analysis
       FROM fusion_outputs
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    await pgClient.end();

    res.status(200).json({ data: result.rows, count: result.rows.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[history] DB error for user ${userId}:`, msg);
    res.status(500).json({ error: 'Internal server error', code: 'ASSESSMENT_HISTORY_FETCH_ERROR' });
  }
}
