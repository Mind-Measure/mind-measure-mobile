import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfileData } from './useProfileData';
import { DEFAULT_USER_DATA } from '@/components/mobile/profile/types';

// ── Mock useAuth ────────────────────────────────────────────────────────────
const mockUser = { id: 'user-1', email: 'test@example.com' };
let currentUser: typeof mockUser | null = null;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

// ── Mock BackendServiceFactory ──────────────────────────────────────────────
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/services/database/BackendServiceFactory', () => ({
  BackendServiceFactory: {
    createService: () => ({
      database: {
        select: mockSelect,
        update: mockUpdate,
      },
    }),
    getEnvironmentConfig: () => ({}),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = null;
  mockSelect.mockResolvedValue({ data: [] });
  mockUpdate.mockResolvedValue({ data: null, error: null });
});

// ============================================================================
// Initial state
// ============================================================================

describe('useProfileData – initial state', () => {
  it('starts in loading state', () => {
    currentUser = null;
    const { result } = renderHook(() => useProfileData());
    // When there is no user, loading eventually becomes false
    // but userData should be defaults
    expect(result.current.userData).toEqual(DEFAULT_USER_DATA);
  });

  it('returns default user data when no user is logged in', () => {
    currentUser = null;
    const { result } = renderHook(() => useProfileData());
    expect(result.current.userData.firstName).toBe('');
    expect(result.current.userData.lastName).toBe('');
    expect(result.current.userData.institution).toBe('University of Worcester');
    expect(result.current.userData.accountType).toBe('Student');
  });

  it('has empty mood and themes data initially', () => {
    currentUser = null;
    const { result } = renderHook(() => useProfileData());
    expect(result.current.moodData).toEqual([]);
    expect(result.current.themesData).toEqual([]);
  });

  it('has no unsaved changes initially', () => {
    currentUser = null;
    const { result } = renderHook(() => useProfileData());
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('isSaving is false initially', () => {
    currentUser = null;
    const { result } = renderHook(() => useProfileData());
    expect(result.current.isSaving).toBe(false);
  });
});

// ============================================================================
// Profile loading
// ============================================================================

describe('useProfileData – profile loading', () => {
  it('fetches profile data when user is present', async () => {
    currentUser = mockUser;
    mockSelect
      .mockResolvedValueOnce({
        data: [
          {
            user_id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'test@example.com',
            university_id: 'uni-1',
            profile_completed: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'uni-1',
            name: 'Test University',
            schools: [{ name: 'School A' }],
            halls_of_residence: [{ name: 'Hall A' }],
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] }); // fusion_outputs

    const { result } = renderHook(() => useProfileData());

    // Wait for loading to finish
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userData.firstName).toBe('John');
    expect(result.current.userData.lastName).toBe('Doe');
    expect(result.current.profileCompleted).toBe(true);
  });

  it('populates school and hall options from university data', async () => {
    currentUser = mockUser;
    mockSelect
      .mockResolvedValueOnce({
        data: [
          {
            user_id: 'user-1',
            first_name: 'Jane',
            last_name: 'Doe',
            university_id: 'uni-1',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'uni-1',
            name: 'Test Uni',
            schools: [{ name: 'Engineering' }, { name: 'Arts' }],
            halls_of_residence: [{ name: 'Bredon' }, { name: 'St Johns' }],
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useProfileData());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schoolOptions).toEqual(['Engineering', 'Arts']);
    expect(result.current.hallOptions).toEqual(['Bredon', 'St Johns']);
  });

  it('handles error during profile loading gracefully', async () => {
    currentUser = mockUser;
    mockSelect.mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useProfileData());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should fall back to defaults
    expect(result.current.userData).toEqual(DEFAULT_USER_DATA);
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Unsaved changes tracking
// ============================================================================

describe('useProfileData – unsaved changes', () => {
  it('setHasUnsavedChanges marks changes as unsaved', () => {
    currentUser = null;
    const { result } = renderHook(() => useProfileData());

    act(() => {
      result.current.setHasUnsavedChanges(true);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});
