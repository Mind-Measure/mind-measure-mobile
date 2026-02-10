import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock BackendServiceFactory before importing anything that uses it
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockGetCurrentUser = vi.fn();

vi.mock('@/services/database/BackendServiceFactory', () => ({
  BackendServiceFactory: {
    createService: () => ({
      database: {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      },
      auth: {
        getCurrentUser: mockGetCurrentUser,
      },
    }),
    getEnvironmentConfig: () => ({}),
  },
}));

// Mock fetch for createUniversity bucket creation
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});

import {
  getAllUniversities,
  getUniversityById,
  getUniversityBySlug,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  updateEmergencyContacts,
  getContentArticles,
  getContentArticleById,
  deleteContentArticle,
  isUserAuthorized,
  getCMSStatistics,
  createContentTag,
} from './data';

describe('CMS data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── getAllUniversities ────────────────────────────────────────────────
  describe('getAllUniversities', () => {
    it('returns list of universities', async () => {
      const universities = [
        { id: '1', name: 'Oxford', status: 'active' },
        { id: '2', name: 'Cambridge', status: 'planning' },
      ];
      mockSelect.mockResolvedValue({ data: universities, error: null });

      const result = await getAllUniversities();
      expect(result).toEqual(universities);
      expect(mockSelect).toHaveBeenCalledWith('universities', expect.objectContaining({ columns: '*' }));
    });

    it('returns empty array on error', async () => {
      mockSelect.mockResolvedValue({ data: null, error: 'DB error' });
      const result = await getAllUniversities();
      expect(result).toEqual([]);
    });

    it('returns empty array on exception', async () => {
      mockSelect.mockRejectedValue(new Error('Network error'));
      const result = await getAllUniversities();
      expect(result).toEqual([]);
    });
  });

  // ─── getUniversityById ────────────────────────────────────────────────
  describe('getUniversityById', () => {
    it('returns university when found', async () => {
      const uni = { id: '1', name: 'Oxford' };
      mockSelect.mockResolvedValue({ data: [uni], error: null });

      const result = await getUniversityById('1');
      expect(result).toEqual(uni);
    });

    it('returns null when not found', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });
      const result = await getUniversityById('999');
      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockSelect.mockResolvedValue({ data: null, error: 'Not found' });
      const result = await getUniversityById('1');
      expect(result).toBeNull();
    });
  });

  // ─── getUniversityBySlug ──────────────────────────────────────────────
  describe('getUniversityBySlug', () => {
    it('returns university by slug', async () => {
      const uni = { id: '1', name: 'Oxford', slug: 'oxford' };
      mockSelect.mockResolvedValue({ data: [uni], error: null });

      const result = await getUniversityBySlug('oxford');
      expect(result).toEqual(uni);
      expect(mockSelect).toHaveBeenCalledWith('universities', expect.objectContaining({ filters: { slug: 'oxford' } }));
    });

    it('returns null on error', async () => {
      mockSelect.mockRejectedValue(new Error('DB down'));
      const result = await getUniversityBySlug('missing');
      expect(result).toBeNull();
    });
  });

  // ─── createUniversity ─────────────────────────────────────────────────
  describe('createUniversity', () => {
    it('creates university with generated slug', async () => {
      const newUni = { id: '3', name: 'Imperial College London' };
      mockInsert.mockResolvedValue({ data: newUni, error: null });

      await createUniversity({ name: 'Imperial College London', contact_email: 'info@imperial.ac.uk' });
      expect(mockInsert).toHaveBeenCalledWith(
        'universities',
        expect.objectContaining({
          slug: 'imperial-college-london',
          name: 'Imperial College London',
        })
      );
    });

    it('returns null on insert error', async () => {
      mockInsert.mockResolvedValue({ data: null, error: 'Duplicate' });
      const result = await createUniversity({ name: 'Dup' });
      expect(result).toBeNull();
    });
  });

  // ─── updateUniversity ─────────────────────────────────────────────────
  describe('updateUniversity', () => {
    it('updates and returns university', async () => {
      const updated = { id: '1', name: 'Oxford Updated' };
      mockUpdate.mockResolvedValue({ data: updated, error: null });

      await updateUniversity('1', { name: 'Oxford Updated' });
      expect(mockUpdate).toHaveBeenCalledWith(
        'universities',
        expect.objectContaining({ name: 'Oxford Updated', updated_at: expect.any(String) }),
        { id: '1' }
      );
    });

    it('returns null on error', async () => {
      mockUpdate.mockResolvedValue({ data: null, error: 'DB error' });
      const result = await updateUniversity('1', { name: 'X' });
      expect(result).toBeNull();
    });
  });

  // ─── deleteUniversity ─────────────────────────────────────────────────
  describe('deleteUniversity', () => {
    it('returns true on successful deletion', async () => {
      mockDelete.mockResolvedValue({ error: null });
      const result = await deleteUniversity('1');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      mockDelete.mockResolvedValue({ error: 'Failed' });
      const result = await deleteUniversity('1');
      expect(result).toBe(false);
    });
  });

  // ─── updateEmergencyContacts ──────────────────────────────────────────
  describe('updateEmergencyContacts', () => {
    it('updates emergency contacts for a university', async () => {
      mockUpdate.mockResolvedValue({ error: null });
      const contacts = [
        {
          id: 'c1',
          name: 'Crisis Line',
          phone: '123',
          description: 'Help',
          is24Hour: true,
          isPrimary: true,
          category: 'crisis' as const,
        },
      ];
      const result = await updateEmergencyContacts('uni-1', contacts);
      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        'universities',
        expect.objectContaining({ emergency_contacts: contacts }),
        { id: 'uni-1' }
      );
    });
  });

  // ─── getContentArticles ───────────────────────────────────────────────
  describe('getContentArticles', () => {
    it('fetches articles with optional filters', async () => {
      const articles = [{ id: 'a1', title: 'Wellbeing 101', status: 'published' }];
      mockSelect.mockResolvedValue({ data: articles, error: null });

      const result = await getContentArticles('uni-1', 'published');
      expect(result).toEqual(articles);
      expect(mockSelect).toHaveBeenCalledWith(
        'content_articles',
        expect.objectContaining({ filters: { university_id: 'uni-1', status: 'published' } })
      );
    });

    it('fetches all articles when no filters', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });
      const result = await getContentArticles();
      expect(result).toEqual([]);
    });
  });

  // ─── getContentArticleById ────────────────────────────────────────────
  describe('getContentArticleById', () => {
    it('fetches article and its category', async () => {
      const article = { id: 'a1', title: 'Test', category_id: 'cat1' };
      const category = { id: 'cat1', name: 'Wellbeing', slug: 'wellbeing', color: '#10b981' };
      mockSelect
        .mockResolvedValueOnce({ data: [article], error: null }) // article query
        .mockResolvedValueOnce({ data: [category], error: null }); // category query

      const result = await getContentArticleById('a1');
      expect(result).toEqual({ ...article, category });
    });

    it('returns null when article not found', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });
      const result = await getContentArticleById('missing');
      expect(result).toBeNull();
    });
  });

  // ─── deleteContentArticle ─────────────────────────────────────────────
  describe('deleteContentArticle', () => {
    it('returns true on success', async () => {
      mockDelete.mockResolvedValue({ error: null });
      expect(await deleteContentArticle('a1')).toBe(true);
    });

    it('returns false on error', async () => {
      mockDelete.mockResolvedValue({ error: 'Not found' });
      expect(await deleteContentArticle('a1')).toBe(false);
    });
  });

  // ─── isUserAuthorized ─────────────────────────────────────────────────
  describe('isUserAuthorized', () => {
    it('always authorizes @mindmeasure.co.uk emails', async () => {
      const result = await isUserAuthorized('admin@mindmeasure.co.uk', 'any-uni');
      expect(result).toBe(true);
      // Should not even query the DB
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('checks database for other emails', async () => {
      mockSelect.mockResolvedValue({ data: [{ id: 'u1' }], error: null });
      const result = await isUserAuthorized('user@oxford.ac.uk', 'uni-1');
      expect(result).toBe(true);
    });

    it('returns false when user not found', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });
      const result = await isUserAuthorized('nobody@example.com', 'uni-1');
      expect(result).toBe(false);
    });
  });

  // ─── getCMSStatistics ─────────────────────────────────────────────────
  describe('getCMSStatistics', () => {
    it('computes statistics from university data', async () => {
      mockSelect.mockResolvedValue({
        data: [
          { status: 'active', total_students: 30000, emergency_contacts: [{ id: 'c1' }, { id: 'c2' }] },
          { status: 'planning', total_students: 15000, emergency_contacts: [] },
          { status: 'active', total_students: 25000, emergency_contacts: [{ id: 'c3' }] },
        ],
        error: null,
      });

      const stats = await getCMSStatistics();
      expect(stats.totalUniversities).toBe(3);
      expect(stats.activeUniversities).toBe(2);
      expect(stats.inSetupUniversities).toBe(1);
      expect(stats.totalStudents).toBe(70000);
      expect(stats.totalEmergencyContacts).toBe(3);
    });

    it('returns zeros on error', async () => {
      mockSelect.mockResolvedValue({ data: null, error: 'DB error' });
      const stats = await getCMSStatistics();
      expect(stats.totalUniversities).toBe(0);
      expect(stats.totalStudents).toBe(0);
    });
  });

  // ─── createContentTag ─────────────────────────────────────────────────
  describe('createContentTag', () => {
    it('generates slug from tag name', async () => {
      mockInsert.mockResolvedValue({ data: { id: 't1', name: 'Mental Health', slug: 'mental-health' }, error: null });
      await createContentTag('Mental Health');
      expect(mockInsert).toHaveBeenCalledWith(
        'content_tags',
        expect.objectContaining({ name: 'Mental Health', slug: 'mental-health' })
      );
    });

    it('returns null on error', async () => {
      mockInsert.mockRejectedValue(new Error('insert failed'));
      const result = await createContentTag('Bad');
      expect(result).toBeNull();
    });
  });
});
