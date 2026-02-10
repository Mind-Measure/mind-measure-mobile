import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HelpArticles } from './HelpArticles';
import type { ContentArticle } from '../../features/cms/data';

// Mock data
const mockArticles: ContentArticle[] = [
  {
    id: 'a1',
    university_id: 'u1',
    title: 'Managing Exam Stress',
    slug: 'managing-exam-stress',
    excerpt: 'Tips for dealing with exam pressure',
    content: '<p>Full article content</p>',
    status: 'published',
    is_featured: true,
    view_count: 42,
    published_at: '2025-03-15T10:00:00Z',
    created_at: '2025-03-10T10:00:00Z',
    updated_at: '2025-03-15T10:00:00Z',
    featured_image: 'https://bucket.s3.amazonaws.com/uploads/exam-stress.jpg',
    category: { id: 'c1', name: 'Wellbeing', slug: 'wellbeing', color: '#10b981', created_at: '', updated_at: '' },
  },
  {
    id: 'a2',
    university_id: 'u1',
    title: 'Financial Aid Guide',
    slug: 'financial-aid-guide',
    excerpt: 'How to access financial support',
    content: '<p>Article</p>',
    status: 'published',
    is_featured: false,
    view_count: 15,
    published_at: '2025-02-01T10:00:00Z',
    created_at: '2025-01-20T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
    category: { id: 'c2', name: 'Financial', slug: 'financial', color: '#f59e0b', created_at: '', updated_at: '' },
  },
  {
    id: 'a3',
    university_id: 'u1',
    title: 'Crisis Support Resources',
    slug: 'crisis-support',
    content: '<p>Article</p>',
    status: 'published',
    is_featured: false,
    view_count: 100,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    category: { id: 'c3', name: 'Crisis Support', slug: 'crisis', color: '#ef4444', created_at: '', updated_at: '' },
  },
];

// Mock getHelpArticles
vi.mock('../../features/mobile/data', () => ({
  getHelpArticles: vi.fn().mockResolvedValue([]),
}));

// Mock getImageUrl
vi.mock('@/utils/imageUrl', () => ({
  getImageUrl: vi.fn((url: string, _size: string) => url + '?optimized'),
}));

import { getHelpArticles } from '../../features/mobile/data';

describe('HelpArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getHelpArticles as ReturnType<typeof vi.fn>).mockResolvedValue(mockArticles);
  });

  // ─── rendering ──────────────────────────────────────────────────────────
  it('renders header and search input', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Help & Support')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
  });

  it('renders article titles after loading', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Managing Exam Stress')).toBeInTheDocument();
    });
    expect(screen.getByText('Financial Aid Guide')).toBeInTheDocument();
    expect(screen.getByText('Crisis Support Resources')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    // Use a never-resolving promise to keep loading state
    (getHelpArticles as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<HelpArticles />);
    expect(screen.getByText('Loading articles...')).toBeInTheDocument();
  });

  // ─── featured badge ───────────────────────────────────────────────────
  it('shows Featured badge on featured articles', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  // ─── category badges ──────────────────────────────────────────────────
  it('shows category names as badges', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Wellbeing')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
    });
  });

  // ─── search / filtering ───────────────────────────────────────────────
  it('filters articles by search query in title', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Managing Exam Stress')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search articles...');
    fireEvent.change(searchInput, { target: { value: 'Financial' } });

    expect(screen.getByText('Financial Aid Guide')).toBeInTheDocument();
    expect(screen.queryByText('Managing Exam Stress')).not.toBeInTheDocument();
  });

  it('filters articles by search query in excerpt', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Managing Exam Stress')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search articles...');
    fireEvent.change(searchInput, { target: { value: 'exam pressure' } });

    expect(screen.getByText('Managing Exam Stress')).toBeInTheDocument();
    expect(screen.queryByText('Financial Aid Guide')).not.toBeInTheDocument();
  });

  it('shows empty state when no articles match search', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Managing Exam Stress')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search articles...');
    fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });

    expect(screen.getByText('No articles found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument();
  });

  // ─── article click callback ───────────────────────────────────────────
  it('calls onArticleSelect when article is clicked', async () => {
    const onSelect = vi.fn();
    render(<HelpArticles onArticleSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('Managing Exam Stress')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Managing Exam Stress'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1', title: 'Managing Exam Stress' }));
  });

  // ─── image URL usage ──────────────────────────────────────────────────
  it('uses getImageUrl for featured images with thumbnail size', async () => {
    const { getImageUrl } = await import('@/utils/imageUrl');
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('Managing Exam Stress')).toBeInTheDocument();
    });

    expect(getImageUrl).toHaveBeenCalledWith('https://bucket.s3.amazonaws.com/uploads/exam-stress.jpg', 'thumbnail');
  });

  // ─── view count ───────────────────────────────────────────────────────
  it('displays view count for articles', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  // ─── date formatting ─────────────────────────────────────────────────
  it('formats published date in en-GB format', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('15 Mar 2025')).toBeInTheDocument();
    });
  });

  // ─── category filter buttons ──────────────────────────────────────────
  it('renders category filter buttons', async () => {
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('All Articles')).toBeInTheDocument();
    });
    // Use getAllByText since "Crisis Support" appears as both a filter button and article badge
    expect(screen.getAllByText('Crisis Support').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Academic')).toBeInTheDocument();
  });

  // ─── empty state without search ───────────────────────────────────────
  it('shows correct empty state when no articles and no search query', async () => {
    (getHelpArticles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<HelpArticles />);
    await waitFor(() => {
      expect(screen.getByText('No articles found')).toBeInTheDocument();
    });
    expect(screen.getByText('No articles available in this category')).toBeInTheDocument();
  });
});
