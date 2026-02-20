import type { BaselineAudioFeatures, BaselineVisualFeatures, BaselineScoringBreakdown } from '../types';

export class BaselineScoring {
  static computeScore(
    clinicalScore: number,
    audioFeatures: BaselineAudioFeatures | null,
    visualFeatures: BaselineVisualFeatures | null,
    audioFailed: boolean = false,
    visualFailed: boolean = false
  ): BaselineScoringBreakdown {
    // Determine which modalities are available
    const hasAudio = !audioFailed && audioFeatures !== null;
    const hasVisual = !visualFailed && visualFeatures !== null;

    // Case 1: Both modalities failed → 100% clinical
    if (!hasAudio && !hasVisual) {
      console.warn('[BaselineScoring] ⚠️ Both modalities failed - using 100% clinical');
      return {
        clinicalScore: Math.round(clinicalScore),
        clinicalWeight: 1.0,
        audioScore: null,
        visualScore: null,
        multimodalScore: null,
        multimodalWeight: 0,
        finalScore: Math.round(clinicalScore),
        confidence: 0.5,
      };
    }

    // Extract scores for available modalities
    let audioScore: number | null = null;
    let visualScore: number | null = null;

    if (hasAudio) {
      audioScore = this.normalizeAudioFeatures(audioFeatures!);

      if (isNaN(audioScore)) {
        console.warn('[BaselineScoring] ⚠️ Audio score is NaN, treating as failed');
        audioScore = null;
      }
    }

    if (hasVisual) {
      visualScore = this.normalizeVisualFeatures(visualFeatures!);

      if (isNaN(visualScore)) {
        console.warn('[BaselineScoring] ⚠️ Visual score is NaN, treating as failed');
        visualScore = null;
      }
    }

    // Case 2: Only audio works → 85% clinical + 15% audio
    if (audioScore !== null && visualScore === null) {
      const finalScore = clinicalScore * 0.85 + audioScore * 0.15;

      return {
        clinicalScore: Math.round(clinicalScore),
        clinicalWeight: 0.85,
        audioScore: Math.round(audioScore),
        visualScore: null,
        multimodalScore: Math.round(audioScore), // Audio is the multimodal score
        multimodalWeight: 0.15,
        finalScore: Math.round(finalScore),
        confidence: this.computeConfidence(audioFeatures!, null, clinicalScore),
      };
    }

    // Case 3: Only visual works → 85% clinical + 15% visual
    if (visualScore !== null && audioScore === null) {
      const finalScore = clinicalScore * 0.85 + visualScore * 0.15;

      return {
        clinicalScore: Math.round(clinicalScore),
        clinicalWeight: 0.85,
        audioScore: null,
        visualScore: Math.round(visualScore),
        multimodalScore: Math.round(visualScore), // Visual is the multimodal score
        multimodalWeight: 0.15,
        finalScore: Math.round(finalScore),
        confidence: this.computeConfidence(null, visualFeatures!, clinicalScore),
      };
    }

    // Case 4: Both work → 70% clinical + 15% audio + 15% visual
    const multimodalScore = (audioScore! + visualScore!) / 2;
    const finalScore = clinicalScore * 0.7 + audioScore! * 0.15 + visualScore! * 0.15;

    // Validate final score
    if (isNaN(finalScore) || !isFinite(finalScore)) {
      console.error('[BaselineScoring] ❌ Invalid final score - falling back to clinical only');
      return {
        clinicalScore: Math.round(clinicalScore),
        clinicalWeight: 1.0,
        audioScore: Math.round(audioScore!),
        visualScore: Math.round(visualScore!),
        multimodalScore: Math.round(multimodalScore),
        multimodalWeight: 0,
        finalScore: Math.round(clinicalScore),
        confidence: 0.5,
      };
    }

    // Assess overall confidence
    const confidence = this.computeConfidence(audioFeatures!, visualFeatures!, clinicalScore);

    return {
      clinicalScore: Math.round(clinicalScore),
      clinicalWeight: 0.7,
      audioScore: Math.round(audioScore!),
      visualScore: Math.round(visualScore!),
      multimodalScore: Math.round(multimodalScore),
      multimodalWeight: 0.3,
      finalScore: Math.round(finalScore),
      confidence,
    };
  }

