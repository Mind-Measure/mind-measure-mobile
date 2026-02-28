/**
 * JWT verification using aws-jwt-verify for Cognito tokens.
 *
 * Verifies the token signature against the JWKS endpoint,
 * checks expiry, issuer, and token_use claims.
 */

import { CognitoJwtVerifier } from 'aws-jwt-verify';

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID || '';

const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'access',
});

/**
 * Extract and cryptographically verify the user ID from a Bearer token.
 * Accepts both ID tokens and access tokens from Cognito.
 */
export async function getUserIdFromToken(authHeader: string | undefined): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }
  const token = authHeader.substring(7);

  // Try ID token first (contains sub and cognito:username), fall back to access token
  try {
    const payload = await idTokenVerifier.verify(token);
    const userId = payload.sub || (payload['cognito:username'] as string) || '';
    if (!userId) throw new Error('Could not determine user identity');
    return userId;
  } catch {
    // Fall through to access token
  }

  try {
    const payload = await accessTokenVerifier.verify(token);
    const userId = payload.sub || payload.username || '';
    if (!userId) throw new Error('Could not determine user identity');
    return userId;
  } catch {
    throw new Error('Invalid or expired token');
  }
}
