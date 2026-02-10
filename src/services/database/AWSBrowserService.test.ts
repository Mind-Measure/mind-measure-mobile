import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AWSBrowserDatabaseService, AWSBrowserAuthService, AWSBrowserStorageService } from './AWSBrowserService';

// Mock cognitoApiClient
vi.mock('../cognito-api-client', () => ({
  cognitoApiClient: {
    getIdToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  },
}));

// Stub import.meta.env
vi.stubEnv('VITE_API_BASE_URL', '');

// ─── helpers ────────────────────────────────────────────────────────────────
function makeFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function makeFetchFail(status = 500, statusText = 'Internal Server Error', body = 'error') {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ error: body }),
    text: () => Promise.resolve(body),
  });
}

const dbConfig = {
  provider: 'aws' as const,
  region: 'eu-west-2',
  cognitoUserPoolId: 'eu-west-2_test',
  cognitoClientId: 'testclientid',
  s3BucketName: 'test-bucket',
};

// ─── AWSBrowserDatabaseService ──────────────────────────────────────────────
describe('AWSBrowserDatabaseService', () => {
  let db: AWSBrowserDatabaseService;

  beforeEach(() => {
    vi.restoreAllMocks();
    // Set window.location for constructor path detection
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', protocol: 'http:' },
      writable: true,
    });
    db = new AWSBrowserDatabaseService(dbConfig);
  });

  // ── SELECT ──────────────────────────────────────────────────────────────
  it('select returns data on success', async () => {
    const mockData = [{ id: '1', name: 'Alice' }];
    globalThis.fetch = makeFetchOk({ data: mockData, count: 1 });

    const result = await db.select('users');
    expect(result.data).toEqual(mockData);
    expect(result.count).toBe(1);
    expect(result.error).toBeNull();
  });

  it('select sends correct body with filters and options', async () => {
    globalThis.fetch = makeFetchOk({ data: [], count: 0 });

    await db.select('users', {
      columns: ['id', 'name'],
      filters: { status: 'active' },
      orderBy: [{ column: 'name', ascending: true }],
      limit: 10,
    });

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.table).toBe('users');
    expect(body.columns).toEqual(['id', 'name']);
    expect(body.filters).toEqual({ status: 'active' });
    expect(body.limit).toBe(10);
  });

  it('select returns empty array on error (fails silently)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await db.select('users');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
    expect(result.count).toBe(0);
  });

  // ── INSERT ──────────────────────────────────────────────────────────────
  it('insert sends data and returns result', async () => {
    const newUser = { id: '2', name: 'Bob' };
    globalThis.fetch = makeFetchOk({ data: newUser });

    const result = await db.insert('users', { name: 'Bob' });
    expect(result.data).toEqual(newUser);
    expect(result.error).toBeNull();
  });

  it('insert returns error message on failure', async () => {
    globalThis.fetch = makeFetchFail(500, 'Server Error', 'duplicate key');

    const result = await db.insert('users', { name: 'Bob' });
    expect(result.data).toBeNull();
    expect(result.error).toContain('API call failed');
  });

  // ── UPDATE ──────────────────────────────────────────────────────────────
  it('update sends data with filters', async () => {
    const updated = { id: '1', name: 'Alice Updated' };
    globalThis.fetch = makeFetchOk({ data: updated });

    const result = await db.update('users', { name: 'Alice Updated' }, { id: '1' });
    expect(result.data).toEqual(updated);
    expect(result.error).toBeNull();
  });

  it('update returns error on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timeout'));

    const result = await db.update('users', { name: 'X' }, { id: '1' });
    expect(result.data).toBeNull();
    expect(result.error).toBe('Connection timeout');
  });

  // ── DELETE ──────────────────────────────────────────────────────────────
  it('delete sends filters and returns result', async () => {
    globalThis.fetch = makeFetchOk({ data: [{ id: '1' }], count: 1 });

    const result = await db.delete('users', { id: '1' });
    expect(result.data).toEqual([{ id: '1' }]);
    expect(result.error).toBeNull();
  });

  it('delete returns error on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Not found'));

    const result = await db.delete('users', { id: '999' });
    expect(result.data).toEqual([]);
    expect(result.error).toBe('Not found');
  });

  // ── HEALTH CHECK ──────────────────────────────────────────────────────
  it('healthCheck returns true when endpoint is ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const healthy = await db.healthCheck();
    expect(healthy).toBe(true);
  });

  it('healthCheck returns false on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    const healthy = await db.healthCheck();
    expect(healthy).toBe(false);
  });

  // ── Authorization header ─────────────────────────────────────────────
  it('includes Bearer token in API call headers', async () => {
    globalThis.fetch = makeFetchOk({ data: [], count: 0 });
    await db.select('users');

    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer mock-jwt-token');
  });
});

