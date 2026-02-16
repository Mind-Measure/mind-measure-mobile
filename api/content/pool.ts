/**
 * GET /api/content/pool
 *
 * Returns published blog posts from the Marketing CMS that have been
 * marked "University Content Pool" (i.e. 'university-pool' ∈ target_sites).
 *
 * No auth required — this is public wellbeing content pushed to all universities.
 *
 * Optional query params:
 *   category  – filter by category name (case-insensitive)
 *   limit     – max rows (default 50, max 100)
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
  const category = (req.query.category as string) || '';

  const client = new Client(getDbConfig());
  try {
    await client.connect();

    let sql = `
      SELECT
        id, title, slug, excerpt, content_md,
        cover_image_url, cover_image_position,
        author_name, status, published_at, updated_at,
        categories, tags, target_sites, read_time
      FROM marketing_blog_posts
      WHERE status = 'PUBLISHED'
        AND 'university-pool' = ANY(target_sites)
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (category) {
      sql += ` AND $${idx}::text = ANY(categories)`;
      params.push(category);
      idx++;
    }

    sql += ` ORDER BY published_at DESC NULLS LAST LIMIT $${idx}`;
    params.push(limit);

    const result = await client.query(sql, params);

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[content/pool] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch content pool',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await client.end().catch(() => {});
  }
}