  private static normalizeAudioFeatures(features: BaselineAudioFeatures): number {
    const scores: number[] = [];

    if (features.meanPitch != null && !isNaN(features.meanPitch)) {
      scores.push(this.clamp(100 - Math.abs(features.meanPitch - 165) / 2, 0, 100));
    }
    if (features.pitchVariability != null && !isNaN(features.pitchVariability)) {
      scores.push(this.clamp(100 - features.pitchVariability * 2, 0, 100));
    }
    if (features.speakingRate != null && !isNaN(features.speakingRate)) {
      scores.push(this.clamp(100 - Math.abs(features.speakingRate - 150) / 2, 0, 100));
    }
    if (features.pauseFrequency != null && !isNaN(features.pauseFrequency)) {
      scores.push(this.clamp(100 - Math.abs(features.pauseFrequency - 5) * 10, 0, 100));
    }
    if (features.pauseDuration != null && !isNaN(features.pauseDuration)) {
      scores.push(this.clamp(100 - Math.abs(features.pauseDuration - 0.5) * 100, 0, 100));
    }
    if (features.voiceEnergy != null && !isNaN(features.voiceEnergy)) {
      scores.push(this.clamp(features.voiceEnergy * 100, 0, 100));
    }
    if (features.jitter != null && !isNaN(features.jitter)) {
      scores.push(this.clamp((1 - features.jitter) * 100, 0, 100));
    }
    if (features.shimmer != null && !isNaN(features.shimmer)) {
      scores.push(this.clamp((1 - features.shimmer) * 100, 0, 100));
    }
    if (features.harmonicRatio != null && !isNaN(features.harmonicRatio)) {
      scores.push(this.clamp(features.harmonicRatio * 100, 0, 100));
    }

    if (scores.length === 0) return 50;

    return (scores.reduce((sum, s) => sum + s, 0) / scores.length) * (features.quality || 0.5);
  }

  private static normalizeVisualFeatures(features: BaselineVisualFeatures): number {
    const scores: number[] = [];

    scores.push(features.smileFrequency * 100);
    scores.push(features.smileIntensity * 100);
    scores.push(features.eyeContact * 100);
    scores.push(this.clamp(100 - Math.abs(features.eyebrowPosition - 0.4) * 100, 0, 100));
    scores.push((1 - features.facialTension) * 100);
    scores.push(this.clamp(100 - Math.abs(features.blinkRate - 17) * 3, 0, 100));
    scores.push(this.clamp(100 - Math.abs(features.headMovement - 0.5) * 100, 0, 100));
    scores.push(this.clamp((features.affect + 1) * 50, 0, 100));

    return (scores.reduce((sum, s) => sum + s, 0) / scores.length) * features.overallQuality;
  }
  private static computeConfidence(
    audioFeatures: BaselineAudioFeatures | null,
    visualFeatures: BaselineVisualFeatures | null,
    clinicalScore: number
  ): number {
    let confidence = 1.0;

    // Factor in audio quality (if available)
    if (audioFeatures) {
      confidence *= audioFeatures.quality || 0.5;
    }

    // Factor in visual quality (if available)
    if (visualFeatures) {
      confidence *= visualFeatures.overallQuality || 0.5;
      confidence *= visualFeatures.facePresenceQuality || 0.5;
    }

    // Penalize if clinical score is extreme (might indicate inaccurate responses)
    if (clinicalScore < 20 || clinicalScore > 95) {
      confidence *= 0.9;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Clamp value to range
   */
  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
