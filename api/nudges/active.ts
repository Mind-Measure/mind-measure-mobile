import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

interface Nudge {
  status: string;
  expiryDate?: string;
  isPinned?: boolean;
  priority?: 'high' | 'low' | 'medium';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let auroraClient: Client | null = null;

  try {
    const { universityId } = req.query;

    if (!universityId || typeof universityId !== 'string') {
      return res.status(400).json({ error: 'universityId is required' });
    }

    // Connect to Aurora using same pattern as working endpoints
    auroraClient = new Client({
      host: process.env.AWS_AURORA_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE,
      user: process.env.AWS_AURORA_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await auroraClient.connect();

    // Fetch university nudges
    const result = await auroraClient.query(`SELECT nudges FROM universities WHERE id = $1`, [universityId]);

    if (result.rows.length === 0) {
      return res.status(200).json({ nudges: [] });
    }

    const allNudges = result.rows[0].nudges || [];

    // Filter active, non-expired nudges
    const now = new Date();
    const activeNudges = allNudges.filter((nudge: Nudge) => {
      if (nudge.status !== 'active') return false;
      if (nudge.expiryDate && new Date(nudge.expiryDate) < now) return false;
      return true;
    });

    // Separate pinned and rotation
    const pinned = activeNudges.find((n: Nudge) => n.isPinned) || null;
    const rotation = activeNudges.filter((n: Nudge) => !n.isPinned);

    // Weight rotation by priority
    const weightedRotation = rotation.flatMap((nudge: Nudge) => {
      const weight = nudge.priority === 'high' ? 3 : nudge.priority === 'low' ? 0.5 : 1;
      return Array(Math.ceil(weight)).fill(nudge);
    });

    // Randomly select one from rotation
    const rotated =
      weightedRotation.length > 0 ? weightedRotation[Math.floor(Math.random() * weightedRotation.length)] : null;

    return res.status(200).json({
      success: true,
      pinned,
      rotated,
    });
  } catch (error: unknown) {
    console.error('Error fetching active nudges:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch nudges' });
  } finally {
    if (auroraClient) {
      await auroraClient.end();
    }
  }
}
