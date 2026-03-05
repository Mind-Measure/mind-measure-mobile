/**
 * GET /api/content/pool
 *
 * Returns published articles from the university's content hub.
 * Content is curated by the university admin. Only articles the
 * university has approved and published appear here. No fallback
 * to the generic CMS pool: the university controls what students see.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

const HUB_URL = process.env.HUB_URL || 'https://hub.mindmeasure.co.uk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const universityId = req.query.universityId as string | undefined;
  const since = req.query.since as string | undefined;

  if (!universityId) {
    return res.status(200).json({ success: true, data: [], count: 0, source: 'hub' });
  }

  try {
    let hubUrl = `${HUB_URL}/api/content?universityId=${universityId}`;
    if (since) hubUrl += `&since=${encodeURIComponent(since)}`;

    const response = await fetch(hubUrl, {
      signal: AbortSignal.timeout(6000),
    });

    let articles: Record<string, unknown>[] = [];
    let syncedAt: string | undefined;
    let incremental = false;

    if (response.ok) {
      const d = await response.json();
      articles = d.articles || [];
      syncedAt = d.syncedAt;
      incremental = d.incremental || false;
    }

    const published: Record<string, unknown>[] = [];
    const unpublishedIds: string[] = [];

    for (const a of articles) {
      if (a.status === 'PUBLISHED') {
        published.push(a);
      } else {
        unpublishedIds.push(String(a.id));
      }
    }

    const normalized = published.map((a) => ({
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
      updated_at: a.updated_at || a.updatedAt || null,
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
      unpublishedIds,
      syncedAt,
      incremental,
      source: 'hub',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[content/pool]', message);
    return res.status(500).json({ error: message });
  }
}
