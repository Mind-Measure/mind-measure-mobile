/**
 * GET /api/content/pool
 *
 * Returns published blog posts marked for the University Content Pool.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let client: Client | null = null;
  try {
    const host = process.env.AWS_AURORA_HOST;
    const password = process.env.AWS_AURORA_PASSWORD;

    if (!host || !password) {
      return res.status(500).json({ error: 'DB not configured', host: !!host, pw: !!password });
    }

    client = new Client({
      host,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE || 'mindmeasure',
      user: process.env.AWS_AURORA_USERNAME || 'mindmeasure_admin',
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    await client.connect();

    // Simple query - only uses columns from Prisma schema (guaranteed to exist)
    const result = await client.query(
      `SELECT id, title, slug, excerpt, content_md,
              cover_image_url, author_name, published_at, read_time,
              target_sites, status
       FROM marketing_blog_posts
       WHERE status = 'PUBLISHED'
         AND 'university-pool' = ANY(target_sites)
       ORDER BY published_at DESC NULLS LAST
       LIMIT 50`
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[content/pool]', message);
    return res.status(500).json({ error: message });
  } finally {
    if (client) await client.end().catch(() => {});
  }
}
