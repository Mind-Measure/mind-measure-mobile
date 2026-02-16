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

    // Show all published articles — target_sites varies between databases
    // ('student', 'university', 'university-pool' etc.)
    // Status may be lowercase or uppercase depending on which system wrote it
    const result = await client.query(
      `SELECT *
       FROM marketing_blog_posts
       WHERE LOWER(status) = 'published'
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
