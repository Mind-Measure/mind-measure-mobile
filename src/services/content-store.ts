/**
 * Persistent article store backed by localStorage.
 * Scoped per institution ID so switching universities gets a clean slate.
 * No TTL — articles persist until explicitly cleared or replaced by sync.
 */

interface StoredArticle {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content_md: string;
  cover_image_url: string;
  cover_image_position?: string;
  author_name: string;
  original_author_name?: string | null;
  pool_source_id?: string | null;
  categories: string[];
  tags?: string[];
  published_at: string | null;
  updated_at?: string | null;
}

interface ContentStoreData {
  articles: StoredArticle[];
  lastSyncedAt: string | null;
  institutionId: string;
}

function storeKey(institutionId: string): string {
  return `mm_content_store_${institutionId}`;
}

export function getStoredContent(institutionId: string): ContentStoreData | null {
  try {
    const raw = localStorage.getItem(storeKey(institutionId));
    if (!raw) return null;
    const parsed: ContentStoreData = JSON.parse(raw);
    if (parsed.institutionId !== institutionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStore(data: ContentStoreData): void {
  try {
    localStorage.setItem(storeKey(data.institutionId), JSON.stringify(data));
  } catch {
    // localStorage quota exceeded — clear old stores and retry once
    try {
      clearAllContentStores();
      localStorage.setItem(storeKey(data.institutionId), JSON.stringify(data));
    } catch {
      // give up
    }
  }
}

/**
 * Merge incremental sync results into the stored articles.
 * - Updated articles replace existing by ID
 * - New articles are added
 * - Unpublished IDs are removed
 */
export function mergeIncrementalSync(
  institutionId: string,
  newArticles: StoredArticle[],
  unpublishedIds: string[],
  syncedAt: string
): StoredArticle[] {
  const existing = getStoredContent(institutionId);
  const articleMap = new Map<string, StoredArticle>();

  if (existing) {
    for (const a of existing.articles) {
      articleMap.set(a.id, a);
    }
  }

  for (const id of unpublishedIds) {
    articleMap.delete(id);
  }

  for (const a of newArticles) {
    articleMap.set(a.id, a);
  }

  const merged = Array.from(articleMap.values());
  merged.sort((a, b) => {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0;
    const db = b.published_at ? new Date(b.published_at).getTime() : 0;
    return db - da;
  });

  saveStore({ articles: merged, lastSyncedAt: syncedAt, institutionId });
  return merged;
}

/**
 * Replace the entire store with a full fetch result.
 */
export function replaceFullSync(institutionId: string, articles: StoredArticle[], syncedAt: string): void {
  const sorted = [...articles].sort((a, b) => {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0;
    const db = b.published_at ? new Date(b.published_at).getTime() : 0;
    return db - da;
  });
  saveStore({ articles: sorted, lastSyncedAt: syncedAt, institutionId });
}

/**
 * Prefetch content in the background (fire-and-forget).
 * Called during onboarding so content is cached before the user
 * reaches the Content tab for the first time.
 */
export async function prefetchContent(universityId: string, userId?: string): Promise<void> {
  if (!universityId) return;

  const existing = getStoredContent(universityId);
  if (existing && existing.articles.length > 0) return;

  try {
    let url = `/api/content/pool?universityId=${encodeURIComponent(universityId)}`;
    if (userId) url += `&userId=${encodeURIComponent(userId)}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) return;

    const data = await response.json();
    const articles = data.data || [];
    const syncedAt = data.syncedAt || new Date().toISOString();

    if (articles.length > 0) {
      replaceFullSync(universityId, articles, syncedAt);
    }
  } catch {
    // Prefetch is best-effort — failures are silent
  }
}

/**
 * Clear content store for a specific institution.
 */
export function clearContentStore(institutionId: string): void {
  try {
    localStorage.removeItem(storeKey(institutionId));
  } catch {
    // ignore
  }
}

/**
 * Clear all content stores (used on logout or institution switch).
 */
export function clearAllContentStores(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('mm_content_store_'));
    for (const k of keys) {
      localStorage.removeItem(k);
    }
    localStorage.removeItem('mm_content_cache');
  } catch {
    // ignore
  }
}
