// @ts-nocheck
/**
 * GET /api/content/pool
 *
 * Returns published blog posts marked for the University Content Pool.
 * Fetches from the Marketing CMS API (which owns the data) instead of
 * connecting to its database directly.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

const MARKETING_CMS_URL = process.env.MARKETING_CMS_URL || 'https://marketing.mindmeasure.co.uk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Fetch published posts from the Marketing CMS API
    const response = await fetch(`${MARKETING_CMS_URL}/api/blog-posts?status=PUBLISHED&limit=100`);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.status(502).json({
        error: 'Failed to fetch from Marketing CMS',
        status: response.status,
        details: errText.slice(0, 200),
      });
    }

    const json = await response.json();
    const allPosts: Record<string, unknown>[] = json.data || json || [];

    // Filter for articles with 'university-pool' in target_sites
    const poolPosts = allPosts.filter((post) => {
      const targets = post.target_sites || post.targetSites;
      return Array.isArray(targets) && targets.includes('university-pool');
    });

    // Sort by published_at descending
    poolPosts.sort((a, b) => {
      const da = a.published_at ? new Date(a.published_at as string).getTime() : 0;
      const db = b.published_at ? new Date(b.published_at as string).getTime() : 0;
      return db - da;
    });

    return res.status(200).json({
      success: true,
      data: poolPosts,
      count: poolPosts.length,
      total: allPosts.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[content/pool]', message);
    return res.status(500).json({ error: message });
  }
}
