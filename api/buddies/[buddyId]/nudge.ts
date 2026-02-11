/**
 * POST /api/buddies/:buddyId/nudge
 * Send nudge email. Only if Buddy active. Rate-limit e.g. 1 per 14 days.
 *
 * No _lib/ imports from api/_lib/ — auth + CORS inlined to avoid Vercel bundling issues.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDbClient } from '../_lib/db';
import { sendNudgeEmail, optOutUrl } from '../_lib/emails';

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

const NUDGE_COOLDOWN_DAYS = 14;

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
    userId = getUserIdFromToken(req.headers.authorization);
  } catch (e: unknown) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }

  const buddyId = req.query.buddyId as string;
  if (!buddyId) return res.status(400).json({ error: 'buddyId required' });

  const client = getDbClient();

  try {
    await client.connect();

    const row = await client.query(
      `SELECT id, name, email, status, last_nudged_at, opt_out_slug
       FROM buddies WHERE id = $1 AND user_id = $2`,
      [buddyId, userId]
    );

    if (row.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Buddy not found' });
    }

    const b = row.rows[0] as {
      id: string;
      name: string;
      email: string;
      status: string;
      last_nudged_at: string | null;
      opt_out_slug: string | null;
    };
    if (b.status !== 'active') {
      await client.end();
      return res.status(400).json({ error: 'Buddy is not active' });
    }

    // Fetch inviter's full name for the email
    const inviterRow = await client.query(`SELECT first_name, last_name FROM profiles WHERE user_id = $1`, [userId]);
    const inviterData = inviterRow.rows[0] as { first_name?: string; last_name?: string } | undefined;
    const firstName = inviterData?.first_name || '';
    const lastName = inviterData?.last_name || '';
    const inviterName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'your friend';

    if (b.last_nudged_at) {
      const days = (Date.now() - new Date(b.last_nudged_at).getTime()) / (1000 * 60 * 60 * 24);
      if (days < NUDGE_COOLDOWN_DAYS) {
        await client.end();
        return res.status(429).json({
          error: 'Please wait before sending another nudge',
          retryAfterDays: Math.ceil(NUDGE_COOLDOWN_DAYS - days),
        });
      }
    }

    await client.query(`UPDATE buddies SET last_nudged_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2`, [
      buddyId,
      userId,
    ]);

    const outUrl = b.opt_out_slug ? optOutUrl(b.opt_out_slug) : '';
    try {
      await sendNudgeEmail({
        to: b.email,
        buddyName: b.name,
        inviterName,
        optOutUrl: outUrl,
      });
    } catch (mailErr: unknown) {
      const mailMessage = mailErr instanceof Error ? mailErr.message : String(mailErr);
      console.error('[buddies/nudge] Failed to send nudge email:', mailMessage);
      await client.end();
      return res.status(500).json({
        error: 'Nudge recorded but email could not be sent',
        message: mailMessage,
      });
    }

    await client.end();
    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    try {
      await client.end();
    } catch {
      /* intentionally empty */
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error('[buddies/nudge]', message);
    return res.status(500).json({ error: 'Failed to nudge', message });
  }
}
