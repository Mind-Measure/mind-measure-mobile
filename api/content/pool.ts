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
    // The Marketing CMS writes to a separate 'marketing_cms' database.
    // Use MARKETING_DB_* env vars if set; otherwise fall back to AWS_AURORA_* vars.
    const host =
      process.env.MARKETING_DB_HOST ||
      process.env.AWS_AURORA_HOST ||
      'mindmeasure-db.cz8c8wq4k3ak.eu-west-2.rds.amazonaws.com';
    const password = process.env.MARKETING_DB_PASSWORD || process.env.AWS_AURORA_PASSWORD;
    const database = process.env.MARKETING_DB_NAME || process.env.AWS_AURORA_DATABASE || 'marketing_cms';
    const user = process.env.MARKETING_DB_USER || process.env.AWS_AURORA_USERNAME || 'marketing_user';

    if (!password) {
      return res.status(500).json({ error: 'DB not configured — set MARKETING_DB_PASSWORD' });
    }

    client = new Client({
      host,
      port: parseInt(process.env.MARKETING_DB_PORT || process.env.AWS_AURORA_PORT || '5432'),
      database,
      user,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    await client.connect();

    // Debug: check what's actually in the table
    const debug = req.query.debug === '1';

    if (debug) {
      const totalRows = await client.query('SELECT count(*) as total FROM marketing_blog_posts');
      const statuses = await client.query('SELECT status, count(*) as cnt FROM marketing_blog_posts GROUP BY status');
      const sampleTargets = await client.query(
        'SELECT id, title, status, target_sites FROM marketing_blog_posts LIMIT 5'
      );
      const cols = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_name = 'marketing_blog_posts' ORDER BY ordinal_position`
      );
      return res.status(200).json({
        totalRows: totalRows.rows[0]?.total,
        statuses: statuses.rows,
        samplePosts: sampleTargets.rows,
        columns: cols.rows.map((c: { column_name: string; data_type: string }) => c.column_name),
      });
    }

    // Try Marketing CMS database first (has content_md column, university-pool articles)
    // Fall back to legacy database (has content column, student/university articles)
    let result;
    try {
      result = await client.query(
        `SELECT *
         FROM marketing_blog_posts
         WHERE LOWER(status) = 'published'
           AND 'university-pool' = ANY(target_sites)
         ORDER BY published_at DESC NULLS LAST
         LIMIT 50`
      );
    } catch {
      // If query fails (wrong DB/table), try without university-pool filter
      result = await client.query(
        `SELECT *
         FROM marketing_blog_posts
         WHERE LOWER(status) = 'published'
         ORDER BY published_at DESC NULLS LAST
         LIMIT 50`
      );
    }

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
