/**
 * Assessment-related type definitions.
 *
 * Shared across BaselineAssessmentSDK, CheckinAssessmentSDK,
 * and MobileConversation components.
 */

// ----------------------------------------------------------------
// ElevenLabs widget / conversation
// ----------------------------------------------------------------

/** A single message received from the ElevenLabs conversation widget. */
export interface ElevenLabsMessage {
  message: string;
  source: 'ai' | 'user';
}

/** A message entry stored in the conversation transcript. */
export interface ConversationMessage {
  role: 'user' | 'ai' | 'unknown';
  text: string;
  timestamp: number;
}

/** Options passed to ElevenLabs Conversation.startSession. */
export interface ElevenLabsSessionOptions {
  agentId: string;
  dynamicVariables?: Record<string, string>;
}

// ----------------------------------------------------------------
// Media capture
// ----------------------------------------------------------------

/** Result from the media capture service at the end of a session. */
export interface CapturedMediaResult {
  audio?: Blob;
  videoFrames?: Blob[];
  duration?: number;
  startTime?: number;
  endTime?: number;
}

/** Visual data captured by StillImageCapture. */
export interface VisualCaptureData {
  imageAnalysis: Array<{
    timestamp: number;
    emotions?: Array<{ Type: string; Confidence: number }>;
    face_confidence?: number;
    pose?: { Roll?: number; Yaw?: number; Pitch?: number };
    quality?: { Brightness?: number; Sharpness?: number };
  }>;
  features: Array<{
    brightness: number;
    edgeDensity: number;
    facePixelRatio: number;
    qualityScore: number;
  }>;
}

// ----------------------------------------------------------------
// Analysis data (stored in fusion_outputs.analysis JSON)
// ----------------------------------------------------------------

/** Baseline assessment analysis payload. */
export interface BaselineAnalysisData {
  assessment_type: 'baseline';
  elevenlabs_session_id: string | null;
  clinical_scores: {
    phq2_total: number;
    gad2_total: number;
    mood_scale: number | null;
    phq2_positive_screen: boolean;
    gad2_positive_screen: boolean;
  };
  conversation_quality: string;
  mind_measure_composite: {
    score: number;
    phq2_component: number;
    gad2_component: number;
    mood_component: number;
  };
  multimodal_enrichment: {
    enabled: boolean;
    audio_features?: Record<string, unknown> | null;
    visual_features?: Record<string, unknown> | null;
    scoring_breakdown?: Record<string, unknown>;
    processing_time_ms?: number;
    warnings?: string[];
    reason?: string;
  };
}

/** Check-in assessment analysis payload. */
export interface CheckinAnalysisData {
  assessment_type: 'checkin';
  mind_measure_score: number;
  mood_score: number;
  driver_positive: string[];
  driver_negative: string[];
  themes: string[];
  keywords: string[];
  modalities: Record<string, unknown>;
  risk_level: string;
  direction_of_change: string;
  uncertainty: number;
  conversation_summary: string;
  check_in_id: string;
  session_id: string | null;
  elevenlabs_session_id: string | null;
  transcript_length: number;
  duration: number;
  processing_time_ms?: number;
  warnings: string[];
}

// ----------------------------------------------------------------
// Database insert shapes
// ----------------------------------------------------------------

/** Shape for inserting into fusion_outputs. */
export interface FusionInsertData {
  user_id: string;
  score: number;
  final_score: number;
  analysis: string;
  created_at: string;
  university_id?: string;
  session_id?: string;
}

/** Shape for inserting into session_transcripts. */
export interface TranscriptInsertData {
  fusion_output_id: string;
  user_id: string;
  conversation_id: string | null;
  transcript: string;
  message_count: number;
  word_count: number;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------
// User context (passed to ElevenLabs as dynamic variables)
// ----------------------------------------------------------------

export interface AssessmentUserContext {
  user: {
    name: string;
    fullName: string;
    university?: string | null;
    course?: string | null;
    yearOfStudy?: string | null;
  };
  assessmentHistory: Array<{
    assessment_type: string;
    created_at: string;
    meta?: unknown;
  }>;
  wellnessTrends: Array<{
    score: number;
    created_at: string;
  }>;
  isFirstTime: boolean;
  platform: 'mobile';
}

// ----------------------------------------------------------------
// Processing messages shown during score calculation
// ----------------------------------------------------------------

export interface ProcessingMessage {
  message: string;
  duration: number;
}

/** Text data extracted from the conversation for finalization. */
export interface SessionTextData {
  transcripts: string[];
  textInputs: string[];
  fullConversation: string;
  conversationData: ConversationMessage[];
}
