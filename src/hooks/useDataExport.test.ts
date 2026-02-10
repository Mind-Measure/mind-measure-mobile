import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataExport } from './useDataExport';

// ── Mock useAuth ────────────────────────────────────────────────────────────
const mockUser = { id: 'user-1', email: 'user@test.com' };
let currentUser: typeof mockUser | null = mockUser;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

// ── Mock BackendServiceFactory ──────────────────────────────────────────────
const mockSelect = vi.fn();

vi.mock('@/services/database/BackendServiceFactory', () => ({
  BackendServiceFactory: {
    createService: () => ({
      database: { select: mockSelect },
    }),
    getEnvironmentConfig: () => ({}),
  },
}));

// ── Mock cognitoApiClient ───────────────────────────────────────────────────
vi.mock('@/services/cognito-api-client', () => ({
  cognitoApiClient: {
    getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  },
}));

// ── Mock global fetch ───────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = mockUser;
  mockSelect.mockResolvedValue({ data: [] });
  mockFetch.mockReset();
});

// ============================================================================
// Initial State
// ============================================================================

describe('useDataExport – initial state', () => {
  it('defaults exportPeriod to 30 days', () => {
    const { result } = renderHook(() => useDataExport(true));
    expect(result.current.exportPeriod).toBe(30);
  });

  it('starts with export modal hidden', () => {
    const { result } = renderHook(() => useDataExport(true));
    expect(result.current.showExportModal).toBe(false);
  });

  it('starts with isExporting false', () => {
    const { result } = renderHook(() => useDataExport(true));
    expect(result.current.isExporting).toBe(false);
  });

  it('starts with showBaselineRequired false', () => {
    const { result } = renderHook(() => useDataExport(true));
    expect(result.current.showBaselineRequired).toBe(false);
  });

  it('starts with showExportProfileReminder false', () => {
    const { result } = renderHook(() => useDataExport(true));
    expect(result.current.showExportProfileReminder).toBe(false);
  });
});

// ============================================================================
// Export Period
// ============================================================================

describe('useDataExport – export period', () => {
  it('allows setting export period to 14', () => {
    const { result } = renderHook(() => useDataExport(true));
    act(() => result.current.setExportPeriod(14));
    expect(result.current.exportPeriod).toBe(14);
  });

  it('allows setting export period to 90', () => {
    const { result } = renderHook(() => useDataExport(true));
    act(() => result.current.setExportPeriod(90));
    expect(result.current.exportPeriod).toBe(90);
  });
});

// ============================================================================
// handleExportData – baseline & profile checks
// ============================================================================

describe('useDataExport – handleExportData', () => {
  it('shows baseline required when no baseline exists today', async () => {
    mockSelect.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDataExport(true));

    await act(async () => {
      await result.current.handleExportData();
    });

    expect(result.current.showBaselineRequired).toBe(true);
    expect(result.current.showExportModal).toBe(false);
  });

  it('shows profile reminder when baseline exists but profile incomplete', async () => {
    const today = new Date().toISOString();
    mockSelect.mockResolvedValue({
      data: [{ created_at: today, analysis: { assessment_type: 'baseline' } }],
    });

    const { result } = renderHook(() => useDataExport(false)); // profile NOT completed

    await act(async () => {
      await result.current.handleExportData();
    });

    expect(result.current.showExportProfileReminder).toBe(true);
    expect(result.current.showExportModal).toBe(false);
  });

  it('shows export modal when baseline exists and profile is completed', async () => {
    const today = new Date().toISOString();
    mockSelect.mockResolvedValue({
      data: [{ created_at: today, analysis: { assessment_type: 'baseline' } }],
    });

    const { result } = renderHook(() => useDataExport(true)); // profile completed

    await act(async () => {
      await result.current.handleExportData();
    });

    expect(result.current.showExportModal).toBe(true);
  });
});
