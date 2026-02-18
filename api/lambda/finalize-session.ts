// @ts-nocheck
/**
 * Proxy endpoint for finalize-session Lambda function
 *
 * SECURITY: Forwards Authorization header to Lambda for validation.
 * No _lib/ imports — all code inlined to avoid Vercel bundling issues.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

const LAMBDA_BASE_URL = process.env.LAMBDA_BASE_URL || process.env.VITE_LAMBDA_BASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Inline CORS ─────────────────────────────────────────────────
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!LAMBDA_BASE_URL) {
    return res.status(500).json({ error: 'Server configuration error: LAMBDA_BASE_URL not set' });
  }

  try {
    const rawAuth = req.headers.authorization || req.headers.Authorization;
    const authHeader: string | undefined = Array.isArray(rawAuth)
      ? rawAuth[0]
      : typeof rawAuth === 'string'
        ? rawAuth
        : undefined;

    // Extract sessionId from request body
    const sessionId = req.body?.sessionId || req.body?.body?.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Require Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Forward request to Lambda via API Gateway
    const lambdaResponse = await fetch(`${LAMBDA_BASE_URL}/finalize-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ sessionId }),
    });

    const responseText = await lambdaResponse.text();
    let responseData: Record<string, unknown>;

    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { raw: responseText };
    }

    if (!lambdaResponse.ok) {
      const errorType =
        lambdaResponse.headers.get('x-amzn-ErrorType') || lambdaResponse.headers.get('x-amzn-errortype') || 'unknown';
      console.error('[Lambda Proxy] Error:', lambdaResponse.status, errorType, responseData);
      return res.status(lambdaResponse.status).json({
        error: 'Lambda function failed',
        details: responseData,
      });
    }

    return res.status(200).json(responseData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Lambda Proxy] Error calling Lambda:', message);
    return res.status(500).json({ error: 'Internal server error', message });
  }
}
