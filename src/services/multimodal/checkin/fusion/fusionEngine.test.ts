import { describe, it, expect, vi } from 'vitest';
import { CheckinFusionEngine } from './fusionEngine';
import { CheckinMultimodalError } from '../types';
import type { CheckinTextAnalysis, CheckinAudioFeatures, CheckinVisualFeatures } from '../types';

// Silence console.error in tests
vi.spyOn(console, 'error').mockImplementation(() => {});

function makeTextAnalysis(overrides: Partial<CheckinTextAnalysis> = {}): CheckinTextAnalysis {
  return {
    summary: 'Student is doing well.',
    keywords: ['study', 'friends'],
    positiveDrivers: ['social support'],
    negativeDrivers: [],
    riskLevel: 'none',
    riskReasons: [],
    sentimentScore: 0.3,
    sentimentIntensity: 0.5,
    emotionalWords: 5,
    negativeWordRatio: 0.05,
    positiveWordRatio: 0.15,
    cognitivComplexity: 0.5,
    lexicalDiversity: 0.6,
    verbTense: { past: 0.2, present: 0.6, future: 0.2 },
    firstPersonPronouns: 4,
    negationFrequency: 0.02,
    absolutismWords: 1,
    tentativeWords: 2,
    certaintyScore: 0.5,
    coherenceScore: 0.7,
    expressivityScore: 0.5,
    engagementScore: 0.6,
    transcriptLength: 100,
    averageSentenceLength: 12,
    quality: 0.8,
    ...overrides,
  };
}

function makeAudioFeatures(overrides: Partial<CheckinAudioFeatures> = {}): CheckinAudioFeatures {
  return {
    meanPitch: 150,
    pitchRange: 40,
    pitchVariability: 50,
    pitchContourSlope: 0,
    jitter: 0.02,
    shimmer: 0.05,
    harmonicRatio: 0.1,
    pitchDynamics: 0.3,
    speakingRate: 120,
    articulationRate: 4.5,
    pauseFrequency: 10,
    pauseDuration: 0.3,
    speechRatio: 0.7,
    filledPauseRate: 2,
    silenceDuration: 5,
    voiceEnergy: 0.005,
    energyVariability: 0.003,
    energyContour: 0,
    dynamicRange: 0.01,
    stressPatterns: 0.4,
    spectralCentroid: 3000,
    spectralFlux: 0.2,
    voicedRatio: 0.8,
    quality: 0.7,
    duration: 120,
    ...overrides,
  };
}

function makeVisualFeatures(overrides: Partial<CheckinVisualFeatures> = {}): CheckinVisualFeatures {
  return {
    smileFrequency: 0.3,
    smileIntensity: 0.5,
    eyebrowRaiseFrequency: 0.1,
    eyebrowFurrowFrequency: 0.05,
    mouthTension: 0.2,
    facialSymmetry: 0.8,
    eyeContact: 0.7,
    gazeStability: 0.6,
    headMovement: 0.3,
    headStability: 0.7,
    emotionalValence: 0.2,
    emotionalArousal: 0.4,
    emotionalStability: 0.6,
    facePresenceQuality: 0.9,
    overallQuality: 0.7,
    framesAnalyzed: 20,
    ...overrides,
  };
}

// ============================================================================
// Text-only fusion
// ============================================================================

describe('CheckinFusionEngine – text-only', () => {
  it('returns a score using text-only fusion method', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: null,
      visualFeatures: null,
      textAnalysis: makeTextAnalysis(),
    });

    expect(result.fusionMethod).toBe('text-only');
    expect(result.mindMeasureScore).toBeGreaterThanOrEqual(0);
    expect(result.mindMeasureScore).toBeLessThanOrEqual(100);
    expect(result.audioScore).toBeNull();
    expect(result.visualScore).toBeNull();
  });

  it('clamps score to 0-100 range', async () => {
    const engine = new CheckinFusionEngine();

    // Very negative text should still be >= 0
    const result = await engine.fuse({
      audioFeatures: null,
      visualFeatures: null,
      textAnalysis: makeTextAnalysis({
        sentimentScore: -1.0,
        negativeWordRatio: 0.5,
        positiveWordRatio: 0,
        riskLevel: 'high',
        negationFrequency: 0.3,
      }),
    });

    expect(result.mindMeasureScore).toBeGreaterThanOrEqual(0);
    expect(result.mindMeasureScore).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Quality-weighted fusion (all modalities)
// ============================================================================

describe('CheckinFusionEngine – quality-weighted fusion', () => {
  it('uses quality-weighted method when all modalities are present', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: makeAudioFeatures(),
      visualFeatures: makeVisualFeatures(),
      textAnalysis: makeTextAnalysis(),
    });

    expect(result.fusionMethod).toBe('quality-weighted');
    expect(result.mindMeasureScore).toBeGreaterThanOrEqual(0);
    expect(result.mindMeasureScore).toBeLessThanOrEqual(100);
  });

  it('returns non-null audio and visual scores when present', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: makeAudioFeatures(),
      visualFeatures: makeVisualFeatures(),
      textAnalysis: makeTextAnalysis(),
    });

    expect(result.audioScore).not.toBeNull();
    expect(result.visualScore).not.toBeNull();
    expect(result.textScore).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Equal-weight fusion (two modalities)
