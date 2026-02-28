// @ts-nocheck
import { VercelRequest, VercelResponse } from '@vercel/node';
import pkg from 'pg';
const { Client } = pkg;

/**
 * Track Article View API
 * Records a view event for analytics and popularity ranking.
 * Also tracks reads back to pool sources for cross-estate metrics.
 *
 * POST /api/content/track-view
 * Body: { articleId, userId?, universityId, poolSourceId? }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { articleId, userId, universityId, poolSourceId } = req.body;

  if (!articleId) {
    return res.status(400).json({ error: 'articleId is required' });
  }

  const client = new Client({
    host: process.env.AWS_AURORA_HOST,
    port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE,
    user: process.env.AWS_AURORA_USERNAME,
    password: process.env.AWS_AURORA_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Insert view event
    await client.query(
      `INSERT INTO article_views (article_id, user_id, university_id, viewed_at)
       VALUES ($1, $2, $3, NOW())`,
      [articleId, userId || null, universityId || null]
    );

    // Increment local view_count
    await client.query(
      `UPDATE content_articles SET view_count = view_count + 1 WHERE id = $1`,
      [articleId]
    );

    // Track read back to pool source for cross-estate metrics
    if (poolSourceId && universityId) {
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS pool_read_tracking (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pool_source_id VARCHAR(255) NOT NULL,
            university_id VARCHAR(255),
            company_id VARCHAR(255),
            local_article_id UUID,
            read_count INTEGER DEFAULT 0,
            last_read_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(pool_source_id, COALESCE(university_id, ''), COALESCE(company_id, ''))
          )
        `);

        await client.query(`
          INSERT INTO pool_read_tracking (pool_source_id, university_id, local_article_id, read_count, last_read_at)
          VALUES ($1, $2, $3, 1, NOW())
          ON CONFLICT (pool_source_id, COALESCE(university_id, ''), COALESCE(company_id, ''))
          DO UPDATE SET read_count = pool_read_tracking.read_count + 1, last_read_at = NOW()
        `, [poolSourceId, universityId, articleId]);
      } catch {
        // Pool tracking failed (non-fatal)
      }
    }

    return res.status(200).json({ success: true, message: 'View tracked successfully' });
  } catch (error) {
    console.error('[Track View Error]', error);
    return res.status(500).json({
      error: 'Failed to track view',
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await client.end();
  }
}
