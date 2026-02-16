/**
 * GET /api/content/pool
 *
 * Returns published blog posts from the Marketing CMS that have been
 * marked "University Content Pool" (i.e. 'university-pool' ∈ target_sites).
 *
 * No auth required — this is public wellbeing content pushed to all universities.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

function getDbConfig() {
  return {
    host: process.env.AWS_AURORA_HOST,
    port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE,
    user: process.env.AWS_AURORA_USERNAME,
    password: process.env.AWS_AURORA_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10) || 50, 100);

  // Validate DB env vars before connecting
  if (!process.env.AWS_AURORA_HOST || !process.env.AWS_AURORA_PASSWORD) {
    return res.status(500).json({
      error: 'Database not configured',
      details: 'Missing Aurora connection environment variables',
    });
  }

  const client = new Client(getDbConfig());
  try {
    await client.connect();

    // Ensure extra columns exist (idempotent, same as Marketing CMS ensureSchema)
    await client
      .query(
        `
      ALTER TABLE marketing_blog_posts ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
      ALTER TABLE marketing_blog_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
      ALTER TABLE marketing_blog_posts ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
      ALTER TABLE marketing_blog_posts ADD COLUMN IF NOT EXISTS original_author TEXT;
      ALTER TABLE marketing_blog_posts ADD COLUMN IF NOT EXISTS subtitle TEXT;
      ALTER TABLE marketing_blog_posts ADD COLUMN IF NOT EXISTS excerpt TEXT;
    `
      )
      .catch((e) => console.warn('[content/pool] Schema sync warning (non-fatal):', e.message));

    const sql = `
      SELECT
        id, title, slug, excerpt, content_md,
        cover_image_url, cover_image_position,
        author_name, status, published_at, updated_at,
        categories, tags, target_sites, read_time
      FROM marketing_blog_posts
      WHERE status = 'PUBLISHED'
        AND 'university-pool' = ANY(target_sites)
      ORDER BY published_at DESC NULLS LAST
      LIMIT $1
    `;

    const result = await client.query(sql, [limit]);

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[content/pool] Error:', msg, error);
    return res.status(500).json({
      error: 'Failed to fetch content pool',
      details: msg,
    });
  } finally {
    await client.end().catch(() => {});
  }
}
