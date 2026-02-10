// TEMPORARY diagnostic endpoint – checks if a user profile exists in Aurora
// DELETE THIS after confirming the database is intact

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const email = (req.query.email as string) || '';

  if (!email) {
    return res.status(400).json({ error: 'Provide ?email=...' });
  }

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

    // 1. Check profiles table
    const profileResult = await pgClient.query(
      `SELECT user_id, email, first_name, last_name, university_id, created_at FROM profiles WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const profile = profileResult.rows[0] || null;

    // 2. Check fusion_outputs (baseline)
    let fusionCount = 0;
    if (profile?.user_id) {
      const fusionResult = await pgClient.query(`SELECT COUNT(*) as cnt FROM fusion_outputs WHERE user_id = $1`, [
        profile.user_id,
      ]);
      fusionCount = parseInt(fusionResult.rows[0]?.cnt || '0');
    }

    // 3. Check assessment_sessions
    let sessionCount = 0;
    if (profile?.user_id) {
      const sessionResult = await pgClient.query(`SELECT COUNT(*) as cnt FROM assessment_sessions WHERE user_id = $1`, [
        profile.user_id,
      ]);
      sessionCount = parseInt(sessionResult.rows[0]?.cnt || '0');
    }

    await pgClient.end();

    return res.status(200).json({
      email: email.toLowerCase().trim(),
      profileFound: !!profile,
      profile: profile
        ? {
            user_id: profile.user_id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            university_id: profile.university_id,
            created_at: profile.created_at,
          }
        : null,
      fusionOutputs: fusionCount,
      assessmentSessions: sessionCount,
      hasCompletedBaseline: fusionCount > 0,
      dbHost: process.env.AWS_AURORA_HOST ? '✅ configured' : '❌ missing',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      dbHost: process.env.AWS_AURORA_HOST ? '✅ configured' : '❌ missing',
    });
  }
}
