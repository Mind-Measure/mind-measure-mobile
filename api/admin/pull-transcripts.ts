// @ts-nocheck
/**
 * GET /api/admin/pull-transcripts
 *
 * Pulls the last N check-in transcripts for quality review.
 * Protected by admin secret header (not user JWT).
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const adminSecret = req.headers['x-admin-secret'] as string;
  const expectedSecret = process.env.ADMIN_PULL_SECRET || process.env.AWS_AURORA_PASSWORD;
  if (!adminSecret || adminSecret !== expectedSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);

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

    const result = await client.query(
      `SELECT
         t.fusion_output_id,
         t.transcript,
         t.message_count,
         t.word_count,
         t.duration_seconds,
         t.created_at,
         f.final_score,
         f.analysis
       FROM assessment_transcripts t
       LEFT JOIN fusion_outputs f ON f.id = t.fusion_output_id
       WHERE t.transcript IS NOT NULL
         AND t.transcript != ''
         AND length(t.transcript) > 50
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    );

    await client.end();

    const transcripts = result.rows.map((row, i) => {
      let themes: string[] = [];
      let moodScore: number | null = null;
      let summary = '';

      if (row.analysis) {
        const analysis = typeof row.analysis === 'string' ? JSON.parse(row.analysis) : row.analysis;
        themes = analysis.themes || [];
        moodScore = analysis.mood_score || analysis.text_analysis?.mood_score || null;
        summary = analysis.conversation_summary || analysis.text_analysis?.conversation_summary || '';
      }

      return {
        index: i + 1,
        date: row.created_at,
        finalScore: row.final_score,
        moodScore,
        messageCount: row.message_count,
        wordCount: row.word_count,
        durationSeconds: row.duration_seconds,
        themes,
        summary,
        transcript: row.transcript,
      };
    });

    return res.status(200).json({
      count: transcripts.length,
      transcripts,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[pull-transcripts] Error:', msg);
    return res.status(500).json({ error: 'Database query failed', message: msg });
  }
}
