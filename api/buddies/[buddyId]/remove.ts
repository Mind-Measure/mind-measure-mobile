// @ts-nocheck
/**
 * POST /api/buddies/:buddyId/remove
 * Set Buddy status to removed. Do not notify Buddy.
 *
 * No _lib/ imports from api/_lib/ — auth + CORS inlined to avoid Vercel bundling issues.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-expect-error - pg types not available in Vercel environment
import { Client } from 'pg';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

function getDbClient(): Client {
  return new Client({
    host: process.env.AWS_AURORA_HOST || process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_AURORA_PORT || process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE || process.env.AWS_RDS_DATABASE || 'mindmeasure',
    user: process.env.AWS_AURORA_USERNAME || process.env.AWS_RDS_USERNAME,
    password: process.env.AWS_AURORA_PASSWORD || process.env.AWS_RDS_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
}

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
  // ── Inline CORS ─────────────────────────────────────────────────
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth ────────────────────────────────────────────────────────
  let userId: string;
  try {
    userId = await getUserIdFromToken(req.headers.authorization);
  } catch (e: unknown) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }

  const buddyId = req.query.buddyId as string;
  if (!buddyId) return res.status(400).json({ error: 'buddyId required' });

  const client = getDbClient();

  try {
    await client.connect();
    const r = await client.query(
      `UPDATE buddies SET status = 'removed', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [buddyId, userId]
    );
    await client.end();
    if (r.rowCount === 0) {
      return res.status(404).json({ error: 'Buddy not found' });
    }
    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    try {
      await client.end();
    } catch {
      /* intentionally empty */
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error('[buddies/remove]', message);
    return res.status(500).json({ error: 'Failed to remove', message });
  }
}
