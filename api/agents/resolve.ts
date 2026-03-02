import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserIdFromToken } from '../_lib/auth';
import { query } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await getUserIdFromToken(req.headers.authorization);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const universityId = req.query.university_id as string;
  if (!universityId) {
    return res.status(200).json({ agentId: null, fallback: true });
  }

  try {
    const result = await query(
      `SELECT elevenlabs_agent_id, agent_name, institution_type 
       FROM institutional_agents 
       WHERE institution_id = $1 AND status = 'active'`,
      [universityId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ agentId: null, fallback: true });
    }

    const agent = result.rows[0];
    return res.status(200).json({
      agentId: agent.elevenlabs_agent_id,
      agentName: agent.agent_name,
      institutionType: agent.institution_type,
      fallback: false,
    });
  } catch {
    return res.status(200).json({ agentId: null, fallback: true });
  }
}
