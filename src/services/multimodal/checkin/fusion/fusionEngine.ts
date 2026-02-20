import type {
  CheckinAudioFeatures,
  CheckinVisualFeatures,
  CheckinTextAnalysis,
  CheckinFusionResult,
  UserBaseline,
} from '../types';
import { CheckinMultimodalError } from '../types';

interface FusionInput {
  audioFeatures: CheckinAudioFeatures | null;
  visualFeatures: CheckinVisualFeatures | null;
  textAnalysis: CheckinTextAnalysis;
  baseline?: UserBaseline;
}

export class CheckinFusionEngine {
  async fuse(input: FusionInput): Promise<CheckinFusionResult> {
    const startTime = Date.now();

    try {
      // Normalize each modality to 0-100 scale
      const audioScore = input.audioFeatures ? this.normalizeAudioFeatures(input.audioFeatures, input.baseline) : null;

      const visualScore = input.visualFeatures
        ? this.normalizeVisualFeatures(input.visualFeatures, input.baseline)
        : null;

      const textScore = this.normalizeTextFeatures(input.textAnalysis, input.baseline);

      // Get confidence scores
      const audioConfidence = input.audioFeatures?.quality || 0;
      const visualConfidence = input.visualFeatures?.overallQuality || 0;
      const textConfidence = input.textAnalysis.quality;

      // Determine fusion strategy based on available modalities
      const hasAudio = audioScore !== null && !isNaN(audioScore);
      const hasVisual = visualScore !== null && !isNaN(visualScore);
      const hasText = textScore !== null && !isNaN(textScore);

      let fusionMethod: 'quality-weighted' | 'equal' | 'text-only';
      let mindMeasureScore: number;
      let overallConfidence: number;

      if (hasAudio && hasVisual && hasText) {
        // All modalities available - quality-weighted fusion
        fusionMethod = 'quality-weighted';
        const result = this.qualityWeightedFusion(
          audioScore!,
          visualScore!,
          textScore!,
          audioConfidence,
          visualConfidence,
          textConfidence
        );
        mindMeasureScore = result.score;
        overallConfidence = result.confidence;
      } else if ((hasAudio || hasVisual) && hasText) {
        // Two modalities available - equal weights
        fusionMethod = 'equal';
        const scores = [
          hasAudio ? { score: audioScore!, conf: audioConfidence } : null,
          hasVisual ? { score: visualScore!, conf: visualConfidence } : null,
          { score: textScore!, conf: textConfidence },
        ].filter((s) => s !== null) as Array<{ score: number; conf: number }>;

        mindMeasureScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
        overallConfidence = scores.reduce((sum, s) => sum + s.conf, 0) / scores.length;
      } else if (hasText) {
        // Text only
        fusionMethod = 'text-only';
        mindMeasureScore = textScore!;
        overallConfidence = textConfidence;
      } else {
        throw new CheckinMultimodalError('No valid modalities for fusion', 'NO_VALID_MODALITIES', false, 'fusion');
      }

      // Clamp to 0-100
      mindMeasureScore = Math.max(0, Math.min(100, mindMeasureScore));

      // Round to whole number
      mindMeasureScore = Math.round(mindMeasureScore);

      // Determine direction of change (vs baseline)
      const directionOfChange = input.baseline
        ? this.determineDirectionOfChange(mindMeasureScore, input.baseline)
        : 'same';

      // Compute uncertainty
      const uncertainty = this.computeUncertainty(overallConfidence, hasAudio, hasVisual, hasText, !!input.baseline);

      // Identify contributing factors
      const contributingFactors = this.identifyContributingFactors(
        input,
        audioScore,
        visualScore,
        textScore,
        mindMeasureScore
      );

      // Identify improvement areas
      const improvementAreas = this.identifyImprovementAreas(input, audioScore, visualScore, textScore);

      const processingTime = Date.now() - startTime;

      return {
        mindMeasureScore,
        directionOfChange,
        uncertainty,

        audioScore: audioScore !== null ? Math.round(audioScore) : audioScore,
        visualScore: visualScore !== null ? Math.round(visualScore) : visualScore,
        textScore: Math.round(textScore),

        audioConfidence,
        visualConfidence,
        textConfidence,
        overallConfidence,

        contributingFactors,
        improvementAreas,

        fusionMethod,
        processingTimeMs: processingTime,
      };
    } catch (error: unknown) {
      console.error('[FusionEngine] ❌ Fusion failed:', error);

      if (error instanceof CheckinMultimodalError) {
        throw error;
      }

      throw new CheckinMultimodalError(
        `Fusion failed: ${error instanceof Error ? error.message : String(error)}`,
        'FUSION_FAILED',
        true
      );
    }
  }

