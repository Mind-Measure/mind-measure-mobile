/**
 * Secure User Profile API
 * Returns profile data for authenticated user ONLY
 * Uses Cognito GetUser for authentication (no jsonwebtoken/jwks-rsa dependency)
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../_lib/cognito-auth';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Inline CORS
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Authenticate (accepts access token OR ID token) ─────────
  let userId: string;
  try {
    const auth = await authenticateRequest(req.headers.authorization);
    userId = auth.userId;
  } catch (authError: unknown) {
    const errMsg = authError instanceof Error ? authError.message : String(authError);
    console.error('❌ Auth failed in profile:', errMsg);
    return res.status(401).json({ error: errMsg });
  }

  const client = new Client({
    host: process.env.AWS_AURORA_HOST,
    port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE,
    user: process.env.AWS_AURORA_USERNAME,
    password: process.env.AWS_AURORA_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Query profile for THIS user ONLY (row-level security)
    const result = await client.query(
      `SELECT 
        user_id,
        first_name,
        last_name,
        course,
        year_of_study,
        accommodation_type,
        university_id,
        created_at,
        updated_at
      FROM profiles
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Profile not found',
        userId,
      });
    }

    res.status(200).json({
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error(`[API] Profile fetch error for user ${userId}:`, error.message);
    res.status(500).json({
      error: 'Internal server error',
      code: 'PROFILE_FETCH_ERROR',
    });
  } finally {
    await client.end();
  }
}
