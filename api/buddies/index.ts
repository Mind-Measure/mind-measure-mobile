// @ts-nocheck
/**
 * GET /api/buddies
 * List active buddies and pending invites.
 *
 * No _lib/ imports from api/_lib/ — auth + CORS inlined to avoid Vercel bundling issues.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-expect-error - pg types not available in Vercel environment
import { Client } from 'pg';

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
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No authentication token provided');
  const payload = decodeJwtPayload(authHeader.substring(7));
  if (!payload) throw new Error('Invalid token');
  const exp = payload.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) throw new Error('Token has expired');
  const userId = (payload.sub as string) || (payload['cognito:username'] as string) || '';
  if (!userId) throw new Error('Could not determine user identity');
  return userId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Inline CORS ─────────────────────────────────────────────────
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth ────────────────────────────────────────────────────────
  let userId: string;
  try {
    userId = getUserIdFromToken(req.headers.authorization);
  } catch (e: unknown) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }

  const client = getDbClient();

  try {
    await client.connect();

    const [buddiesResult, invitesResult] = await Promise.all([
      client.query(
        `SELECT id, name, email, preference_order, created_at
         FROM buddies
         WHERE user_id = $1 AND status = 'active'
         ORDER BY preference_order ASC, created_at ASC`,
        [userId]
      ),
      client.query(
        `SELECT id, invitee_name, contact_type, contact_value_masked, status, sent_at, expires_at
         FROM buddy_invites
         WHERE user_id = $1 AND status = 'pending'
         ORDER BY created_at DESC`,
        [userId]
      ),
    ]);

    await client.end();

    const activeBuddies = (buddiesResult.rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      preferenceOrder: r.preference_order,
      createdAt: r.created_at,
    }));

    const pendingInvites = (invitesResult.rows || []).map((r) => ({
      id: r.id,
      inviteeName: r.invitee_name,
      contactType: r.contact_type,
      contactValueMasked: r.contact_value_masked,
      status: r.status,
      sentAt: r.sent_at,
      expiresAt: r.expires_at,
    }));

    return res.status(200).json({ activeBuddies, pendingInvites });
  } catch (e: unknown) {
    try {
      await client.end();
    } catch {
      /* intentionally empty */
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error('[buddies] list', message);
    return res.status(500).json({ error: 'Failed to list buddies', message });
  }
}