  private normalizeAudioFeatures(features: CheckinAudioFeatures, baseline?: UserBaseline): number {
    if (baseline?.audioBaseline) return this.computeZScoreBasedScore(features, baseline.audioBaseline);

    let score = 50;
    if (features.pitchVariability > 40 && features.pitchVariability < 80) score += 10;
    if (features.speakingRate > 100 && features.speakingRate < 150) score += 10;
    else if (features.speakingRate < 80 || features.speakingRate > 180) score -= 10;
    if (features.pauseFrequency > 5 && features.pauseFrequency < 20) score += 5;
    if (features.pauseDuration > 0.2 && features.pauseDuration < 0.5) score += 5;
    if (features.voiceEnergy > 0.001 && features.voiceEnergy < 0.01) score += 10;
    if (features.energyVariability < 0.005) score += 5;
    if (features.harmonicRatio > 0.05) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private normalizeVisualFeatures(features: CheckinVisualFeatures, baseline?: UserBaseline): number {
    if (baseline?.visualBaseline) return this.computeZScoreBasedScore(features, baseline.visualBaseline);

    let score = 50;
    if (features.smileFrequency > 0.1) score += 15 * features.smileFrequency;
    if (features.smileIntensity > 0.5) score += 10 * features.smileIntensity;
    if (features.eyeContact > 0.5) score += 10;
    if (features.gazeStability > 0.5) score += 5;
    if (features.headStability > 0.5) score += 10;
    score += 15 * features.emotionalValence;
    if (features.emotionalStability > 0.5) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private normalizeTextFeatures(analysis: CheckinTextAnalysis, baseline?: UserBaseline): number {
    if (baseline?.textBaseline) return this.computeZScoreBasedScore(analysis, baseline.textBaseline);

    let score = 50;
    score += analysis.sentimentScore * 30;
    score += (analysis.positiveWordRatio - analysis.negativeWordRatio) * 100;
    score += analysis.engagementScore * 10;
    score += analysis.expressivityScore * 5;
    score += analysis.coherenceScore * 5;
    score += analysis.certaintyScore * 5;
    score -= analysis.negationFrequency * 50;
    score -= (analysis.absolutismWords / analysis.transcriptLength) * 100;
    if (analysis.riskLevel === 'high') score -= 30;
    else if (analysis.riskLevel === 'moderate') score -= 15;
    else if (analysis.riskLevel === 'mild') score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private qualityWeightedFusion(
    audioScore: number,
    visualScore: number,
    textScore: number,
    audioConf: number,
    visualConf: number,
    textConf: number
  ): { score: number; confidence: number } {
    const totalConf = audioConf + visualConf + textConf;
    if (totalConf === 0) {
      return { score: (audioScore + visualScore + textScore) / 3, confidence: 0.5 };
    }
    const score =
      audioScore * (audioConf / totalConf) +
      visualScore * (visualConf / totalConf) +
      textScore * (textConf / totalConf);
    return { score, confidence: totalConf / 3 };
  }

  private computeZScoreBasedScore(
    features: CheckinAudioFeatures | CheckinVisualFeatures | CheckinTextAnalysis,
    baseline: Record<string, { mu: number; sigma: number }>
  ): number {
    const zScores: number[] = [];
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number' && baseline[key]) {
        const { mu, sigma } = baseline[key];
        if (sigma > 0) zScores.push((value - mu) / sigma);
      }
    }
    if (zScores.length === 0) return 50;
    return Math.max(0, Math.min(100, 50 + (zScores.reduce((s, z) => s + z, 0) / zScores.length) * 25));
  }

  private determineDirectionOfChange(currentScore: number, _baseline: UserBaseline): 'better' | 'same' | 'worse' {
    const baselineScore = 50;
    const diff = currentScore - baselineScore;
    if (diff > 5) return 'better';
    if (diff < -5) return 'worse';
    return 'same';
  }

  private computeUncertainty(
    confidence: number,
    hasAudio: boolean,
    hasVisual: boolean,
    hasText: boolean,
    hasBaseline: boolean
  ): number {
    let uncertainty = 1 - confidence;
    const modalityCount = [hasAudio, hasVisual, hasText].filter(Boolean).length;
    if (modalityCount < 3) uncertainty += 0.1 * (3 - modalityCount);
    if (!hasBaseline) uncertainty += 0.1;
    return Math.max(0, Math.min(1, uncertainty));
  }

  private identifyContributingFactors(
    input: FusionInput,
    audioScore: number | null,
    visualScore: number | null,
    _textScore: number | null,
    _finalScore: number
  ): string[] {
    const factors: string[] = [];

    // Text analysis provides the clearest signals
    const text = input.textAnalysis;

    if (text.positiveDrivers.length > 0) {
      factors.push(`Positive factors: ${text.positiveDrivers.slice(0, 2).join(', ')}`);
    }

    if (text.negativeDrivers.length > 0) {
      factors.push(`Challenges: ${text.negativeDrivers.slice(0, 2).join(', ')}`);
    }

    // Audio signals
    if (audioScore !== null) {
      if (audioScore > 60) {
        factors.push('Energetic and expressive speech');
      } else if (audioScore < 40) {
        factors.push('Low vocal energy or monotone speech');
      }
    }

    // Visual signals
    if (visualScore !== null) {
      const visual = input.visualFeatures!;
      if (visual.smileFrequency > 0.2) {
        factors.push('Frequent smiling');
      }
      if (visual.emotionalValence < -0.2) {
        factors.push('Negative facial expressions');
      }
    }

    // Sentiment
    if (text.sentimentScore > 0.1) {
      factors.push('Positive language and sentiment');
    } else if (text.sentimentScore < -0.1) {
      factors.push('Negative language patterns');
    }

    return factors.slice(0, 5); // Top 5
  }

  private identifyImprovementAreas(
    input: FusionInput,
    _audioScore: number | null,
    _visualScore: number | null,
    _textScore: number | null
  ): string[] {
    const areas: string[] = [];
    const text = input.textAnalysis;

    // Risk-based suggestions
    if (text.riskLevel === 'high' || text.riskLevel === 'moderate') {
      areas.push('Consider reaching out to a mental health professional');
    }

    // Specific challenges
    if (text.negativeDrivers.includes('sleep problems')) {
      areas.push('Focus on sleep hygiene and routine');
    }
    if (text.negativeDrivers.includes('stress/pressure')) {
      areas.push('Explore stress management techniques');
    }
    if (text.negativeDrivers.includes('loneliness')) {
      areas.push('Prioritize social connections');
    }

    // Low engagement
    if (text.engagementScore < 0.3) {
      areas.push('Share more about your experiences in check-ins');
    }

    // High negativity
    if (text.negativeWordRatio > 0.1) {
      areas.push('Notice and acknowledge positive moments');
    }

    return areas.slice(0, 3); // Top 3
  }
}
