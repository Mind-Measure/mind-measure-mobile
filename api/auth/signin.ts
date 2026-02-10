// API endpoint for AWS Cognito sign in
// Vercel serverless function — authenticates via Cognito, then fetches
// the user's profile and baseline status from Aurora so the client
// can identify returning users immediately.

import { VercelRequest, VercelResponse } from '@vercel/node';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Client } from 'pg';

/** Decode a JWT payload without verifying (server already issued it). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // ── 1. Cognito authentication ──────────────────────────────────
    const region = (process.env.AWS_REGION || 'eu-west-2').trim();
    const clientId = process.env.AWS_COGNITO_CLIENT_ID?.trim();
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

    if (!clientId || !accessKeyId || !secretAccessKey) {
      console.error('❌ Missing required environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new InitiateAuthCommand({
      ClientId: clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });

    const result = await cognitoClient.send(command);

    // Handle Cognito challenges
    if (result.ChallengeName) {
      if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        return res.status(200).json({
          needsNewPassword: true,
          session: result.Session,
          error: null,
        });
      }
      console.error('Cognito returned unexpected challenge:', result.ChallengeName);
      return res.status(200).json({
        challengeName: result.ChallengeName,
        session: result.Session,
        error: `Cognito challenge: ${result.ChallengeName}`,
      });
    }

    const accessToken = result.AuthenticationResult?.AccessToken;
    const idToken = result.AuthenticationResult?.IdToken;
    const refreshToken = result.AuthenticationResult?.RefreshToken;

    if (!accessToken || !idToken || !refreshToken) {
      console.error('❌ Cognito returned success but missing tokens');
      return res.status(500).json({ error: 'Authentication succeeded but tokens missing' });
    }

    // ── 2. Fetch profile + baseline from Aurora (by email) ─────────
    let profile: Record<string, unknown> | null = null;
    let hasCompletedBaseline = false;

    try {
      const pgClient = new Client({
        host: process.env.AWS_AURORA_HOST,
        port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
        database: process.env.AWS_AURORA_DATABASE,
        user: process.env.AWS_AURORA_USERNAME,
        password: process.env.AWS_AURORA_PASSWORD,
        ssl: { rejectUnauthorized: false },
      });

      await pgClient.connect();

      // Fetch profile by email
      const profileResult = await pgClient.query(`SELECT * FROM profiles WHERE email = $1 LIMIT 1`, [
        email.toLowerCase().trim(),
      ]);
      if (profileResult.rows.length > 0) {
        profile = profileResult.rows[0];
      }

      // Check baseline completion by email (via profiles → user_id → fusion_outputs)
      if (profile && (profile as Record<string, unknown>).user_id) {
        const baselineResult = await pgClient.query(`SELECT id FROM fusion_outputs WHERE user_id = $1 LIMIT 1`, [
          (profile as Record<string, unknown>).user_id,
        ]);
        hasCompletedBaseline = baselineResult.rows.length > 0;
      }

      await pgClient.end();

      console.log(`✅ Profile lookup for ${email}: profile=${!!profile}, baseline=${hasCompletedBaseline}`);
    } catch (dbError: any) {
      // Non-fatal: auth still succeeded, app can work without profile
      console.warn('⚠️ Database lookup failed (non-fatal):', dbError.message);
    }

    // ── 4. Return tokens + profile data ────────────────────────────
    res.status(200).json({
      accessToken,
      idToken,
      refreshToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
      tokenType: result.AuthenticationResult?.TokenType,
      profile,
      hasCompletedBaseline,
      error: null,
    });
  } catch (error: any) {
    console.error('Cognito sign in error:', error);

    let errorMessage = 'Sign in failed';
    let needsVerification = false;

    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Incorrect email or password';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Email not verified';
      needsVerification = true;
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'User not found';
    } else if (error.name === 'TooManyRequestsException') {
      errorMessage = 'Too many failed attempts. Please wait a few minutes.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(401).json({ error: errorMessage, needsVerification });
  }
}
