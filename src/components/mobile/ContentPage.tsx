import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Clock, ChevronRight } from 'lucide-react';
import { ArticleDetailPage } from './ArticleDetailPage';
import { getUserUniversityProfile } from '../../features/mobile/data';
import { useAuth } from '@/contexts/AuthContext';

const ARTICLES_PER_PAGE = 10;
const CACHE_KEY = 'mm_content_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  articles: ContentArticle[];
  universityName: string;
  wellbeingSupportUrl: string;
  timestamp: number;
}

function getCachedArticles(): CachedData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) return cached;
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedArticles(data: CachedData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded — ignore */
  }
}

interface ContentArticle {
  id: string;
  category: 'Anxiety' | 'Sleep' | 'Stress' | 'Relationships' | 'Exercise' | 'Study' | 'Wellbeing';
  title: string;
  description: string;
  readTime: number;
  isNew?: boolean;
  thumbnail: string;
  fullContent: string;
  author?: string;
  publishDate?: string;
  published_at?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Anxiety: '#F59E0B',
  Sleep: '#99CCCE',
  Stress: '#FF6B6B',
  Relationships: '#DDD6FE',
  Exercise: '#99CCCE',
  Study: '#F59E0B',
  Wellbeing: '#FF6B6B',
};

interface ContentPageProps {
  universityName?: string;
  universityLogo?: string;
}

