/**
 * Get Assessment History for Authenticated User
 * Accepts both Cognito access tokens and ID tokens.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../_lib/cognito-auth';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Authenticate (accepts access token OR ID token) ────────────
  let userId: string;
  try {
    const auth = await authenticateRequest(req.headers.authorization);
    userId = auth.userId;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Authentication failed';
    console.error('[history] Auth error:', msg);
    return res.status(401).json({ error: msg });
  }

  // ── Fetch assessment history from Aurora ──────────────────────
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

    res.status(200).json({
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[history] DB error for user ${userId}:`, msg);
    res.status(500).json({
      error: 'Internal server error',
      code: 'ASSESSMENT_HISTORY_FETCH_ERROR',
    });
  }
}