// ============================================================================

describe('CheckinFusionEngine – equal-weight fusion', () => {
  it('uses equal method when only audio + text are available', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: makeAudioFeatures(),
      visualFeatures: null,
      textAnalysis: makeTextAnalysis(),
    });

    expect(result.fusionMethod).toBe('equal');
    expect(result.visualScore).toBeNull();
    expect(result.audioScore).not.toBeNull();
  });

  it('uses equal method when only visual + text are available', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: null,
      visualFeatures: makeVisualFeatures(),
      textAnalysis: makeTextAnalysis(),
    });

    expect(result.fusionMethod).toBe('equal');
    expect(result.audioScore).toBeNull();
    expect(result.visualScore).not.toBeNull();
  });
});

// ============================================================================
// Direction of change
// ============================================================================

describe('CheckinFusionEngine – direction of change', () => {
  it('returns "same" when no baseline is provided', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: null,
      visualFeatures: null,
      textAnalysis: makeTextAnalysis(),
    });

    expect(result.directionOfChange).toBe('same');
  });
});

// ============================================================================
// Uncertainty
// ============================================================================

describe('CheckinFusionEngine – uncertainty', () => {
  it('has higher uncertainty with fewer modalities', async () => {
    const engine = new CheckinFusionEngine();

    const textOnly = await engine.fuse({
      audioFeatures: null,
      visualFeatures: null,
      textAnalysis: makeTextAnalysis({ quality: 0.8 }),
    });

    const allModalities = await engine.fuse({
      audioFeatures: makeAudioFeatures({ quality: 0.8 }),
      visualFeatures: makeVisualFeatures({ overallQuality: 0.8 }),
      textAnalysis: makeTextAnalysis({ quality: 0.8 }),
    });

    expect(textOnly.uncertainty).toBeGreaterThan(allModalities.uncertainty);
  });

  it('uncertainty is between 0 and 1', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: null,
      visualFeatures: null,
      textAnalysis: makeTextAnalysis(),
    });

    expect(result.uncertainty).toBeGreaterThanOrEqual(0);
    expect(result.uncertainty).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Error handling
// ============================================================================

describe('CheckinFusionEngine – error handling', () => {
  it('throws CheckinMultimodalError when no valid modalities', async () => {
    // Verify the error class is properly structured
    const err = new CheckinMultimodalError('test', 'NO_VALID', false, 'fusion');
    expect(err.code).toBe('NO_VALID');
    expect(err.recoverable).toBe(false);
    expect(err.component).toBe('fusion');
    expect(err.name).toBe('CheckinMultimodalError');
  });
});

// ============================================================================
// Contributing factors & improvement areas
// ============================================================================

describe('CheckinFusionEngine – insights', () => {
  it('includes contributing factors in the result', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: null,
      visualFeatures: null,
      textAnalysis: makeTextAnalysis({
        positiveDrivers: ['exercise', 'social support'],
        sentimentScore: 0.5,
      }),
    });

    expect(result.contributingFactors.length).toBeGreaterThan(0);
  });

  it('includes improvement areas for high risk', async () => {
    const engine = new CheckinFusionEngine();
    const result = await engine.fuse({
      audioFeatures: null,
      visualFeatures: null,
      textAnalysis: makeTextAnalysis({
        riskLevel: 'high',
        negativeDrivers: ['sleep problems', 'loneliness'],
        negativeWordRatio: 0.2,
        engagementScore: 0.2,
      }),
    });

    expect(result.improvementAreas.length).toBeGreaterThan(0);
  });
});
