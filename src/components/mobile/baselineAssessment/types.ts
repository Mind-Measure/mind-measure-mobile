/**
 * Shared types for the BaselineAssessment feature.
 */

export interface BaselineAssessmentSDKProps {
  onBack?: () => void;
  onComplete?: () => void;
}

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  options?: string[];
}

export type ProcessingPhase = 'extracting' | 'calculating' | 'saving';

/** Clinical-focused processing messages shown during the 9-second save cycle. */
export const PROCESSING_MESSAGES = [
  'Assessing PHQ-2 responses',
  'Evaluating GAD-7 indicators',
  'Analysing vocal pitch patterns',
  'Processing facial expressions',
  'Computing baseline wellbeing score',
  'Finalising your baseline profile',
] as const;
