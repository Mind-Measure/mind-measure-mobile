/**
 * Database entity type definitions.
 *
 * Covers the core domain objects stored in Aurora PostgreSQL:
 * fusion_outputs (assessment sessions), profiles, universities, etc.
 */

// ----------------------------------------------------------------
// Fusion Output (assessment session result)
// ----------------------------------------------------------------

/**
 * A row from the `fusion_outputs` table.
 * This is the primary record for every baseline and check-in.
 */
export interface FusionOutput {
  id: string;
  user_id: string;
  session_id?: string;
  score?: number;
  final_score?: number;
  analysis?: string | FusionOutputAnalysis;
  status?: string;
  created_at: string;
  updated_at?: string;
  university_id?: string;
}

/**
 * Parsed JSON from the `analysis` column of `fusion_outputs`.
 * Shape varies slightly between baseline and check-in.
 */
export interface FusionOutputAnalysis {
  assessment_type: 'baseline' | 'checkin';
  mind_measure_score?: number;
  mind_measure_composite?: number;
  mood_score?: number;
  conversation_summary?: string;
  themes?: string[];
  drivers_positive?: string[];
  drivers_negative?: string[];
  /** Legacy field names (older records) */
  driver_positive?: string[];
  driver_negative?: string[];
  clinical_scores?: Record<string, number>;
  conversation_quality?: Record<string, unknown>;
  multimodal_enrichment?: MultimodalEnrichmentData;
  elevenlabs_session_id?: string;
}

export interface MultimodalEnrichmentData {
  audio_features?: Record<string, number>;
  visual_features?: Record<string, number>;
  text_features?: Record<string, unknown>;
  fusion_score?: number;
  confidence?: number;
}

// ----------------------------------------------------------------
// Profile
// ----------------------------------------------------------------

export interface UserProfile {
  id?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  baseline_established: boolean;
  streak_count?: number;
  university_id?: string;
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------
// Assessment Session (in-progress)
// ----------------------------------------------------------------

export interface AssessmentSession {
  id: string;
  user_id: string;
  assessment_type: 'baseline' | 'checkin';
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  started_at: string;
  ended_at?: string;
  university_id?: string;
}

// ----------------------------------------------------------------
// Helper: parse the analysis column safely
// ----------------------------------------------------------------

export function parseAnalysis(raw: string | FusionOutputAnalysis | null | undefined): FusionOutputAnalysis {
  if (!raw) return { assessment_type: 'checkin' };
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw) as FusionOutputAnalysis;
  } catch {
    return { assessment_type: 'checkin' };
  }
}
