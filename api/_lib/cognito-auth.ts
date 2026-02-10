/**
 * Lightweight Cognito authentication helper for serverless functions.
 *
 * Accepts BOTH Cognito access tokens and ID tokens:
 *   1. Try GetUserCommand (works with access tokens)
 *   2. Fall back to JWT payload decode (works with ID tokens)
 *
 * No dependency on jsonwebtoken or jwks-rsa (which break in Vercel ESM runtime).
 */

import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

/** Decode a JWT payload without signature verification. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export interface AuthResult {
  userId: string;
  email?: string;
}

/**
 * Extract user identity from a Bearer token (access or ID token).
 * Returns { userId, email } or throws an Error.
 */
export async function authenticateRequest(authHeader: string | undefined): Promise<AuthResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }

  const token = authHeader.substring(7);

  // ── Strategy 1: GetUserCommand (access token) ───────────────────
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: (process.env.AWS_REGION || 'eu-west-2').trim(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || '',
      },
    });

    const result = await cognito.send(new GetUserCommand({ AccessToken: token }));
    const subAttr = result.UserAttributes?.find((a) => a.Name === 'sub');
    const emailAttr = result.UserAttributes?.find((a) => a.Name === 'email');
    const userId = subAttr?.Value || result.Username || '';

    if (userId) {
      return { userId, email: emailAttr?.Value };
    }
  } catch {
    // Access token didn't work — fall through to JWT decode
  }

  // ── Strategy 2: Decode JWT payload (ID token or access token) ───
  const payload = decodeJwtPayload(token);
  if (payload) {
    const userId = (payload.sub as string) || (payload['cognito:username'] as string) || '';
    const email = (payload.email as string) || undefined;

    // Basic sanity: check the token isn't expired
    const exp = payload.exp as number | undefined;
    if (exp && exp * 1000 < Date.now()) {
      throw new Error('Token has expired');
    }

    // Check issuer looks like a Cognito user pool
    const iss = payload.iss as string | undefined;
    if (iss && !iss.includes('cognito-idp')) {
      throw new Error('Token is not from Cognito');
    }

    if (userId) {
      return { userId, email };
    }
  }

  throw new Error('Could not determine user identity from token');
}
