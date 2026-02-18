// @ts-nocheck
/**
 * GET /api/buddies/optout?token=... (public)
 * Token = opt_out_slug for a Buddy. Remove Buddy, show confirmation. Do not notify user why.
 *
 * No _lib/ imports from api/_lib/ — CORS inlined to avoid Vercel bundling issues.
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

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – Mind Measure</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,.08); text-align: center; }
    h1 { font-size: 22px; font-weight: 600; color: #0f172a; margin: 0 0 16px; }
    p { font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px; }
    .muted { font-size: 13px; color: #94a3b8; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">${body}</div>
  <p class="muted">mindmeasure.app</p>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Inline CORS ─────────────────────────────────────────────────
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Content-Type', 'text/html');
    return res
      .status(405)
      .end(
        htmlPage('Error', '<h1>Method not allowed</h1><p>Use GET with ?token=... or POST with { "token": "..." }</p>')
      );
  }

  // Accept token from query string (GET) or request body (POST)
  const token =
    req.method === 'POST' ? (req.body?.token ?? '').toString().trim() : (req.query.token ?? '').toString().trim();
  if (!token) {
    res.setHeader('Content-Type', 'text/html');
    return res
      .status(400)
      .end(htmlPage('Opt-out', '<h1>Missing token</h1><p>The opt-out link is invalid or incomplete.</p>'));
  }

  const client = getDbClient();

  try {
    await client.connect();
    const r = await client.query(
      `UPDATE buddies SET status = 'removed', updated_at = NOW()
       WHERE opt_out_slug = $1
       RETURNING id`,
      [token]
    );
    await client.end();

    if (r.rowCount === 0) {
      res.setHeader('Content-Type', 'text/html');
      return res
        .status(404)
        .end(
          htmlPage(
            'Opt-out',
            '<h1>Link invalid or expired</h1><p>This opt-out link has already been used or is no longer valid.</p>'
          )
        );
    }

    const body =
      "<h1>You've been removed</h1><p>You won't receive any further check-in reminders from Mind Measure.</p>";
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).end(htmlPage('Opt-out complete', body));
  } catch (e: unknown) {
    try {
      await client.end();
    } catch {
      /* intentionally empty */
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error('[buddies/optout]', message);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).end(htmlPage('Error', '<h1>Something went wrong</h1><p>Please try again later.</p>'));
  }
}
