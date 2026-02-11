/**
 * POST /api/buddies/invite/:inviteId/resend
 * Resend invite email. Only if pending. Rate-limit resends.
 *
 * No _lib/ imports from api/_lib/ — auth + CORS inlined to avoid Vercel bundling issues.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDbClient } from '../../_lib/db';
import { generateToken, hashToken, inviteExpiresAt } from '../../_lib/tokens';
import { sendInviteEmail, consentUrl } from '../../_lib/emails';

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

const RESEND_COOLDOWN_HOURS = 1;

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

  const inviteId = req.query.inviteId as string;
  if (!inviteId) {
    return res.status(400).json({ error: 'inviteId required' });
  }

  const client = getDbClient();

  try {
    await client.connect();

    const row = await client.query(
      `SELECT bi.id, bi.contact_value, bi.invitee_name, bi.personal_message, bi.status, bi.last_resend_at,
              p.first_name, p.last_name
       FROM buddy_invites bi
       LEFT JOIN profiles p ON p.user_id = bi.user_id
       WHERE bi.id = $1 AND bi.user_id = $2`,
      [inviteId, userId]
    );

    if (row.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Invite not found' });
    }

    const inv = row.rows[0] as {
      contact_value: string;
      invitee_name: string;
      personal_message: string | null;
      status: string;
      last_resend_at: string | null;
      first_name: string | null;
      last_name: string | null;
    };
    const firstName = inv.first_name || '';
    const lastName = inv.last_name || '';
    const inviterName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Someone';
    if (inv.status !== 'pending') {
      await client.end();
      return res.status(400).json({ error: 'Can only resend pending invites' });
    }

    if (inv.last_resend_at) {
      const hours = (Date.now() - new Date(inv.last_resend_at).getTime()) / (1000 * 60 * 60);
      if (hours < RESEND_COOLDOWN_HOURS) {
        await client.end();
        return res.status(429).json({
          error: 'Please wait before resending',
          retryAfterMinutes: Math.ceil((RESEND_COOLDOWN_HOURS - hours) * 60),
        });
      }
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = inviteExpiresAt();

    await client.query(
      `UPDATE buddy_invites
       SET token_hash = $1, expires_at = $2, resend_count = resend_count + 1, last_resend_at = NOW(), sent_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND user_id = $4`,
      [tokenHash, expiresAt, inviteId, userId]
    );

    const url = consentUrl(token);
    try {
      await sendInviteEmail({
        to: inv.contact_value,
        inviteeName: inv.invitee_name,
        inviterName,
        personalMessage: inv.personal_message,
        consentUrl: url,
      });
    } catch (mailErr: unknown) {
      const mailMessage = mailErr instanceof Error ? mailErr.message : String(mailErr);
      console.error('[buddies/resend] Failed to send invite email:', mailMessage);
      await client.end();
      return res.status(500).json({
        error: 'Invite updated but email could not be sent',
        message: mailMessage || 'Unknown SES error',
      });
    }

    await client.end();
    return res.status(200).json({ ok: true, message: 'Invite resent' });
  } catch (e: unknown) {
    try {
      await client.end();
    } catch {
      /* intentionally empty */
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error('[buddies/resend]', message);
    return res.status(500).json({ error: 'Failed to resend', message });
  }
}
