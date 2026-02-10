import { describe, it, expect } from 'vitest';
import { BaselineScoring } from './scoring';
import type { BaselineAudioFeatures, BaselineVisualFeatures } from '../types';

// ── Helpers ─────────────────────────────────────────────

function makeAudioFeatures(overrides: Partial<BaselineAudioFeatures> = {}): BaselineAudioFeatures {
  return {
    meanPitch: 165, // optimal
    pitchVariability: 10, // low = stable
    speakingRate: 150, // optimal wpm
    pauseFrequency: 5, // optimal per minute
    pauseDuration: 0.5, // optimal seconds
    voiceEnergy: 0.7,
    jitter: 0.1,
    shimmer: 0.1,
    harmonicRatio: 0.8,
    quality: 0.9,
    ...overrides,
  };
}

function makeVisualFeatures(overrides: Partial<BaselineVisualFeatures> = {}): BaselineVisualFeatures {
  return {
    smileFrequency: 0.6,
    smileIntensity: 0.5,
    eyeContact: 0.8,
    eyebrowPosition: 0.4, // neutral
    facialTension: 0.2, // relaxed
    blinkRate: 17, // optimal
    headMovement: 0.5, // moderate
    affect: 0.5, // positive
    facePresenceQuality: 0.9,
    overallQuality: 0.85,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────
// Dynamic Weighting
// ────────────────────────────────────────────────────────

describe('BaselineScoring.computeScore — dynamic weighting', () => {
  it('uses 100% clinical when both modalities fail', () => {
    const result = BaselineScoring.computeScore(80, null, null, true, true);

    expect(result.clinicalWeight).toBe(1.0);
    expect(result.multimodalWeight).toBe(0);
    expect(result.finalScore).toBe(80);
    expect(result.audioScore).toBeNull();
    expect(result.visualScore).toBeNull();
  });

  it('uses 85% clinical + 15% audio when only visual fails', () => {
    const audio = makeAudioFeatures();
    const result = BaselineScoring.computeScore(80, audio, null, false, true);

    expect(result.clinicalWeight).toBe(0.85);
    expect(result.multimodalWeight).toBe(0.15);
    expect(result.visualScore).toBeNull();
    expect(result.audioScore).not.toBeNull();
  });

  it('uses 85% clinical + 15% visual when only audio fails', () => {
    const visual = makeVisualFeatures();
    const result = BaselineScoring.computeScore(80, null, visual, true, false);

    expect(result.clinicalWeight).toBe(0.85);
    expect(result.multimodalWeight).toBe(0.15);
    expect(result.audioScore).toBeNull();
    expect(result.visualScore).not.toBeNull();
  });

  it('uses 70% clinical + 30% multimodal when both work', () => {
    const audio = makeAudioFeatures();
    const visual = makeVisualFeatures();
    const result = BaselineScoring.computeScore(80, audio, visual, false, false);

    expect(result.clinicalWeight).toBe(0.7);
    expect(result.multimodalWeight).toBe(0.3);
    expect(result.audioScore).not.toBeNull();
    expect(result.visualScore).not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────
// Score boundaries
// ────────────────────────────────────────────────────────

describe('BaselineScoring.computeScore — score properties', () => {
  it('returns a rounded integer for finalScore', () => {
    const audio = makeAudioFeatures();
    const visual = makeVisualFeatures();
    const result = BaselineScoring.computeScore(75.7, audio, visual);

    expect(Number.isInteger(result.finalScore)).toBe(true);
    expect(Number.isInteger(result.clinicalScore)).toBe(true);
  });

  it('handles clinicalScore of 0 without errors', () => {
    const result = BaselineScoring.computeScore(0, null, null, true, true);
    expect(result.finalScore).toBe(0);
  });

  it('handles clinicalScore of 100 without errors', () => {
    const result = BaselineScoring.computeScore(100, null, null, true, true);
    expect(result.finalScore).toBe(100);
  });

  it('returns confidence < 1 when clinical score is extreme', () => {
    const audio = makeAudioFeatures();
    const visual = makeVisualFeatures();
    const result = BaselineScoring.computeScore(10, audio, visual);

    expect(result.confidence).toBeLessThan(1);
  });

  it('returns confidence of 0.5 when both modalities fail', () => {
    const result = BaselineScoring.computeScore(50, null, null, true, true);
    expect(result.confidence).toBe(0.5);
  });
});

// ────────────────────────────────────────────────────────
// Feature quality impact
// ────────────────────────────────────────────────────────

describe('BaselineScoring.computeScore — quality impact', () => {
  it('low audio quality reduces the audio contribution', () => {
    const highQ = makeAudioFeatures({ quality: 0.9 });
    const lowQ = makeAudioFeatures({ quality: 0.2 });

    const resultHighQ = BaselineScoring.computeScore(80, highQ, null, false, true);
    const resultLowQ = BaselineScoring.computeScore(80, lowQ, null, false, true);

    // Both use 85/15 split, but low quality should push audio score lower
    expect(resultHighQ.audioScore!).toBeGreaterThan(resultLowQ.audioScore!);
  });

  it('low visual quality reduces the visual contribution', () => {
    const highQ = makeVisualFeatures({ overallQuality: 0.9 });
    const lowQ = makeVisualFeatures({ overallQuality: 0.2 });

    const resultHighQ = BaselineScoring.computeScore(80, null, highQ, true, false);
    const resultLowQ = BaselineScoring.computeScore(80, null, lowQ, true, false);

    expect(resultHighQ.visualScore!).toBeGreaterThan(resultLowQ.visualScore!);
  });
});
