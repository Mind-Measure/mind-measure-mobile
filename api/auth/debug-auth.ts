/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// Temporary diagnostic endpoint to identify auth-middleware crash
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};

  try {
    const jwt = require('jsonwebtoken');
    results.jsonwebtoken = `OK (verify is ${typeof jwt.verify})`;
  } catch (e: any) {
    results.jsonwebtoken = `FAIL: ${e.message}`;
  }

  try {
    const jwksClient = require('jwks-rsa');
    results.jwksRsa = `OK (type: ${typeof jwksClient})`;
  } catch (e: any) {
    results.jwksRsa = `FAIL: ${e.message}`;
  }

  try {
    const { Client } = require('pg');
    results.pg = `OK (Client is ${typeof Client})`;
  } catch (e: any) {
    results.pg = `FAIL: ${e.message}`;
  }

  try {
    const authMiddleware = require('../_lib/auth-middleware');
    results.authMiddleware = `OK (keys: ${Object.keys(authMiddleware).join(', ')})`;
  } catch (e: any) {
    results.authMiddleware = `FAIL: ${e.message}`;
  }

  try {
    const dbQuery = require('../_lib/db-query');
    results.dbQuery = `OK (keys: ${Object.keys(dbQuery).join(', ')})`;
  } catch (e: any) {
    results.dbQuery = `FAIL: ${e.message}`;
  }

  results.nodeVersion = process.version;

  res.status(200).json(results);
}
