/**
 * Baseline Enrichment Service
 *
 * Post-processes baseline assessment to add multimodal features
 * and compute hybrid 70/30 score.
 *
 * Flow:
 * 1. Baseline completes with clinical score
 * 2. Processing screen shown
 * 3. This service enriches with audio/visual features
 * 4. Dashboard shows final hybrid score
 *
 * Usage:
 * ```typescript
 * const service = new BaselineEnrichmentService();
 *
 * const enrichedResult = await service.enrichBaseline({
 *   clinicalScore: 82,
 *   audioBlob: capturedAudio,
 *   videoFrames: capturedVideoFrames,
 *   duration: 120,
 *   userId: '...',
 *   fusionOutputId: '...'
 * });
 *
 * // enrichedResult.finalScore is the 70/30 weighted score (whole number)
 * ```
 */

import { BaselineAudioExtractor } from './audioFeatures';
import { BaselineVisualExtractor } from './visualFeatures';
import { BaselineScoring } from './scoring';
import type { CapturedMedia, BaselineAudioFeatures, BaselineVisualFeatures, BaselineScoringBreakdown } from '../types';

export interface EnrichmentInput {
  // Clinical component
  clinicalScore: number; // 0-100 from PHQ-2/GAD-2/mood

  // Media to process
  audioBlob?: Blob;
  videoFrames?: Blob[];
  duration: number; // Seconds

  // Database references
  userId: string;
  fusionOutputId: string;

  // Optional metadata
  startTime?: number;
  endTime?: number;
}

export interface EnrichmentResult {
  // Scores (all whole numbers)
  originalScore: number; // Clinical only
  finalScore: number; // 70% clinical + 30% multimodal (rounded)
  scoringBreakdown: BaselineScoringBreakdown;

  // Features
  audioFeatures: BaselineAudioFeatures | null;
  visualFeatures: BaselineVisualFeatures | null;

  // Metadata
  success: boolean;
  processingTimeMs: number;
  warnings: string[];
}

export class BaselineEnrichmentService {
  private audioExtractor: BaselineAudioExtractor;
  private visualExtractor: BaselineVisualExtractor;

  constructor() {
    this.audioExtractor = new BaselineAudioExtractor();
    this.visualExtractor = new BaselineVisualExtractor();
  }

  /**
   * Enrich baseline assessment with multimodal features
   *
   * This is called during the processing screen, after the baseline
   * conversation completes but before showing the dashboard.
   */
  async enrichBaseline(input: EnrichmentInput): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    let audioFeatures: BaselineAudioFeatures | null = null;
    let visualFeatures: BaselineVisualFeatures | null = null;

    try {
      // Create captured media object
      const capturedMedia: CapturedMedia = {
        audio: input.audioBlob,
        videoFrames: input.videoFrames,
        duration: input.duration,
        startTime: input.startTime || Date.now() - input.duration * 1000,
        endTime: input.endTime || Date.now(),
      };

      // Extract audio features (if available)
      if (input.audioBlob) {
        try {
          audioFeatures = await this.audioExtractor.extract(capturedMedia);
        } catch (error) {
          console.warn('[EnrichmentService] ⚠️ Audio extraction failed:', error);
          warnings.push('Audio feature extraction failed - using clinical score only');
        }
      } else {
        warnings.push('No audio data available');
      }

      // Extract visual features (if available)
      if (input.videoFrames && input.videoFrames.length > 0) {
        try {
          visualFeatures = await this.visualExtractor.extract(capturedMedia);
        } catch (error) {
          console.warn('[EnrichmentService] ⚠️ Visual extraction failed:', error);
          warnings.push('Visual feature extraction failed - using clinical score only');
        }
      } else {
        warnings.push('No video data available');
      }

      // Compute final score with dynamic reweighting

      const audioFailed = !audioFeatures;
      const visualFailed = !visualFeatures;

      const scoringBreakdown = BaselineScoring.computeScore(
        input.clinicalScore,
        audioFeatures,
        visualFeatures,
        audioFailed,
        visualFailed
      );

      // Round to whole number
      scoringBreakdown.finalScore = Math.round(scoringBreakdown.finalScore);

      const processingTimeMs = Date.now() - startTime;

      return {
        originalScore: input.clinicalScore,
        finalScore: scoringBreakdown.finalScore,
        scoringBreakdown,
        audioFeatures,
        visualFeatures,
        success: true,
        processingTimeMs,
        warnings,
      };
    } catch (error) {
      console.error('[EnrichmentService] ❌ Enrichment failed:', error);

      // Fall back to clinical-only score
      const processingTimeMs = Date.now() - startTime;

      return {
        originalScore: input.clinicalScore,
        finalScore: input.clinicalScore,
        scoringBreakdown: {
          clinicalScore: input.clinicalScore,
          clinicalWeight: 1.0,
          audioScore: input.clinicalScore,
          visualScore: input.clinicalScore,
          multimodalScore: input.clinicalScore,
          multimodalWeight: 0,
          finalScore: input.clinicalScore,
          confidence: 0.5, // Low confidence due to failure
        },
        audioFeatures: null,
        visualFeatures: null,
        success: false,
        processingTimeMs,
        warnings: ['Multimodal enrichment failed completely', error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

// Export types
export type { BaselineAudioFeatures, BaselineVisualFeatures, BaselineScoringBreakdown };
