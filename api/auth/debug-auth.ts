// Temporary diagnostic endpoint to identify auth-middleware crash
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};

  // Test 1: Dynamic import jsonwebtoken
  try {
    const jwt = await import('jsonwebtoken');
    results.jsonwebtoken = `OK (default: ${typeof jwt.default}, verify: ${typeof jwt.default?.verify})`;
  } catch (e: unknown) {
    results.jsonwebtoken = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test 2: Dynamic import jwks-rsa
  try {
    const jwks = await import('jwks-rsa');
    results.jwksRsa = `OK (default: ${typeof jwks.default})`;
  } catch (e: unknown) {
    results.jwksRsa = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test 3: Dynamic import pg
  try {
    const pg = await import('pg');
    results.pg = `OK (Client: ${typeof pg.Client})`;
  } catch (e: unknown) {
    results.pg = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test 4: Static import of auth-middleware (same as other endpoints)
  try {
    const authMiddleware = await import('../_lib/auth-middleware');
    results.authMiddleware = `OK (keys: ${Object.keys(authMiddleware).join(', ')})`;
  } catch (e: unknown) {
    results.authMiddleware = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test 5: Check createRequire availability
  try {
    const mod = await import('module');
    results.createRequire = `${typeof mod.createRequire}`;
  } catch (e: unknown) {
    results.createRequire = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  results.nodeVersion = process.version;
  results.requireDefined = typeof require === 'undefined' ? 'NO' : 'YES';

  res.status(200).json(results);
}
