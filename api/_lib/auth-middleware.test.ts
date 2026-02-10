import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set environment variables BEFORE module evaluation (vi.hoisted runs first)
vi.hoisted(() => {
  process.env.AWS_COGNITO_USER_POOL_ID = 'eu-west-2_TestPool';
  process.env.AWS_REGION = 'eu-west-2';
  process.env.COGNITO_CLIENT_ID = 'test-client-id';
});

// Mock jsonwebtoken before importing the module under test
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
  verify: vi.fn(),
}));

vi.mock('jwks-rsa', () => ({
  default: vi.fn(() => ({
    getSigningKey: vi.fn((_kid: string, cb: (err: Error | null, key?: { getPublicKey: () => string }) => void) => {
      cb(null, { getPublicKey: () => 'mock-signing-key' });
    }),
  })),
}));

import { extractUserId, extractUserRoles, requireAuth, type CognitoTokenPayload } from './auth-middleware';
import jwt from 'jsonwebtoken';

// ────────────────────────────────────────────────────────
// extractUserId
// ────────────────────────────────────────────────────────

describe('extractUserId', () => {
  it('returns the sub claim when present', () => {
    const payload: CognitoTokenPayload = {
      sub: 'user-123',
      iss: 'https://cognito-idp.eu-west-2.amazonaws.com/pool',
      iat: 1700000000,
      exp: 1700003600,
    };
    expect(extractUserId(payload)).toBe('user-123');
  });

  it('falls back to cognito:username when sub is empty', () => {
    const payload: CognitoTokenPayload = {
      sub: '',
      'cognito:username': 'cognito-user-456',
      iss: 'https://cognito-idp.eu-west-2.amazonaws.com/pool',
      iat: 1700000000,
      exp: 1700003600,
    };
    expect(extractUserId(payload)).toBe('cognito-user-456');
  });

  it('throws when neither sub nor cognito:username is present', () => {
    const payload = {
      sub: '',
      iss: 'https://cognito-idp.eu-west-2.amazonaws.com/pool',
      iat: 1700000000,
      exp: 1700003600,
    } as CognitoTokenPayload;
    expect(() => extractUserId(payload)).toThrow('Token does not contain user ID');
  });

  it('prefers sub over cognito:username', () => {
    const payload: CognitoTokenPayload = {
      sub: 'sub-primary',
      'cognito:username': 'cognito-secondary',
      iss: 'https://cognito-idp.eu-west-2.amazonaws.com/pool',
      iat: 1700000000,
      exp: 1700003600,
    };
    expect(extractUserId(payload)).toBe('sub-primary');
  });
});

// ────────────────────────────────────────────────────────
// extractUserRoles
// ────────────────────────────────────────────────────────

describe('extractUserRoles', () => {
  it('returns empty array when no roles or groups exist', () => {
    const payload: CognitoTokenPayload = {
      sub: 'user-1',
      iss: 'issuer',
      iat: 0,
      exp: 0,
    };
    expect(extractUserRoles(payload)).toEqual([]);
  });

  it('returns custom:roles as an array when it is a string', () => {
    const payload: CognitoTokenPayload = {
      sub: 'user-1',
      iss: 'issuer',
      iat: 0,
      exp: 0,
      'custom:roles': 'admin',
    };
    expect(extractUserRoles(payload)).toEqual(['admin']);
  });

  it('returns custom:roles directly when it is already an array', () => {
    const payload: CognitoTokenPayload = {
      sub: 'user-1',
      iss: 'issuer',
      iat: 0,
      exp: 0,
      'custom:roles': ['admin', 'university_lead'],
    };
    expect(extractUserRoles(payload)).toEqual(['admin', 'university_lead']);
  });

  it('falls back to cognito:groups when custom:roles is absent', () => {
    const payload: CognitoTokenPayload = {
      sub: 'user-1',
      iss: 'issuer',
      iat: 0,
      exp: 0,
      'cognito:groups': ['students', 'staff'],
    };
    expect(extractUserRoles(payload)).toEqual(['students', 'staff']);
  });

  it('prefers custom:roles over cognito:groups', () => {
    const payload: CognitoTokenPayload = {
      sub: 'user-1',
      iss: 'issuer',
      iat: 0,
      exp: 0,
      'custom:roles': 'admin',
      'cognito:groups': ['students'],
    };
    expect(extractUserRoles(payload)).toEqual(['admin']);
  });
});

// ────────────────────────────────────────────────────────
// requireAuth
// ────────────────────────────────────────────────────────

describe('requireAuth', () => {
  let mockRes: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('returns 401 when no authorization header is provided', async () => {
    const req = { headers: {} } as unknown as Parameters<typeof requireAuth>[0];
    const result = await requireAuth(req, mockRes as unknown as Parameters<typeof requireAuth>[1]);

    expect(result).toBeNull();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_TOKEN_MISSING' }));
  });

  it('returns 401 when authorization header does not start with "Bearer "', async () => {
    const req = {
      headers: { authorization: 'Basic abc123' },
    } as unknown as Parameters<typeof requireAuth>[0];
    const result = await requireAuth(req, mockRes as unknown as Parameters<typeof requireAuth>[1]);

    expect(result).toBeNull();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('returns userId and payload for a valid Cognito token', async () => {
    const payload: CognitoTokenPayload = {
      sub: 'valid-user-id',
      iss: 'https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_TestPool',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    vi.mocked(jwt.verify).mockImplementation((_token: string, _key: unknown, _options: unknown, callback?: unknown) => {
      if (typeof callback === 'function') {
        (callback as (err: null, decoded: CognitoTokenPayload) => void)(null, payload);
      }
      return undefined as unknown as ReturnType<typeof jwt.verify>;
    });

    const req = {
      headers: { authorization: 'Bearer valid-token-here' },
      url: '/api/test',
    } as unknown as Parameters<typeof requireAuth>[0];

    const result = await requireAuth(req, mockRes as unknown as Parameters<typeof requireAuth>[1]);

    expect(result).not.toBeNull();
    expect(result?.userId).toBe('valid-user-id');
    expect(result?.payload.sub).toBe('valid-user-id');
  });

  it('returns 401 when token verification fails', async () => {
    vi.mocked(jwt.verify).mockImplementation((_token: string, _key: unknown, _options: unknown, callback?: unknown) => {
      if (typeof callback === 'function') {
        (callback as (err: Error) => void)(new Error('Invalid token'));
      }
      return undefined as unknown as ReturnType<typeof jwt.verify>;
    });

    const req = {
      headers: { authorization: 'Bearer bad-token' },
      url: '/api/test',
    } as unknown as Parameters<typeof requireAuth>[0];

    const result = await requireAuth(req, mockRes as unknown as Parameters<typeof requireAuth>[1]);

    expect(result).toBeNull();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_TOKEN_INVALID' }));
  });
});
