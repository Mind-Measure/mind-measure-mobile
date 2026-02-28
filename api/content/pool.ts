// @ts-nocheck
/**
 * GET /api/content/pool
 *
 * Returns published articles from the university's content hub.
 * Content is curated by the university admin — only articles they've
 * approved and published appear here.
 *
 * Falls back to the central Marketing CMS pool if no hub articles exist yet.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

const HUB_URL = process.env.HUB_URL || 'https://hub.mindmeasure.co.uk';
const MARKETING_CMS_URL = process.env.MARKETING_CMS_URL || 'https://marketing.mindmeasure.co.uk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const universityId = req.query.universityId as string | undefined;

  try {
    let articles: Record<string, unknown>[] = [];

    // Fetch hub and CMS pool in parallel — use whichever returns content
    const hubPromise = universityId
      ? fetch(`${HUB_URL}/api/content?universityId=${universityId}`, { signal: AbortSignal.timeout(6000) })
          .then(async (r) => {
            if (!r.ok) return [];
            const d = await r.json();
            return (d.articles || []).filter((a: Record<string, unknown>) => a.status === 'PUBLISHED');
          })
          .catch(() => {
            return [] as Record<string, unknown>[];
          })
      : Promise.resolve([] as Record<string, unknown>[]);

    const cmsPromise = fetch(`${MARKETING_CMS_URL}/api/blog-posts?status=PUBLISHED&limit=100`, { signal: AbortSignal.timeout(6000) })
      .then(async (r) => {
        if (!r.ok) return [];
        const d = await r.json();
        const allPosts: Record<string, unknown>[] = d.data || d || [];
        return allPosts.filter((post) => {
          const targets = post.target_sites || post.targetSites;
          return Array.isArray(targets) && targets.includes('university-pool');
        });
      })
      .catch(() => {
        return [] as Record<string, unknown>[];
      });

    const [hubArticles, cmsArticles] = await Promise.all([hubPromise, cmsPromise]);
    articles = hubArticles.length > 0 ? hubArticles : cmsArticles;

    const normalized = articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content_md: a.content_md || a.contentMd || '',
      cover_image_url: a.cover_image_url || a.coverImageUrl || '',
      cover_image_position: a.cover_image_position || a.coverImagePosition || 'center',
      author_name: a.author_name || a.authorName || '',
      original_author_name: a.original_author_name || null,
      pool_source_id: a.pool_source_id || null,
      categories: a.categories || [],
      tags: a.tags || [],
      published_at: a.published_at || a.publishedAt || null,
      status: 'PUBLISHED',
    }));

    normalized.sort((a, b) => {
      const da = a.published_at ? new Date(a.published_at as string).getTime() : 0;
      const db = b.published_at ? new Date(b.published_at as string).getTime() : 0;
      return db - da;
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      success: true,
      data: normalized,
      count: normalized.length,
      source: articles.length > 0 && universityId ? 'hub' : 'pool',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[content/pool]', message);
    return res.status(500).json({ error: message });
  }
}
