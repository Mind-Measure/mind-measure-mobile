/**
 * GET /api/content/pool
 *
 * Returns published articles from the university's content hub.
 * Content is curated by the university admin. Only articles the
 * university has approved and published appear here. No fallback
 * to the generic CMS pool: the university controls what students see.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

interface CohortTargeting {
  schools?: string[];
  departments?: string[];
  courses?: string[];
  yearOfStudy?: string[];
  accommodationType?: string[];
  halls?: string[];
  studyMode?: string[];
}

interface UserProfile {
  school?: string | null;
  course?: string | null;
  year_of_study?: string | null;
  living_situation?: string | null;
  hall_of_residence?: string | null;
  study_mode?: string | null;
}

function ciMatch(list: string[], value: string | null | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return list.some((v) => v.toLowerCase() === lower);
}

function matchesTargeting(targeting: CohortTargeting | null | undefined, profile: UserProfile | null): boolean {
  if (!targeting) return true;

  const checks: [string[] | undefined, string | null | undefined][] = [
    [targeting.schools, profile?.school],
    [targeting.departments, profile?.course],
    [targeting.courses, profile?.course],
    [targeting.yearOfStudy, profile?.year_of_study],
    [targeting.accommodationType, profile?.living_situation],
    [targeting.halls, profile?.hall_of_residence],
    [targeting.studyMode, profile?.study_mode],
  ];

  for (const [list, value] of checks) {
    if (Array.isArray(list) && list.length > 0) {
      if (!profile || !ciMatch(list, value)) return false;
    }
  }

  return true;
}

const HUB_URL = process.env.HUB_URL || 'https://hub.mindmeasure.co.uk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const universityId = req.query.universityId as string | undefined;
  const since = req.query.since as string | undefined;
  const userId = req.query.userId as string | undefined;

  if (!universityId) {
    return res.status(200).json({ success: true, data: [], count: 0, source: 'hub' });
  }

  try {
    let userProfile: UserProfile | null = null;
    if (userId) {
      let auroraClient: Client | null = null;
      try {
        auroraClient = new Client({
          host: process.env.AWS_AURORA_HOST,
          port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
          database: process.env.AWS_AURORA_DATABASE,
          user: process.env.AWS_AURORA_USERNAME,
          password: process.env.AWS_AURORA_PASSWORD,
          ssl: { rejectUnauthorized: false },
        });
        await auroraClient.connect();
        const profileResult = await auroraClient.query(
          'SELECT school, course, year_of_study, living_situation, hall_of_residence, study_mode FROM profiles WHERE user_id = $1',
          [userId]
        );
        if (profileResult.rows.length > 0) {
          userProfile = profileResult.rows[0];
        }
      } catch (e) {
        console.error('[content/pool] profile lookup failed:', e);
      } finally {
        if (auroraClient) await auroraClient.end().catch(() => {});
      }
    }

    let hubUrl = `${HUB_URL}/api/content?universityId=${universityId}`;
    if (since) hubUrl += `&since=${encodeURIComponent(since)}`;

    const response = await fetch(hubUrl, {
      signal: AbortSignal.timeout(15000),
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
        if (matchesTargeting(a.targeting as CohortTargeting | null, userProfile)) {
          published.push(a);
        }
      } else {
        unpublishedIds.push(String(a.id));
      }
    }

    const now = Date.now();
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
      pinned_until: a.pinned_until || a.pinnedUntil || null,
      status: 'PUBLISHED',
    }));

    normalized.sort((a, b) => {
      const pinA = a.pinned_until && new Date(a.pinned_until as string).getTime() > now ? 0 : 1;
      const pinB = b.pinned_until && new Date(b.pinned_until as string).getTime() > now ? 0 : 1;
      if (pinA !== pinB) return pinA - pinB;

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
