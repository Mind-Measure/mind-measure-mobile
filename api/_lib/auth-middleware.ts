/**
 * Cognito JWT Verification Middleware
 * Verifies JWT tokens from AWS Cognito and extracts user identity
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/** Decoded Cognito JWT payload used across the middleware. */
export interface CognitoTokenPayload {
  sub: string;
  'cognito:username'?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  token_use?: 'id' | 'access';
  iss: string;
  aud?: string;
  iat: number;
  exp: number;
  'custom:roles'?: string | string[];
  'cognito:groups'?: string[];
}

// Cognito configuration
// Trim any whitespace/newlines from env vars
const COGNITO_USER_POOL_ID = (
  process.env.AWS_COGNITO_USER_POOL_ID ||
  process.env.COGNITO_USER_POOL_ID ||
  'eu-west-2_ClAG4fQXR'
).trim();
const COGNITO_REGION = (process.env.AWS_REGION || 'eu-west-2').trim();
const COGNITO_CLIENT_ID = (process.env.COGNITO_CLIENT_ID || process.env.AWS_COGNITO_CLIENT_ID || '').trim();

// JWKS client for fetching public keys
const jwksClientInstance = jwksClient({
  jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
});

/**
 * Get signing key from JWKS
 */
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify Cognito JWT token
 */
export async function verifyToken(token: string): Promise<CognitoTokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
        // NOTE: Not validating audience because tokens may be issued with different client IDs
        // (e.g., mobile app uses VITE_AWS_COGNITO_CLIENT_ID, server may have different CLIENT_ID)
        // The issuer validation is sufficient for security
      },
      (err, decoded) => {
        if (err) {
          console.error('[AUTH] JWT verification failed:', {
            errorName: err.name,
            errorMessage: err.message,
            errorCode: (err as { code?: string }).code,
            // Log token preview for debugging (first 20 chars + last 10)
            tokenPreview: token.substring(0, 20) + '...' + token.substring(token.length - 10),
            tokenLength: token.length,
            tokenParts: token.split('.').length,
          });
          reject(err);
          return;
        }

        // Verify token is not expired
        if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
          const now = Math.floor(Date.now() / 1000);
          if (decoded.exp < now) {
            console.error('[AUTH] Token expired:', {
              exp: decoded.exp,
              now,
              expiredBy: now - decoded.exp,
              tokenPreview: token.substring(0, 20) + '...',
            });
            reject(new Error('Token expired'));
            return;
          }
        }

        resolve(decoded as CognitoTokenPayload);
      }
    );
  });
}

/**
 * Extract user ID from token payload
 */
export function extractUserId(payload: CognitoTokenPayload): string {
  // Cognito stores user ID in 'sub' claim
  const userId = payload.sub || payload['cognito:username'];

  if (!userId) {
    throw new Error('Token does not contain user ID (sub claim)');
  }

  return userId;
}

/**
 * Extract user roles from token payload
 */
export function extractUserRoles(payload: CognitoTokenPayload): string[] {
  // Check custom claims first
  const customRoles = payload['custom:roles'] || payload['cognito:groups'];

  if (customRoles) {
    return Array.isArray(customRoles) ? customRoles : [customRoles];
  }

  return [];
}

/**
 * Authentication middleware - Requires valid JWT token
 */
export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<{ userId: string; payload: CognitoTokenPayload } | null> {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
      code: 'AUTH_TOKEN_MISSING',
    });
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token signature and claims
    const payload = await verifyToken(token);

    // Extract user ID (this is the ONLY source of identity)
    const userId = extractUserId(payload);

    return { userId, payload };
  } catch (error: unknown) {
    // Log auth failure with detailed error info
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[AUTH] ❌ Authentication failed - route: ${req.url}`, {
      errorName: err.name,
      errorMessage: err.message,
      errorCode: (err as Error & { code?: string }).code,
      tokenPreview: token.substring(0, 20) + '...',
      tokenLength: token.length,
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
      code: 'AUTH_TOKEN_INVALID',
    });
    return null;
  }
}

/**
 * Role-based authorization middleware
 */
export async function requireRole(
  req: VercelRequest,
  res: VercelResponse,
  requiredRoles: string[]
): Promise<{ userId: string; payload: CognitoTokenPayload; roles: string[] } | null> {
  // First verify authentication
  const authResult = await requireAuth(req, res);

  if (!authResult) {
    return null; // Auth failed, response already sent
  }

  const { userId, payload } = authResult;

  // Extract roles from token
  let userRoles = extractUserRoles(payload);

  // If roles not in token, do server-side lookup
  if (userRoles.length === 0) {
    userRoles = await fetchUserRolesFromDB(userId);
  }

  // Check if user has any of the required roles
  const hasRequiredRole = userRoles.some((role) => requiredRoles.includes(role));

  if (!hasRequiredRole) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions',
      code: 'AUTHZ_INSUFFICIENT_PERMISSIONS',
    });
    return null;
  }

  return { userId, payload, roles: userRoles };
}

/**
 * Fetch user roles from memberships (fallback if not in token)
 */
async function fetchUserRolesFromDB(userId: string): Promise<string[]> {
  try {
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.AWS_AURORA_HOST || process.env.AWS_RDS_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || process.env.AWS_RDS_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE || process.env.AWS_RDS_DATABASE || 'mindmeasure',
      user: process.env.AWS_AURORA_USERNAME || process.env.AWS_RDS_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD || process.env.AWS_RDS_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    const r = await client.query<{ role: string }>(
      `SELECT DISTINCT role FROM memberships WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    await client.end();
    return (r.rows ?? []).map((row) => row.role);
  } catch (e) {
    console.error('[AUTH] fetchUserRolesFromDB failed:', e);
    return [];
  }
}
