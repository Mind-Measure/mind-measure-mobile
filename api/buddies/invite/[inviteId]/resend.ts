// @ts-nocheck
/**
 * POST /api/buddies/invite/:inviteId/resend
 * Resend invite email. Only if pending. Rate-limit resends.
 *
 * No _lib/ imports from api/_lib/ — auth + CORS inlined to avoid Vercel bundling issues.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-expect-error - pg types not available in Vercel environment
import { Client } from 'pg';
import { createHash, randomBytes } from 'crypto';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// ── Inlined from _lib/db.ts ─────────────────────────────────────────
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

// ── Inlined from _lib/tokens.ts ─────────────────────────────────────
const TOKEN_BYTES = 32;
const INVITE_EXPIRY_DAYS = 14;
function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}
function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
function inviteExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d;
}

// ── Inlined from _lib/emails.ts ─────────────────────────────────────
const FROM = 'Mind Measure <noreply@mindmeasure.co.uk>';
const REPLY_TO = 'info@mindmeasure.co.uk';
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

async function sendEmail({ to, subject, textBody, htmlBody }: SendEmailOptions): Promise<void> {
  const command = new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: [to] },
    ReplyToAddresses: [REPLY_TO],
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Text: { Data: textBody, Charset: 'UTF-8' },
        ...(htmlBody ? { Html: { Data: htmlBody, Charset: 'UTF-8' } } : {}),
      },
    },
  });
  await sesClient.send(command);
}

const BASE_URL = process.env.BUDDY_BASE_URL || 'https://buddy.mindmeasure.app';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function consentUrl(token: string): string {
  return `${BASE_URL}/invite?token=${encodeURIComponent(token)}`;
}

async function sendInviteEmail(p: {
  to: string;
  inviteeName: string;
  inviterName: string;
  personalMessage: string | null;
  consentUrl: string;
}): Promise<void> {
  const { to, inviteeName, inviterName, personalMessage, consentUrl } = p;
  const subject = `${inviterName} has invited you to be a Buddy`;
  const extra = personalMessage ? `\n\nThey added a personal message:\n\n"${personalMessage}"\n\n` : '\n\n';
  const textBody = `Hi ${inviteeName},

${inviterName} uses Mind Measure to keep track of their wellbeing and has asked if you'd be willing to be a Buddy.

Being a Buddy means you may occasionally receive an email encouraging you to check in with them. You will not see their check-ins or scores.

This isn't an emergency service, and you're not expected to provide support beyond what feels comfortable.
${extra}To accept or decline, please visit this link (it expires in 14 days):

${consentUrl}

If you'd rather not, you can decline. No explanation needed.

Thanks,
Mind Measure
https://mobile.mindmeasure.app

You're receiving this because ${inviterName} entered your email address to invite you to be a Buddy. If you think this was a mistake, you can decline on the next page.`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #F9FAFB; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.email-body { background: #ffffff; padding: 40px 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.personal-message { background: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #8B5CF6; border-radius: 8px; padding: 20px; margin: 0 0 32px 0; }
.message-label { font-size: 13px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.cta-button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600; }
.footer { padding: 24px 0; text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.5; }
</style>
</head>
<body>
<div class="container">
<div class="email-body">
<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 16px 0;">Hi ${escapeHtml(inviteeName)},</p>

<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 16px 0;"><strong>${escapeHtml(inviterName)}</strong> uses Mind Measure to keep track of their wellbeing and has asked if you'd be willing to be a Buddy.</p>

<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 16px 0;">Being a Buddy means you may occasionally receive an email encouraging you to check in with them. You will not see their check-ins or scores.</p>

<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 32px 0;">This isn't an emergency service, and you're not expected to provide support beyond what feels comfortable.</p>

${
  personalMessage
    ? `<div class="personal-message">
<div class="message-label">Personal message from ${escapeHtml(inviterName)}</div>
<p style="font-size: 15px; color: #1F2937; line-height: 1.6; margin: 0; font-style: italic;">"${escapeHtml(personalMessage)}"</p>
</div>`
    : ''
}

<div style="text-align: center; margin: 32px 0;">
<a href="${consentUrl}" class="cta-button">Review and respond</a>
</div>

<p style="font-size: 15px; color: #64748B; line-height: 1.6; margin: 32px 0 0 0;">If you'd rather not, you can decline. No explanation needed.</p>

<p style="font-size: 16px; color: #1F2937; margin: 32px 0 0 0;">Thanks,<br>Mind Measure</p>
</div>

<div class="footer">
<p>You're receiving this because ${escapeHtml(inviterName)} entered your email address to invite you to be a Buddy. If you think this was a mistake, you can decline on the next page.</p>
</div>
</div>
</body>
</html>`;

  await sendEmail({ to, subject, textBody, htmlBody });
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