export function ContentPage({
  universityName: propUniversityName = 'Your University',
  universityLogo: propUniversityLogo,
}: ContentPageProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<ContentArticle | null>(null);
  const [articles, setArticles] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [wellbeingSupportUrl, setWellbeingSupportUrl] = useState<string>('');
  const [universityName, setUniversityName] = useState<string>(propUniversityName);
  const [universityLogo, _setUniversityLogo] = useState<string | undefined>(propUniversityLogo);
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const parseArticles = useCallback((poolData: { data?: Record<string, unknown>[] }): ContentArticle[] => {
    const rows: Record<string, unknown>[] = poolData.data || [];
    const mapped: ContentArticle[] = rows.map((row) => {
      const cats = Array.isArray(row.categories) ? row.categories : [];
      const firstCategory = typeof cats[0] === 'string' ? cats[0] : '';
      const category = mapCategory(firstCategory);
      return {
        id: String(row.id),
        category,
        title: String(row.title || ''),
        description: String(row.excerpt || row.subtitle || ''),
        readTime: Number(row.read_time) || calculateReadTime(String(row.content_md || row.content || '')),
        isNew: isRecent(row.published_at as string | undefined),
        thumbnail:
          (row.cover_image_url as string) || 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=800',
        fullContent: String(row.content_md || row.content || ''),
        author: String(row.author_name || 'Mind Measure'),
        publishDate: row.published_at
          ? new Date(row.published_at as string).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '',
        published_at: (row.published_at as string) || undefined,
      };
    });
    mapped.sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return dateB - dateA;
    });
    return mapped;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      // Stale-while-revalidate: show cached data immediately, then refresh in background
      const cached = getCachedArticles();
      if (cached) {
        setArticles(cached.articles);
        setUniversityName(cached.universityName);
        setWellbeingSupportUrl(cached.wellbeingSupportUrl);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const profilePromise = user?.id ? getUserUniversityProfile(user.id).catch(() => null) : Promise.resolve(null);
        const articlesPromise = fetch('/api/content/pool?limit=50')
          .then((r) => (r.ok ? r.json() : { data: [] }))
          .catch(() => ({ data: [] }));

        const [profile, poolData] = await Promise.all([profilePromise, articlesPromise]);
        if (cancelled) return;

        const uniName = profile?.name || 'Rummidge University';
        const supportUrl = profile?.wellbeing_support_url || '';
        const mapped = parseArticles(poolData);

        setArticles(mapped);
        setUniversityName(uniName);
        setWellbeingSupportUrl(supportUrl);

        setCachedArticles({
          articles: mapped,
          universityName: uniName,
          wellbeingSupportUrl: supportUrl,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error loading content pool:', error);
        if (!cached) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [user, parseArticles]);

  // Infinite scroll: load more articles as user scrolls down
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => prev + ARTICLES_PER_PAGE);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(ARTICLES_PER_PAGE);
  }, [activeFilter]);

  const mapCategory = (slug?: string): ContentArticle['category'] => {
    const mapping: Record<string, ContentArticle['category']> = {
      anxiety: 'Anxiety',
      sleep: 'Sleep',
      stress: 'Stress',
      relationships: 'Relationships',
      exercise: 'Exercise',
      study: 'Study',
      wellbeing: 'Wellbeing',
    };
    return mapping[slug?.toLowerCase() || ''] || 'Study';
  };

  const isRecent = (publishedAt?: string): boolean => {
    if (!publishedAt) return false;
    const daysDiff = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  const calculateReadTime = (content?: string): number => {
    if (!content) return 1;
    const words = content
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return Math.max(1, Math.ceil(words.length / 200));
  };

  const filters = ['All', 'Wellbeing', 'Anxiety', 'Sleep', 'Stress', 'Relationships', 'Exercise', 'Study'];
  const filteredArticles = activeFilter === 'All' ? articles : articles.filter((a) => a.category === activeFilter);
  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;
  const newCount = articles.filter((a) => a.isNew).length;

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#2D4C4C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255,255,255,0.15)',
              borderTopColor: '#99CCCE',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading articles...</p>
        </div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <ArticleDetailPage
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        universityName={universityName}
        universityLogo={universityLogo}
        wellbeingSupportUrl={wellbeingSupportUrl}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F0', paddingBottom: '100px' }}>
      {/* ═══ SPECTRA HERO ═══ */}
      <div
        style={{
          backgroundColor: '#2D4C4C',
          padding: '56px 24px 32px',
          minHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 16px',
              letterSpacing: '0.05em',
            }}
          >
            {universityName}
          </p>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 8px',
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Wellbeing Content
          </h1>

          <p
            style={{
              fontSize: '15px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.6)',
              margin: '0 0 20px',
              lineHeight: 1.5,
              maxWidth: '320px',
            }}
          >
            Expert tips, resources and insights from your student wellbeing team
          </p>

          {newCount > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '8px 16px',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {newCount} new article{newCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══ FILTER PILLS ═══ */}
      <div
        style={{
          padding: '20px 0 12px',
          backgroundColor: '#F5F5F0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '0 24px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  flexShrink: 0,
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: isActive ? 'none' : '1.5px solid rgba(45,76,76,0.15)',
                  backgroundColor: isActive ? '#2D4C4C' : '#ffffff',
                  color: isActive ? '#ffffff' : '#2D4C4C',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ ARTICLE CARDS ═══ */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {visibleArticles.map((article, i) => {
          const catColor = CATEGORY_COLORS[article.category] || '#99CCCE';
          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 4) * 0.08 }}
              onClick={() => setSelectedArticle(article)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: `${catColor}40`,
                  }}
                />
                {article.isNew && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#99CCCE',
                      color: '#1a2e2e',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    NEW
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 20px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#2D4C4C',
                      backgroundColor: `${catColor}30`,
                      padding: '4px 12px',
                      borderRadius: '12px',
                    }}
                  >
                    {article.category}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'rgba(45,76,76,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={12} />
                    {article.readTime} min
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#2D4C4C',
                    margin: '0 0 8px',
                    lineHeight: 1.35,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {article.title}
                </h3>

                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(45,76,76,0.6)',
                    margin: '0 0 14px',
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}
                >
                  {article.description}
                </p>

                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#2D4C4C',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Read full article <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: 'rgba(45,76,76,0.05)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(45,76,76,0.3)" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2D4C4C', margin: '0 0 8px' }}>No articles found</h3>
          <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.5)', margin: 0 }}>Try selecting a different category</p>
        </div>
      )}
    </div>
  );
}
