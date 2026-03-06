/**
 * Migration: Add open-access profile columns
 *
 * POST /api/database/add-profile-open-access-columns
 *
 * Adds occupation and referral_source columns to the profiles table
 * for non-university (open-access) users.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

function getDbConfig() {
  return {
    host: process.env.AWS_AURORA_HOST,
    port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE || 'mindmeasure',
    user: process.env.AWS_AURORA_USERNAME || 'mindmeasure_admin',
    password: process.env.AWS_AURORA_PASSWORD || '',
    ssl: { rejectUnauthorized: false },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const client = new Client(getDbConfig());

  try {
    await client.connect();

    await client.query(`
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS occupation TEXT DEFAULT NULL;
    `);

    await client.query(`
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS referral_source TEXT DEFAULT NULL;
    `);

    res.status(200).json({
      success: true,
      message: 'Added occupation and referral_source columns to profiles table.',
    });
  } catch (error: unknown) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  } finally {
    await client.end();
  }
}