// ─── AWSBrowserAuthService ──────────────────────────────────────────────────
describe('AWSBrowserAuthService', () => {
  let auth: AWSBrowserAuthService;

  beforeEach(() => {
    vi.restoreAllMocks();
    auth = new AWSBrowserAuthService(dbConfig);
  });

  it('signIn returns session on success', async () => {
    const session = { accessToken: 'at', refreshToken: 'rt', idToken: 'it' };
    globalThis.fetch = makeFetchOk({ session });

    const result = await auth.signIn('test@example.com', 'pass123');
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('signIn returns error on failure', async () => {
    globalThis.fetch = makeFetchFail(401, 'Unauthorized', 'Invalid credentials');

    const result = await auth.signIn('bad@example.com', 'wrong');
    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
  });

  it('signUp sends email, password and attributes', async () => {
    globalThis.fetch = makeFetchOk({ userId: '123' });

    const result = await auth.signUp('user@example.com', 'Password1!', {
      userAttributes: [{ Name: 'custom:university', Value: 'oxford' }],
    });
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('getCurrentSession returns null when not signed in', async () => {
    const result = await auth.getCurrentSession();
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('signOut clears session', async () => {
    // Sign in first
    const session = { accessToken: 'at', refreshToken: 'rt', idToken: 'it' };
    globalThis.fetch = makeFetchOk({ session });
    await auth.signIn('test@example.com', 'pass123');

    // Then sign out
    globalThis.fetch = makeFetchOk({});
    const result = await auth.signOut();
    expect(result.error).toBeNull();

    const sessionResult = await auth.getCurrentSession();
    expect(sessionResult.data).toBeNull();
  });

  it('onAuthStateChange fires callback on signIn', async () => {
    const callback = vi.fn();
    auth.onAuthStateChange(callback);

    const session = { accessToken: 'at', refreshToken: 'rt', idToken: 'it' };
    globalThis.fetch = makeFetchOk({ session });
    await auth.signIn('test@example.com', 'pass123');

    expect(callback).toHaveBeenCalledWith('SIGNED_IN', expect.any(Object));
  });

  it('onAuthStateChange unsubscribe stops notifications', async () => {
    const callback = vi.fn();
    const sub = auth.onAuthStateChange(callback);
    sub.unsubscribe();

    const session = { accessToken: 'at', refreshToken: 'rt', idToken: 'it' };
    globalThis.fetch = makeFetchOk({ session });
    await auth.signIn('test@example.com', 'pass123');

    expect(callback).not.toHaveBeenCalled();
  });

  it('refreshSession returns error when no refresh token', async () => {
    const result = await auth.refreshSession();
    expect(result.error).toBe('No refresh token available');
  });

  it('uses fallback config when Cognito IDs missing', () => {
    const fallbackAuth = new AWSBrowserAuthService({
      ...dbConfig,
      cognitoUserPoolId: '',
      cognitoClientId: '',
    });
    // Should not throw — should use fallback values
    expect(fallbackAuth).toBeDefined();
  });
});

// ─── AWSBrowserStorageService ───────────────────────────────────────────────
describe('AWSBrowserStorageService', () => {
  it('throws if s3BucketName is missing', () => {
    expect(() => new AWSBrowserStorageService({ ...dbConfig, s3BucketName: '' })).toThrow('AWS S3 requires bucketName');
  });

  it('upload sends FormData and returns url', async () => {
    const storage = new AWSBrowserStorageService(dbConfig);
    globalThis.fetch = makeFetchOk({ data: { url: 'https://s3.example.com/file.jpg', path: 'uploads/file.jpg' } });

    const file = new Blob(['hello'], { type: 'text/plain' });
    const result = await storage.upload('test-bucket', 'uploads/file.txt', file);
    expect(result.url).toBe('https://s3.example.com/file.jpg');
    expect(result.error).toBeNull();
  });

  it('upload returns error message on failure', async () => {
    const storage = new AWSBrowserStorageService(dbConfig);
    globalThis.fetch = makeFetchFail(500, 'Error', 'Upload failed');

    const file = new Blob(['hello'], { type: 'text/plain' });
    const result = await storage.upload('test-bucket', 'uploads/file.txt', file);
    expect(result.error).toBeTruthy();
  });
});
