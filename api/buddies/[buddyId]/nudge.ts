/**
 * POST /api/buddies/:buddyId/nudge
 * Send nudge email. Only if Buddy active. Rate-limit e.g. 1 per 14 days.
 *
 * No _lib/ imports from api/_lib/ — auth + CORS inlined to avoid Vercel bundling issues.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-expect-error - pg types not available in Vercel environment
import { Client } from 'pg';
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

function optOutUrl(optOutSlug: string): string {
  return `${BASE_URL}/optout?token=${encodeURIComponent(optOutSlug)}`;
}

async function sendNudgeEmail(p: {
  to: string;
  buddyName: string;
  inviterName: string;
  optOutUrl: string;
}): Promise<void> {
  const { to, buddyName, inviterName, optOutUrl } = p;
  const subject = `A gentle check-in reminder for ${inviterName}`;
  const optOutBlock = optOutUrl
    ? `\n\nIf you'd prefer not to receive these reminders, you can opt out here: ${optOutUrl}\n`
    : '';
  const textBody = `Hi ${buddyName},

${inviterName} uses Mind Measure and might be finding things a bit harder than usual.

A quick message or check-in could help.

You don't need to be a therapist or fix anything—just being there matters.

Remember: This isn't an emergency alert. If you think ${inviterName} is in immediate danger, please contact emergency services or their university support team.${optOutBlock}
Thanks for being a Buddy,
Mind Measure
https://mobile.mindmeasure.app`;

  const optOutHtml = optOutUrl
    ? `<p style="font-size: 13px; color: #9CA3AF; margin: 0; text-align: center;"><a href="${optOutUrl}" style="color: #8B5CF6; text-decoration: none;">Opt out of Buddy emails</a></p>`
    : '';
  const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #F9FAFB; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.email-body { background: #ffffff; padding: 40px 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.warning-box { background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; margin: 0 0 32px 0; }
.footer { padding: 24px 0; text-align: center; }
</style>
</head>
<body>
<div class="container">
<div class="email-body">
<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 16px 0;">Hi ${escapeHtml(buddyName)},</p>

<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 16px 0;"><strong>${escapeHtml(inviterName)}</strong> uses Mind Measure and might be finding things a bit harder than usual.</p>

<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 16px 0;">A quick message or check-in could help.</p>

<p style="font-size: 16px; color: #1F2937; line-height: 1.6; margin: 0 0 32px 0;">You don't need to be a therapist or fix anything—just being there matters.</p>

<div class="warning-box">
<p style="font-size: 14px; color: #92400E; line-height: 1.5; margin: 0;"><strong>Remember:</strong> This isn't an emergency alert. If you think ${escapeHtml(inviterName)} is in immediate danger, please contact emergency services or their university support team.</p>
</div>

<p style="font-size: 16px; color: #1F2937; margin: 32px 0 0 0;">Thanks for being a Buddy,<br>Mind Measure</p>
</div>

${optOutHtml ? `<div class="footer">${optOutHtml}</div>` : ''}
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
