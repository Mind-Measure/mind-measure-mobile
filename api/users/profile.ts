// @ts-nocheck
/**
 * Secure User Profile API
 * All code inlined — Vercel Vite builder cannot resolve cross-file imports.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

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

  const client = new Client({
    host: process.env.AWS_AURORA_HOST || process.env.DB_HOST || 'mindmeasure-aurora.cluster-cz8c8wq4k3ak.eu-west-2.rds.amazonaws.com',
    port: parseInt(process.env.AWS_AURORA_PORT || process.env.DB_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE || process.env.DB_NAME || 'mindmeasure',
    user: process.env.AWS_AURORA_USERNAME || process.env.DB_USERNAME || 'mindmeasure_admin',
    password: process.env.AWS_AURORA_PASSWORD || process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      `SELECT user_id, first_name, last_name, course, year_of_study,
              accommodation_type, university_id, created_at, updated_at
       FROM profiles WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found', userId });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error: unknown) {
    console.error(`[API] Profile fetch error for user ${userId}:`, error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Internal server error', code: 'PROFILE_FETCH_ERROR' });
  } finally {
    await client.end();
  }
}
