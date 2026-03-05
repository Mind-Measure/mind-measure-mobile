import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

interface CohortTargeting {
  schools?: string[];
  yearOfStudy?: string[];
  studyMode?: string[];
}

interface HubNudge {
  id: string;
  title: string;
  description: string;
  category: 'urgent' | 'social' | 'educational';
  eventDate?: string | null;
  linkUrl: string;
  targeting?: CohortTargeting | null;
  status: string;
}

interface UserProfile {
  school?: string | null;
  year_of_study?: string | null;
  study_mode?: string | null;
}

function matchesTargeting(targeting: CohortTargeting | null | undefined, profile: UserProfile | null): boolean {
  if (!targeting) return true;

  const hasSchools = Array.isArray(targeting.schools) && targeting.schools.length > 0;
  const hasYear = Array.isArray(targeting.yearOfStudy) && targeting.yearOfStudy.length > 0;
  const hasMode = Array.isArray(targeting.studyMode) && targeting.studyMode.length > 0;

  if (!hasSchools && !hasYear && !hasMode) return true;
  if (!profile) return false;

  if (
    hasSchools &&
    (!profile.school || !targeting.schools!.some((s) => s.toLowerCase() === profile.school!.toLowerCase()))
  )
    return false;
  if (
    hasYear &&
    (!profile.year_of_study ||
      !targeting.yearOfStudy!.some((y) => y.toLowerCase() === profile.year_of_study!.toLowerCase()))
  )
    return false;
  if (
    hasMode &&
    (!profile.study_mode || !targeting.studyMode!.some((m) => m.toLowerCase() === profile.study_mode!.toLowerCase()))
  )
    return false;

  return true;
}

const CATEGORY_PRIORITY: Record<string, number> = {
  urgent: 0,
  educational: 1,
  social: 2,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let auroraClient: Client | null = null;

  try {
    const { universityId, userId } = req.query;

    if (!universityId || typeof universityId !== 'string') {
      return res.status(400).json({ error: 'universityId is required' });
    }

    auroraClient = new Client({
      host: process.env.AWS_AURORA_HOST,
      port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
      database: process.env.AWS_AURORA_DATABASE,
      user: process.env.AWS_AURORA_USERNAME,
      password: process.env.AWS_AURORA_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await auroraClient.connect();

    let userProfile: UserProfile | null = null;
    if (userId && typeof userId === 'string') {
      const profileResult = await auroraClient.query(
        'SELECT school, year_of_study, study_mode FROM profiles WHERE user_id = $1',
        [userId]
      );
      if (profileResult.rows.length > 0) {
        userProfile = profileResult.rows[0];
      }
    }

    const result = await auroraClient.query(`SELECT nudges FROM universities WHERE id = $1`, [universityId]);

    if (result.rows.length === 0) {
      return res.status(200).json({ nudges: [] });
    }

    const allNudges: HubNudge[] = result.rows[0].nudges || [];

    const activeNudges = allNudges
      .filter((n) => n.status === 'active')
      .filter((n) => matchesTargeting(n.targeting, userProfile))
      .sort((a, b) => {
        const wA = CATEGORY_PRIORITY[a.category] ?? 2;
        const wB = CATEGORY_PRIORITY[b.category] ?? 2;
        if (wA !== wB) return wA - wB;
        const now = Date.now();
        const dA = a.eventDate ? Math.abs(new Date(a.eventDate).getTime() - now) : Infinity;
        const dB = b.eventDate ? Math.abs(new Date(b.eventDate).getTime() - now) : Infinity;
        return dA - dB;
      })
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      nudges: activeNudges,
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
